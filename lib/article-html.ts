import sanitizeHtml from 'sanitize-html';

const ARTICLE_TAGS = Array.from(new Set([
  ...sanitizeHtml.defaults.allowedTags,
  'figure','figcaption','iframe','video','source','picture','thead','tbody','tfoot','caption',
]));

export function sanitizeArticleHtml(value: string) {
  return sanitizeHtml(value || '', {
    allowedTags: ARTICLE_TAGS,
    allowedAttributes: {
      '*': ['class'],
      a: ['href','target','rel','title'],
      img: ['src','alt','title','width','height','loading','srcset','sizes'],
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
}

export function articleHtmlToText(value: string) {
  return sanitizeHtml(value || '', { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}
