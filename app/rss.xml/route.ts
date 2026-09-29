import { getLatestStories } from '@/lib/news';
import { SITE_NAME, SITE_URL, articleUrl } from '@/lib/site';

const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export async function GET() {
  const stories = await getLatestStories(50);
  const items = stories.filter(s => s.slug).map(s => {
    const url = articleUrl(s.slug);
    const image = (s as any).media?.public_url as string | undefined;
    return `<item><title>${esc(s.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid>${s.published_at ? `<pubDate>${new Date(s.published_at).toUTCString()}</pubDate>` : ''}<description>${esc(s.excerpt || '')}</description>${image ? `<enclosure url="${esc(image)}" type="image/jpeg" length="0"/>` : ''}</item>`;
  }).join('');
  const lastBuild = stories[0]?.published_at ? new Date(stories[0].published_at).toUTCString() : new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${SITE_NAME}</title><link>${SITE_URL}/</link><atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/><description>Independent New Zealand news, analysis and community reporting.</description><language>en-nz</language><lastBuildDate>${lastBuild}</lastBuildDate>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, s-maxage=300, stale-while-revalidate=300' } });
}
