import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import sanitizeHtml from 'sanitize-html';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_TEXT = 120000;
const MAX_REDIRECTS = 4;

export type ImportedSource = {
  text: string;
  label: string;
  kind: 'file' | 'url';
  contentType: string | null;
  filename: string | null;
  url: string | null;
};

function limitText(value: string) {
  const cleaned = value.replace(/\u0000/g, '').replace(/\r\n?/g, '\n').trim();
  if (cleaned.length < 40) throw new Error('The source does not contain enough readable text to prepare an article.');
  if (cleaned.length > MAX_TEXT) throw new Error(`The extracted source is too large. Keep source text under ${MAX_TEXT.toLocaleString()} characters.`);
  return cleaned;
}

function extensionOf(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)(?:[?#].*)?$/);
  return match?.[1] || '';
}

function htmlToText(value: string) {
  const withoutNoise = value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|article|section|main|header|footer|h[1-6]|li|tr|blockquote)>/gi, '\n')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ');
  return sanitizeHtml(withoutNoise, {
    allowedTags: [],
    allowedAttributes: {},
    textFilter: text => text,
  })
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function jsonToText(value: unknown, depth = 0): string {
  if (depth > 8 || value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(item => jsonToText(item, depth + 1)).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const nested = jsonToText(item, depth + 1);
        return nested ? `${key}: ${nested}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function xmlToText(value: string) {
  return htmlToText(value.replace(/<\?xml[\s\S]*?\?>/gi, ' ').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1'));
}

function decodeText(buffer: Buffer) {
  const utf8 = buffer.toString('utf8');
  const replacementCount = (utf8.match(/�/g) || []).length;
  if (replacementCount <= Math.max(2, utf8.length * 0.002)) return utf8;
  return buffer.toString('latin1');
}

async function pdfToText(buffer: Buffer) {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text || '';
  } finally {
    await parser.destroy();
  }
}

async function wordToText(buffer: Buffer) {
  const module = await import('word-extractor');
  const WordExtractor = module.default;
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);
  return [document.getBody(), document.getFootnotes(), document.getTextboxes({ includeHeadersAndFooters: true, includeBody: true })]
    .filter(Boolean)
    .join('\n\n');
}

function rtfToText(value: string) {
  return value
    .replace(/\\par[d]?\b/g, '\n')
    .replace(/\\'[0-9a-fA-F]{2}/g, ' ')
    .replace(/\\[a-zA-Z]+-?\d* ?/g, ' ')
    .replace(/[{}]/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

async function extractBuffer(buffer: Buffer, filename: string, contentType: string | null) {
  if (buffer.byteLength > MAX_BYTES) throw new Error('Source files must be 8 MB or smaller.');
  const ext = extensionOf(filename);
  const type = (contentType || '').toLowerCase().split(';')[0].trim();

  if (ext === 'pdf' || type === 'application/pdf') return limitText(await pdfToText(buffer));
  if (ext === 'doc' || ext === 'docx' || type === 'application/msword' || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return limitText(await wordToText(buffer));
  }

  const text = decodeText(buffer);
  if (ext === 'json' || type === 'application/json' || type.endsWith('+json')) {
    try { return limitText(jsonToText(JSON.parse(text))); }
    catch { throw new Error('The JSON source could not be parsed.'); }
  }
  if (ext === 'xml' || type === 'application/xml' || type === 'text/xml' || type.endsWith('+xml')) return limitText(xmlToText(text));
  if (ext === 'html' || ext === 'htm' || type === 'text/html') return limitText(htmlToText(text));
  if (ext === 'rtf' || type === 'application/rtf' || type === 'text/rtf') return limitText(rtfToText(text));
  if (['txt','md','markdown','csv','tsv'].includes(ext) || type.startsWith('text/') || !type) return limitText(text);

  throw new Error('Unsupported source format. Use TXT, PDF, DOC, DOCX, JSON, XML, HTML, Markdown, CSV or RTF.');
}

function isPrivateIp(address: string) {
  if (isIP(address) === 4) {
    const [a,b] = address.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    return lower === '::1' || lower === '::' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb');
  }
  return true;
}

async function assertPublicUrl(value: string) {
  let parsed: URL;
  try { parsed = new URL(value); }
  catch { throw new Error('Enter a valid source URL.'); }
  if (!['http:','https:'].includes(parsed.protocol)) throw new Error('Source URL must use HTTP or HTTPS.');
  if (parsed.username || parsed.password) throw new Error('Source URLs with embedded credentials are not allowed.');
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) throw new Error('Private or local source URLs are not allowed.');
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error('Private or local source URLs are not allowed.');
  } else {
    const resolved = await lookup(hostname, { all: true, verbatim: true });
    if (!resolved.length || resolved.some(item => isPrivateIp(item.address))) throw new Error('Source URL resolves to a private or unavailable address.');
  }
  return parsed;
}

async function fetchPublicSource(value: string, redirects = 0): Promise<{ buffer: Buffer; filename: string; contentType: string | null; finalUrl: string }> {
  if (redirects > MAX_REDIRECTS) throw new Error('The source URL redirected too many times.');
  const parsed = await assertPublicUrl(value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(parsed, {
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'user-agent': 'WebfitNews-CMS-Importer/1.0',
        'accept': 'text/html,text/plain,application/json,application/xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document;q=0.9,*/*;q=0.5',
      },
    });
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('The source URL returned an invalid redirect.');
      return fetchPublicSource(new URL(location, parsed).toString(), redirects + 1);
    }
    if (!response.ok) throw new Error(`Source URL returned HTTP ${response.status}.`);
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > MAX_BYTES) throw new Error('Source URL content must be 8 MB or smaller.');
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) throw new Error('Source URL content must be 8 MB or smaller.');
    const finalUrl = parsed.toString();
    const pathnameName = decodeURIComponent(parsed.pathname.split('/').pop() || 'source');
    return {
      buffer: Buffer.from(arrayBuffer),
      filename: pathnameName || 'source',
      contentType: response.headers.get('content-type'),
      finalUrl,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('The source URL took too long to respond.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractUploadedSource(file: File): Promise<ImportedSource> {
  if (file.size > MAX_BYTES) throw new Error('Source files must be 8 MB or smaller.');
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    text: await extractBuffer(buffer, file.name, file.type || null),
    label: file.name,
    kind: 'file',
    contentType: file.type || null,
    filename: file.name,
    url: null,
  };
}

export async function extractUrlSource(value: string): Promise<ImportedSource> {
  const fetched = await fetchPublicSource(value);
  const text = await extractBuffer(fetched.buffer, fetched.filename, fetched.contentType);
  return {
    text,
    label: fetched.finalUrl,
    kind: 'url',
    contentType: fetched.contentType,
    filename: fetched.filename,
    url: fetched.finalUrl,
  };
}
