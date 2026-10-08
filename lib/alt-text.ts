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
