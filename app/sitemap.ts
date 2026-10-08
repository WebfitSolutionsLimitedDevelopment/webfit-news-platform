import type { MetadataRoute } from 'next';
import { createPublicClient as createClient } from '../lib/supabase-public';
import { NOINDEX_SECTIONS, SITE_URL, articleUrl } from '../lib/site';
import { TOPICS } from '../lib/topics';

/** Rebuilt every 15 minutes so new stories reach Google quickly without querying on every crawl. */
export const revalidate = 900;

const pdfToolSlugs=['pdf-to-jpg','jpg-to-pdf','pdf-to-word','word-to-pdf','merge-pdf','split-pdf','compress-pdf','pdf-to-png','rotate-pdf','watermark-pdf','png-to-pdf','pdf-to-text','word-to-jpg','remove-pdf-pages','organize-pdf-pages','add-page-numbers-to-pdf','text-to-pdf'];
const evergreenPages: MetadataRoute.Sitemap = [
  {url:`${SITE_URL}/ilikemypdf`,changeFrequency:'monthly',priority:0.95},
  ...pdfToolSlugs.map(slug=>({url:`${SITE_URL}/ilikemypdf/${slug}`,changeFrequency:'monthly' as const,priority:0.9})),
  {url:`${SITE_URL}/topics`,changeFrequency:'daily',priority:0.8},
  ...TOPICS.map(t=>({url:`${SITE_URL}/topics/${t.slug}`,changeFrequency:'hourly' as const,priority:0.9})),
  {url:`${SITE_URL}/world`,changeFrequency:'daily',priority:0.95},
  {url:`${SITE_URL}/world/weather`,changeFrequency:'hourly',priority:0.95},
  {url:`${SITE_URL}/world/public-holidays`,changeFrequency:'daily',priority:0.95},
  {url:`${SITE_URL}/world/visa-immigration`,changeFrequency:'daily',priority:0.95},
  {url:`${SITE_URL}/world/currency-converter`,changeFrequency:'daily',priority:0.95},
  {url:`${SITE_URL}/world/gold-price`,changeFrequency:'hourly',priority:0.95},
  {url:`${SITE_URL}/world/time`,changeFrequency:'daily',priority:0.95},
  {url:`${SITE_URL}/world/major-sports`,changeFrequency:'daily',priority:0.95},
  {url:`${SITE_URL}/world/travel-requirements`,changeFrequency:'daily',priority:0.95},
  {url:`${SITE_URL}/world/ai-technology`,changeFrequency:'hourly',priority:0.95},
  {url:`${SITE_URL}/world/news`,changeFrequency:'hourly',priority:0.98},
  {url:`${SITE_URL}/nz-guides`,changeFrequency:'weekly',priority:0.9},
  {url:`${SITE_URL}/scam-check`,changeFrequency:'daily',priority:0.95},
  {url:`${SITE_URL}/recalls`,changeFrequency:'hourly',priority:0.95},
  {url:`${SITE_URL}/minimum-wage`,changeFrequency:'daily',priority:0.9},
  {url:`${SITE_URL}/nz-paye-calculator`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/nz-acc-levy-calculator`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/nz-tax-code-finder`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/nz-kiwisaver-calculator`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/nz-student-loan-calculator`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/nz-superannuation`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/nz-citizenship`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/nz-rates-rebate-calculator`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/nz-tenancy-rent-guide`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/nz-holiday-pay-calculator`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/nz-leave-entitlement-calculator`,changeFrequency:'weekly',priority:0.95},
  {url:`${SITE_URL}/public-holidays`,changeFrequency:'weekly',priority:0.9},
  {url:`${SITE_URL}/school-holidays-nz`,changeFrequency:'weekly',priority:0.9},
  {url:`${SITE_URL}/immigration`,changeFrequency:'daily',priority:0.9},
  {url:`${SITE_URL}/visitor-visa-nz`,changeFrequency:'daily',priority:0.9},
  {url:`${SITE_URL}/new-zealand-passport-application`,changeFrequency:'weekly',priority:0.9},
  {url:`${SITE_URL}/nz-passport-renewal`,changeFrequency:'weekly',priority:0.85},
  {url:`${SITE_URL}/jobs-in-new-zealand`,changeFrequency:'daily',priority:0.9},
  {url:`${SITE_URL}/government-jobs-nz`,changeFrequency:'hourly',priority:0.9},
];

function safeDate(value:string|null|undefined,fallback:string|null|undefined){const primary=value?new Date(value):null;if(primary&&!Number.isNaN(primary.getTime()))return primary;const secondary=fallback?new Date(fallback):null;return secondary&&!Number.isNaN(secondary.getTime())?secondary:undefined;}

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const supabase=await createClient();const now=new Date().toISOString();
  // Supabase returns at most 1,000 rows per request whatever .limit() says, so read
  // the archive page by page; otherwise the oldest stories silently drop out of the sitemap.
  const PAGE=1000;
  const data:{slug:string|null;updated_at:string|null;published_at:string|null;robots_index:boolean|null}[]=[];
  for(let from=0;from<50000;from+=PAGE){
    const {data:rows,error}=await supabase.from('articles').select('slug,updated_at,published_at,robots_index').eq('status','published').not('slug','is',null).neq('slug','').not('published_at','is',null).lte('published_at',now).order('published_at',{ascending:false}).order('id',{ascending:true}).range(from,from+PAGE-1);
    if(error){console.error('Failed to build sitemap:',error.message);break}
    data.push(...(rows||[]));
    if(!rows||rows.length<PAGE)break;
  }
  const articles=data.filter(a=>typeof a.slug==='string'&&a.slug.trim().length>0&&a.robots_index!==false);
  // Section pages that actually have stories, so Google can find every beat of the newsroom.
  const {data:sections}=await supabase.from('categories').select('slug,article_categories(count)').eq('is_active',true);
  const sectionPages=(sections||[])
    .filter((c:any)=>c.slug&&!NOINDEX_SECTIONS.has(c.slug)&&Number(c.article_categories?.[0]?.count||0)>0)
    .map((c:any)=>({url:`${SITE_URL}/category/${c.slug}`,changeFrequency:'hourly' as const,priority:0.7}));
  const {data:authorRows}=await supabase.from('authors').select('slug,articles(count)').eq('is_active',true);
  const authorPages=(authorRows||[]).filter((a:any)=>a.slug&&Number(a.articles?.[0]?.count||0)>0).map((a:any)=>({url:`${SITE_URL}/author/${a.slug}`,changeFrequency:'daily' as const,priority:0.5}));
  return [{url:`${SITE_URL}/`,lastModified:new Date(),changeFrequency:'hourly',priority:1},...evergreenPages,...sectionPages,...authorPages,...articles.map(a=>({url:articleUrl(a.slug as string),lastModified:safeDate(a.updated_at,a.published_at),changeFrequency:'daily' as const,priority:0.8}))];
}
