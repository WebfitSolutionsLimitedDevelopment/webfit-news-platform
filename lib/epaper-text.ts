/**
 * Turn story HTML into plain text blocks the e-paper can flow across columns and pages.
 * Images, embeds and scripts are dropped; tables become one line per row.
 */

export type BlockKind = 'p' | 'h' | 'li' | 'quote' | 'row';
export type TextBlock = { k: BlockKind; t: string };

const ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', quot: '"', apos: '’', lt: '<', gt: '>', hellip: '…', mdash: '—', ndash: '–',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', bull: '•', middot: '·', copy: '©', reg: '®', trade: '™', deg: '°',
};

function decode(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

function toText(html: string) {
  return decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** "By Webfit News | 7 October 2026" style lines repeat what the page already shows. */
const DATELINE = /^(?:by\s+[^|]{2,60}\|\s*)?(?:[^|]{2,40}\|\s*)?(?:updated\s+)?\d{1,2}\s+[a-z]+\s+\d{4}$/i;
const BYLINE_ONLY = /^by\s+webfit news$/i;

export function htmlToBlocks(html: string | null | undefined, title = ''): TextBlock[] {
  if (!html) return [];
  let s = html
    .replace(/<(script|style|iframe|video|audio|figure|picture|noscript|svg|object)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<img\b[^>]*>/gi, ' ');

  // Tables: one block per row, cells joined with " · ".
  s = s.replace(/<table\b[\s\S]*?<\/table>/gi, table => {
    const rows = Array.from(table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map(r =>
      Array.from(r[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)).map(c => toText(c[1])).filter(Boolean).join(' · '));
    return rows.filter(Boolean).map(r => `<row>${r}</row>`).join('');
  });

  // Some stories are pasted as one <div> per line with no <p> tags at all.
  // Treat those lines as paragraphs, otherwise the whole story becomes one
  // block and bylines and subheadings run into the text.
  const fromDivs = !/<p\b/i.test(s) && /<div\b/i.test(s);
  if (fromDivs) {
    s = s.replace(/<div\b[^>]*>/gi, '<p>').replace(/<\/div>/gi, '</p>');
  } else {
    s = s.replace(/<\/?(?:div|section|article)\b[^>]*>/gi, ' ');
  }
  s = s.replace(/<\/?(?:span|font)\b[^>]*>/gi, ' ');

  // Quotes keep their text as one block.
  s = s.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, inner) => `<quote>${toText(inner)}</quote>`);

  const blocks: TextBlock[] = [];
  const re = /<(p|h[1-6]|li|quote|row)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  let found = false;
  while ((match = re.exec(s))) {
    found = true;
    const tag = match[1].toLowerCase();
    const text = toText(match[2]);
    if (!text) continue;
    // A short paragraph that is entirely bold is a subheading in our CMS.
    const allBold = tag === 'p' && text.length <= 120 && /^\s*<(strong|b)\b[^>]*>[\s\S]*<\/\1>\s*$/i.test(match[2]) && !/[.!?]["”’]?$/.test(text);
    // Stories pasted line by line have plain-text subheadings: a short line with no closing punctuation.
    const plainSub = fromDivs && tag === 'p' && text.length <= 90 && text.split(' ').length >= 2 && !/[.!?:;,"”’)]$/.test(text) && !/^(source|currency note|by)\b/i.test(text);
    const k: BlockKind = tag.startsWith('h') || allBold || plainSub ? 'h' : tag === 'li' ? 'li' : tag === 'quote' ? 'quote' : tag === 'row' ? 'row' : 'p';
    blocks.push({ k, t: text });
  }
  if (!found) {
    for (const part of decode(s.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n').replace(/<[^>]*>/g, ' ')).split(/\n\s*\n/)) {
      const text = part.replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ k: 'p', t: text });
    }
  }

  // Drop the dateline/byline at the top and a first paragraph that repeats the headline.
  const cleanTitle = title.trim().toLowerCase();
  while (blocks.length && (DATELINE.test(blocks[0].t) || BYLINE_ONLY.test(blocks[0].t) || (cleanTitle && blocks[0].t.toLowerCase() === cleanTitle))) blocks.shift();
  // A dateline/byline a line or two further down (after a pasted standfirst) also repeats the page furniture.
  for (let i = Math.min(blocks.length, 3) - 1; i >= 0; i -= 1) if (DATELINE.test(blocks[i].t) || BYLINE_ONLY.test(blocks[i].t)) blocks.splice(i, 1);
  if (blocks[0]?.k === 'p') blocks[0].t = blocks[0].t.replace(/^\d{1,2}\s+[A-Z][a-z]+\s+\d{4}\s+(?=[A-Z])/, '');
  return blocks;
}
