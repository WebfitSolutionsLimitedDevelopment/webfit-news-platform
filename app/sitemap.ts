import type { MetadataRoute } from 'next';
import { createClient } from '../lib/supabase-server';

const SITE_URL = 'https://webfitnews.com';

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const supabase = await createClient();
  const { data } = await supabase.from('articles').select('slug,updated_at').eq('status','published').order('published_at',{ascending:false}).limit(50000);
  return [
    {url:`${SITE_URL}/`,lastModified:new Date(),changeFrequency:'hourly',priority:1},
    ...(data||[]).map(a=>({url:`${SITE_URL}/${a.slug}/`,lastModified:new Date(a.updated_at),changeFrequency:'daily' as const,priority:0.8}))
  ];
}
