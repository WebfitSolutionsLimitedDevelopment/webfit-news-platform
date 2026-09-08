import { getLatestStories } from '@/lib/news';

const SITE_URL = 'https://webfitnews.com';
const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

export const dynamic = 'force-dynamic';
export const revalidate = 300;

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(){
  const stories=await getLatestStories(1000);
  const now=Date.now();
  const recent=stories.filter(s=>{
    if(!s.slug?.trim()||!s.published_at||!s.title?.trim())return false;
    const published=new Date(s.published_at).getTime();
    return Number.isFinite(published)&&published<=now&&now-published<=NEWS_WINDOW_MS;
  });

  const urls=recent.map(s=>{
    const loc=escapeXml(`${SITE_URL}/${s.slug.trim()}/`);
    const title=escapeXml(s.title.trim());
    const published=escapeXml(new Date(s.published_at!).toISOString());
    return `<url><loc>${loc}</loc><news:news><news:publication><news:name>Webfit News</news:name><news:language>en</news:language></news:publication><news:publication_date>${published}</news:publication_date><news:title>${title}</news:title></news:news></url>`;
  }).join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`,
    {headers:{
      'content-type':'application/xml; charset=utf-8',
      'cache-control':'public, s-maxage=300, stale-while-revalidate=300',
    }}
  );
}
