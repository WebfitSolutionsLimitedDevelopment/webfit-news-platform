import { SITE_URL } from '@/lib/site';

/**
 * IndexNow tells Bing (which also powers DuckDuckGo, Yahoo, Copilot and
 * ChatGPT search), Yandex, Naver and Seznam that a page is new or changed, so
 * they recrawl it within minutes instead of days. Google does not use IndexNow;
 * it finds new stories through the news sitemap.
 *
 * The key is public by design: search engines confirm it by fetching
 * https://webfitnews.com/<key>.txt (public/<key>.txt).
 */
const INDEXNOW_KEY = '422e0c0057d4d1fd19dffce7b64d4546';

export async function notifyIndexNow(paths: Array<string | null | undefined>): Promise<void> {
  const urlList = [...new Set(paths.filter((p): p is string => Boolean(p && p.trim())).map(p => `${SITE_URL}/${p.replace(/^\/+/, '')}`))];
  if (!urlList.length || process.env.VERCEL_ENV !== 'production') return;
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // A failed ping only means search engines find the change on their next crawl.
  }
}
