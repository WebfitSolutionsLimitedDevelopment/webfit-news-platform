/**
 * Alt text that only repeats a camera/screenshot file name, a URL slug or is
 * too short to describe anything. Google Images and screen readers get nothing
 * useful from these, so the newsroom must replace them before publishing.
 */
export function isWeakAlt(alt?: string | null): boolean {
  const value = String(alt || '').trim();
  if (value.length < 12) return true;
  if (/^(img|image|dsc|dji|pxl|photo|screenshot|screen shot|whatsapp|chatgpt|gemini|untitled|download)[\s_-]*\d/i.test(value)) return true;
  if (/^(screenshot|chatgpt image|gemini generated)/i.test(value)) return true;
  if (!/\s/.test(value) && /-/.test(value)) return true;
  return false;
}

/** A file name turned into a starting alt text, or '' when it is just a camera/screenshot name. */
export function altFromFilename(name: string): string {
  const text = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return isWeakAlt(text) ? '' : text;
}

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
}

function altOf(tag: string) {
  const m = tag.match(/\salt=(["'])([\s\S]*?)\1/i);
  return m ? m[2] : null;
}

function withAlt(tag: string, alt: string) {
  const value = escapeAttr(alt.length > 150 ? alt.slice(0, 150).replace(/\s+\S*$/, '') : alt);
  if (/\salt=(["'])[\s\S]*?\1/i.test(tag)) return tag.replace(/\salt=(["'])[\s\S]*?\1/i, ` alt="${value}"`);
  return tag.replace(/^<img\b/i, `<img alt="${value}"`);
}

/**
 * Gives article-body images a usable description at render time: an image with
 * no alt text, or one that only repeats a file name, takes its figure caption,
 * or failing that the story headline. Stored HTML is not changed.
 */
export function describeBodyImages(html: string, fallback: string): string {
  if (!html || !/<img\b/i.test(html)) return html;
  const withCaptions = html.replace(/<figure\b[\s\S]*?<\/figure>/gi, figure => {
    const caption = figure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
    const text = caption ? plainText(caption[1]) : '';
    if (isWeakAlt(text)) return figure;
    return figure.replace(/<img\b[^>]*>/gi, tag => (isWeakAlt(altOf(tag)) ? withAlt(tag, text) : tag));
  });
  const title = plainText(fallback);
  if (!title) return withCaptions;
  return withCaptions.replace(/<img\b[^>]*>/gi, tag => (isWeakAlt(altOf(tag)) ? withAlt(tag, title) : tag));
}
