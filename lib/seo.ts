export const SEO_TITLE_MAX_LENGTH = 60;
export const SEO_DESCRIPTION_MAX_LENGTH = 155;

export function truncateSeoText(value: string | null | undefined, maxLength: number): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();

  if (!text || text.length <= maxLength) {
    return text;
  }

  const hardCut = text.slice(0, maxLength + 1);
  const lastSpace = hardCut.lastIndexOf(' ');

  const truncated =
    lastSpace >= Math.floor(maxLength * 0.7)
      ? hardCut.slice(0, lastSpace)
      : text.slice(0, maxLength);

  return truncated.replace(/[\s,;:.-]+$/g, '').trim();
}
