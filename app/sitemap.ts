import type { MetadataRoute } from 'next';
import { createClient } from '../lib/supabase-server';

const SITE_URL = 'https://webfitnews.com';

const evergreenPages: MetadataRoute.Sitemap = [
  {url:`${SITE_URL}/nz-guides`,changeFrequency:'weekly',priority:0.9},
  {url:`${SITE_URL}/minimum-wage`,changeFrequency:'daily',priority:0.9},
  {url:`${SITE_URL}/public-holidays`,changeFrequency:'weekly',priority:0.9},
  {url:`${SITE_URL}/immigration`,changeFrequency:'daily',priority:0.9},
  {url:`${SITE_URL}/visitor-visa-nz`,changeFrequency:'daily',priority:0.9},
  {url:`${SITE_URL}/new-zealand-passport-application`,changeFrequency:'weekly',priority:0.9},
  {url:`${SITE_URL}/nz-passport-renewal`,changeFrequency:'weekly',priority:0.85},
  {url:`${SITE_URL}/government-jobs-nz`,changeFrequency:'hourly',priority:0.9},
];

function safeDate(value:string|null|undefined,fallback:string|null|undefined){
  const primary=value?new Date(value):null;
  if(primary&&!Number.isNaN(primary.getTime()))return primary;
  const secondary=fallback?new Date(fallback):null;
  return secondary&&!Number.isNaN(secondary.getTime())?secondary:undefined;
}

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('articles')
    .select('slug,updated_at,published_at')
    .eq('status','published')
    .not('slug','is',null)
    .neq('slug','')
    .not('published_at','is',null)
    .lte('published_at',now)
    .order('published_at',{ascending:false})
    .limit(50000);

  if(error)console.error('Failed to build sitemap:',error.message);

  const articles=(data||[]).filter(a=>typeof a.slug==='string'&&a.slug.trim().length>0);

  return [
    {url:`${SITE_URL}/`,lastModified:new Date(),changeFrequency:'hourly',priority:1},
    ...evergreenPages,
    ...articles.map(a=>({
      url:`${SITE_URL}/${a.slug.trim()}/`,
      lastModified:safeDate(a.updated_at,a.published_at),
      changeFrequency:'daily' as const,
      priority:0.8
    }))
  ];
}
