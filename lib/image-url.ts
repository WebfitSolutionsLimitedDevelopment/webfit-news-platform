/**
 * Serve Supabase Storage images at the size a slot needs instead of the full
 * upload. Uses Supabase's image resizer (billed per distinct source image per
 * month; see the SEO status notes). "contain" keeps the image's shape: the
 * default "cover" mode crops to the original height when only a width is
 * given. The resizer never upscales, and sends WebP to browsers that accept it.
 * GIFs and images hosted anywhere else are returned unchanged.
 */
const STORAGE_OBJECT = '/storage/v1/object/public/';
const STORAGE_RENDER = '/storage/v1/render/image/public/';

export function canResize(url?: string | null): url is string {
  return Boolean(url && url.includes(STORAGE_OBJECT) && !/\.gif($|\?)/i.test(url));
}

export function resizedImage(url: string, width: number, quality = 75): string {
  if (!canResize(url)) return url;
  const [base] = url.split('?');
  return `${base.replace(STORAGE_OBJECT, STORAGE_RENDER)}?width=${width}&resize=contain&quality=${quality}`;
}

export function imageSrcSet(url: string, widths: number[], quality = 75): string | undefined {
  if (!canResize(url)) return undefined;
  return widths.map(w => `${resizedImage(url, w, quality)} ${w}w`).join(', ');
}

/** src + srcSet + sizes for an <img>, ready to spread. */
export function responsiveImage(url: string, widths: number[], sizes: string, quality = 75) {
  if (!canResize(url)) return { src: url };
  const fallback = widths[Math.min(1, widths.length - 1)];
  return { src: resizedImage(url, fallback, quality), srcSet: imageSrcSet(url, widths, quality), sizes };
}

const BODY_WIDTHS = [480, 800, 1200];
const BODY_SIZES = '(max-width: 880px) 100vw, 850px';

/**
 * Add a srcset to images inside story HTML that point at our storage, and make
 * them lazy-load. Tags that already have a srcset are left alone.
 */
export function responsiveBodyImages(html: string): string {
  if (!html || !html.includes(STORAGE_OBJECT)) return html;
  return html.replace(/<img\b[^>]*>/gi, tag => {
    if (/\ssrcset=/i.test(tag)) return tag;
    const match = tag.match(/\ssrc=(["'])(.*?)\1/i);
    const src = match?.[2]?.replace(/&amp;/g, '&');
    if (!src || !canResize(src)) return tag;
    const attrs = [
      `src="${resizedImage(src, 800)}"`,
      `srcset="${imageSrcSet(src, BODY_WIDTHS)}"`,
      `sizes="${BODY_SIZES}"`,
      /\sloading=/i.test(tag) ? '' : 'loading="lazy"',
      /\sdecoding=/i.test(tag) ? '' : 'decoding="async"',
    ].filter(Boolean).join(' ');
    return tag.replace(match![0], ` ${attrs}`);
  });
}
