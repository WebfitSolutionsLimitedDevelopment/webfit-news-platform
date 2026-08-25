import sanitizeHtml from 'sanitize-html';

const ARTICLE_TAGS = Array.from(new Set([
  ...sanitizeHtml.defaults.allowedTags,
  'figure','figcaption','iframe','video','source','picture','img','div','thead','tbody','tfoot','caption',
]));

function inlineFigureKey(figureHtml: string) {
  const instance = figureHtml.match(/\bdata-inline-instance=["']([^"']+)["']/i)?.[1];
  if (instance) return `instance:${instance}`;

  const mediaId = figureHtml.match(/\bdata-media-id=["']([^"']+)["']/i)?.[1];
  if (mediaId) return `media:${mediaId}`;

  const src = figureHtml.match(/\bsrc=["']([^"']+)["']/i)?.[1];
  return src ? `src:${src}` : null;
}

function removeAccidentalWholeBlockBold(html: string) {
  let current = html;
  let previous = '';

  // Only unwrap bold when it is the sole meaningful content of a normal prose
  // block. Partial emphasis remains untouched. Headings are intentionally not
  // included because headings should remain visually bold.
  const pattern = /<(p|li|blockquote|figcaption)(\b[^>]*)>\s*<(strong|b)(?:\b[^>]*)>([\s\S]*?)<\/\3>\s*<\/\1>/gi;

  while (current !== previous) {
    previous = current;
    current = current.replace(pattern, '<$1$2>$4</$1>');
  }

  return current;
}

function dedupeInlineFiguresKeepLast(html: string) {
  const figures = Array.from(
    html.matchAll(/<figure\b[^>]*class=["'][^"']*\barticle-inline-image\b[^"']*["'][^>]*>[\s\S]*?<\/figure>/gi)
  );
  if (figures.length < 2) return html;

  const lastIndexByKey = new Map<string, number>();
  figures.forEach((match, index) => {
    const key = inlineFigureKey(match[0]);
    if (key) lastIndexByKey.set(key, index);
  });

  let figureIndex = 0;
  return html.replace(
    /<figure\b[^>]*class=["'][^"']*\barticle-inline-image\b[^"']*["'][^>]*>[\s\S]*?<\/figure>/gi,
    (figure) => {
      const key = inlineFigureKey(figure);
      const keep = !key || lastIndexByKey.get(key) === figureIndex;
      figureIndex += 1;
      return keep ? figure : '';
    }
  );
}

export function sanitizeArticleHtml(value: string) {
  const clean = sanitizeHtml(value || '', {
    allowedTags: ARTICLE_TAGS,
    allowedAttributes: {
      '*': ['class','data-inline-instance'],
      a: ['href','target','rel','title'],
      img: ['src','alt','title','width','height','loading','decoding','srcset','sizes','data-media-id','referrerpolicy'],
      figure: ['class'],
      iframe: ['src','title','allow','allowfullscreen','width','height','loading','referrerpolicy'],
      video: ['src','controls','poster','preload'],
      source: ['src','type','srcset','sizes'],
      table: ['summary'],
      th: ['colspan','rowspan','scope'],
      td: ['colspan','rowspan'],
    },
    allowedSchemes: ['http','https','mailto','tel'],
    allowedIframeHostnames: ['www.youtube.com','youtube.com','www.youtube-nocookie.com','player.vimeo.com'],
    transformTags: {
      h1: 'h2',
      a: (tagName: string, attribs: Record<string,string>) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          ...(attribs.target === '_blank' ? { target: '_blank' } : {}),
        },
      }),
      img: (tagName: string, attribs: Record<string,string>) => ({
        tagName,
        attribs: {
          ...attribs,
          loading: attribs.loading || 'lazy',
          decoding: attribs.decoding || 'async',
          referrerpolicy: 'no-referrer',
        },
      }),
      iframe: (tagName: string, attribs: Record<string,string>) => ({
        tagName,
        attribs: {
          ...attribs,
          loading: 'lazy',
          referrerpolicy: 'strict-origin-when-cross-origin',
        },
      }),
    },
  });

  return removeAccidentalWholeBlockBold(dedupeInlineFiguresKeepLast(clean));
}

export function articleHtmlToText(value: string) {
  return sanitizeHtml(value || '', { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}
