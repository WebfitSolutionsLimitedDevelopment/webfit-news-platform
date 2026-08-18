import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PDFParse } from 'pdf-parse';
import WordExtractor from 'word-extractor';
import { createClient } from '../../../../lib/supabase-server';
import { convertMediaRelease } from '../../../../lib/media-release-converter';

export const runtime = 'nodejs';

const MAX_UPLOAD_BYTES = 4_000_000;
const MAX_REMOTE_BYTES = 12_000_000;
const MAX_TEXT_CHARS = 120_000;
const MAX_REDIRECTS = 4;

const Categories = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(120),
  }),
).max(250);

function tidyText(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '-', mdash: '-', hellip: '...', rsquo: "'", lsquo: "'",
    rdquo: '"', ldquo: '"',
  };
  return value
    .replace(/&([a-zA-Z]+);/g, (match, name) => named[name.toLowerCase()] ?? match)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function htmlToText(html: string) {
  const preferred =
    html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
    html;

  const text = preferred
    .replace(/<(script|style|noscript|svg|form|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|main|h[1-6]|li|tr|blockquote)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, ' ');

  return tidyText(decodeEntities(text));
}

function isPrivateV4(ip: string) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(Number.isNaN)) return true;
  return (
    p[0] === 10 ||
    p[0] === 127 ||
    p[0] === 0 ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) ||
    (p[0] === 100 && p[1] >= 64 && p[1] <= 127) ||
    p[0] >= 224
  );
}

function isPrivateAddress(address: string) {
  const lower = address.toLowerCase();
  if (lower.startsWith('::ffff:')) return isPrivateV4(lower.slice(7));
  if (isIP(address) === 4) return isPrivateV4(address);
  if (isIP(address) === 6) {
    return (
      lower === '::1' ||
      lower === '::' ||
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb')
    );
  }
  return true;
}

async function assertPublicUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http and https URLs are supported.');
  if (url.username || url.password) throw new Error('URLs containing credentials are not supported.');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) throw new Error('Local network URLs are not allowed.');

  if (isIP(url.hostname)) {
    if (isPrivateAddress(url.hostname)) throw new Error('Private network URLs are not allowed.');
    return;
  }

  const records = await lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some(record => isPrivateAddress(record.address))) {
    throw new Error('This URL resolves to a private or unavailable network address.');
  }
}

async function safeFetch(startUrl: string) {
  let url = new URL(startUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
      headers: {
        'user-agent': 'WebfitNews-Newsroom-Importer/1.0',
        accept: 'text/html,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document;q=0.9,*/*;q=0.5',
      },
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Source URL redirected without a destination.');
      url = new URL(location, url);
      continue;
    }

    if (!response.ok) throw new Error(`Source URL returned HTTP ${response.status}.`);
    const length = Number(response.headers.get('content-length') || 0);
    if (length && length > MAX_REMOTE_BYTES) throw new Error('Remote source is too large to import.');
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > MAX_REMOTE_BYTES) throw new Error('Remote source is too large to import.');
    return {
      data,
      contentType: (response.headers.get('content-type') || '').toLowerCase(),
      finalUrl: url,
    };
  }
  throw new Error('Source URL redirected too many times.');
}

async function textFromBuffer(buffer: Buffer, filename: string, contentType = '') {
  const lower = filename.toLowerCase();
  const isPdf = lower.endsWith('.pdf') || contentType.includes('application/pdf');
  const isWord =
    lower.endsWith('.doc') ||
    lower.endsWith('.docx') ||
    contentType.includes('application/msword') ||
    contentType.includes('wordprocessingml.document');

  if (isPdf) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return tidyText(result.text || '');
    } finally {
      await parser.destroy();
    }
  }

  if (isWord) {
    const extractor = new WordExtractor();
    const document = await extractor.extract(buffer);
    return tidyText(document.getBody());
  }

  if (
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    contentType.includes('text/plain') ||
    contentType.includes('text/markdown')
  ) {
    return tidyText(buffer.toString('utf8'));
  }

  if (
    lower.endsWith('.html') ||
    lower.endsWith('.htm') ||
    contentType.includes('text/html') ||
    contentType.includes('application/xhtml')
  ) {
    return htmlToText(buffer.toString('utf8'));
  }

  throw new Error('Unsupported source. Use PDF, Word (.doc/.docx), TXT, or a normal webpage URL.');
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('is_active').eq('id', user.id).maybeSingle();
  if (!profile?.is_active) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const form = await req.formData();
    const categoryInput = String(form.get('categories') || '[]');
    const parsedCategories = Categories.safeParse(JSON.parse(categoryInput));
    if (!parsedCategories.success) {
      return NextResponse.json({ error: 'Invalid category data.' }, { status: 422 });
    }

    const file = form.get('file');
    const sourceUrl = String(form.get('url') || '').trim();
    let rawText = '';
    let sourceLabel = '';

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: 'Uploaded source must be smaller than 4 MB. For a larger document, use a public URL to the file.' }, { status: 413 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      rawText = await textFromBuffer(buffer, file.name, file.type);
      sourceLabel = file.name;
    } else if (sourceUrl) {
      const fetched = await safeFetch(sourceUrl);
      const filename = decodeURIComponent(fetched.finalUrl.pathname.split('/').pop() || 'webpage.html');
      rawText = await textFromBuffer(fetched.data, filename, fetched.contentType);
      sourceLabel = fetched.finalUrl.toString();
    } else {
      return NextResponse.json({ error: 'Choose a file or enter a source URL.' }, { status: 422 });
    }

    if (rawText.length < 40) {
      return NextResponse.json({
        error: 'No readable article text was found. If this is a scanned/image-only PDF, it needs OCR before it can be imported.',
      }, { status: 422 });
    }

    const draft = convertMediaRelease(rawText, parsedCategories.data);
    return NextResponse.json({
      raw_text: rawText,
      source_label: sourceLabel,
      draft,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Could not import source.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
