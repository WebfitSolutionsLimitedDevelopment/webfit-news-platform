import type { MetadataRoute } from 'next';
import { createClient } from '../lib/supabase-server';

const SITE_URL = 'https://webfitnews.com';

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
    ...articles.map(a=>({
      url:`${SITE_URL}/${a.slug.trim()}/`,
      lastModified:safeDate(a.updated_at,a.published_at),
      changeFrequency:'daily' as const,
      priority:0.8
    }))
  ];
}
