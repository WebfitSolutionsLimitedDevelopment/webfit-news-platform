/**
 * One address per page. Every canonical tag, sitemap entry, feed link,
 * structured-data URL and share link must use these helpers so Google only
 * ever sees https://webfitnews.com/<path> with no trailing slash.
 */
export const SITE_URL = 'https://webfitnews.com';
export const SITE_NAME = 'Webfit News';
export const SITE_HOST = 'webfitnews.com';

/** Hosts that serve this site and must never appear in a canonical URL. */
export const OWN_HOSTS = new Set(['webfitnews.com', 'www.webfitnews.com', 'webfitnews.co.nz', 'www.webfitnews.co.nz']);

export function absoluteUrl(path = '/'): string {
  const clean = `/${String(path || '').replace(/^\/+/, '')}`;
  if (clean === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${clean.replace(/\/+$/, '')}`;
}

export function articleUrl(slug: string): string {
  return absoluteUrl(`/${slug.trim()}`);
}

/**
 * Canonical for a story. Stored canonical_url values from the WordPress
 * migration point at webfitnews.co.nz/<slug>/, which now redirects, so any
 * canonical on one of our own hosts is replaced by the live address. A
 * canonical on another site (syndicated content) is kept.
 */
export function articleCanonical(slug: string, stored?: string | null): string {
  if (stored) {
    try {
      const url = new URL(stored);
      if (!OWN_HOSTS.has(url.hostname.toLowerCase())) return url.toString();
    } catch {}
  }
  return articleUrl(slug);
}

/** Sections that are advertising or housekeeping, not journalism: kept out of search. */
export const NOINDEX_SECTIONS = new Set(['advertisement', 'business-ads', 'uncategorized', 'events-offers']);
