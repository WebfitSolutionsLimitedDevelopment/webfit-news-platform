import { getLatestStories } from '@/lib/news';

const SITE_URL = 'https://webfitnews.com';
const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

export async function GET(){
  const stories=await getLatestStories(1000);
  const now=Date.now();
  const recent=stories.filter(s=>{
    if(!s.slug?.trim()||!s.published_at)return false;
    const published=new Date(s.published_at).getTime();
    return Number.isFinite(published)&&published<=now&&now-published<=NEWS_WINDOW_MS;
  });
  const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const urls=recent.map(s=>`<url><loc>${SITE_URL}/${s.slug.trim()}/</loc><news:news><news:publication><news:name>Webfit News</news:name><news:language>en</news:language></news:publication><news:publication_date>${new Date(s.published_at!).toISOString()}</news:publication_date><news:title>${esc(s.title)}</news:title></news:news></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`,{headers:{'content-type':'application/xml; charset=utf-8'}});
}
