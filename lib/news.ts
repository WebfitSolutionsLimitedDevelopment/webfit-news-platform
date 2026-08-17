import { createClient } from './supabase-server';

export type Story = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published_at: string | null;
  featured_media_id: string | null;
  article_type: string;
  media?: { public_url: string | null; alt_text: string | null } | null;
};

const storyFields='id,title,slug,excerpt,published_at,featured_media_id,article_type,media:media!articles_featured_media_id_fkey(public_url,alt_text)';

export async function getLatestStories(limit = 12) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('articles').select(storyFields).eq('status','published').order('published_at',{ascending:false}).limit(limit);
  if (error) throw error;
  return (data || []) as unknown as Story[];
}


export async function getBreakingStories(limit=4){
  const supabase=await createClient();
  const {data,error}=await supabase.from('articles').select(storyFields).eq('status','published').eq('is_breaking',true).order('published_at',{ascending:false}).limit(limit);
  if(error) throw error;
  return (data||[]) as unknown as Story[];
}

export async function searchStories(query:string,limit=40){
  const q=query.trim(); if(!q) return [] as Story[];
  const supabase=await createClient();
  const {data,error}=await supabase.from('articles').select(storyFields).eq('status','published').or(`title.ilike.%${q.replaceAll(',',' ')}%,excerpt.ilike.%${q.replaceAll(',',' ')}%`).order('published_at',{ascending:false}).limit(limit);
  if(error) throw error;
  return (data||[]) as unknown as Story[];
}

export async function getArticleBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('articles')
    .select('*,author:author_id(name,slug,bio),media:media!articles_featured_media_id_fkey(public_url,alt_text,caption,credit),article_categories(category:category_id(id,name,slug))')
    .eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRelatedStories(articleId:string,categoryIds:string[],limit=4){
  if(!categoryIds.length) return [] as Story[];
  const supabase=await createClient();
  const {data,error}=await supabase.from('article_categories').select(`article:article_id(${storyFields},status)`).in('category_id',categoryIds).neq('article_id',articleId).limit(limit*5);
  if(error) throw error;
  const seen=new Set<string>(); const stories:Story[]=[];
  for(const row of data||[]){const a=(row as any).article;if(a?.status==='published'&&!seen.has(a.id)){seen.add(a.id);stories.push(a);if(stories.length>=limit)break}}
  return stories;
}

export type HomepageSectionFeed = { id:string; key:string; title:string; section_type:string; sort_order:number; max_items:number; stories: Story[]; };

export async function getHomepageFeed(): Promise<HomepageSectionFeed[]> {
  const supabase = await createClient();
  const { data: sections, error } = await supabase
    .from('homepage_sections')
    .select('id,key,title,section_type,sort_order,max_items,category_id,slots:homepage_slots(position,article:article_id(id,title,slug,excerpt,published_at,featured_media_id,article_type,media:media!articles_featured_media_id_fkey(public_url,alt_text)))')
    .eq('is_enabled', true).order('sort_order');
  if (error) throw error;
  const out: HomepageSectionFeed[] = [];
  for (const section of sections || []) {
    let stories: any[] = [];
    if (section.section_type === 'manual') {
      stories = ((section as any).slots || []).sort((a:any,b:any)=>a.position-b.position).map((x:any)=>x.article).filter(Boolean).slice(0,section.max_items);
    } else if (section.section_type === 'category' && section.category_id) {
      const { data } = await supabase.from('article_categories')
        .select('article:article_id(id,title,slug,excerpt,published_at,featured_media_id,article_type,status,media:media!articles_featured_media_id_fkey(public_url,alt_text))')
        .eq('category_id', section.category_id).limit(Math.max(section.max_items * 4, 24));
      stories=(data||[]).map((x:any)=>x.article).filter((x:any)=>x && x.status==='published').sort((a:any,b:any)=>new Date(b.published_at||0).getTime()-new Date(a.published_at||0).getTime()).slice(0,section.max_items);
    } else if (section.key === 'videos' || section.key === 'digital-edition') {
      stories=[];
    } else {
      const { data } = await supabase.from('articles').select(storyFields).eq('status','published').order('published_at',{ascending:false}).limit(section.max_items);
      stories=data||[];
    }
    out.push({id:section.id,key:section.key,title:section.title,section_type:section.section_type,sort_order:section.sort_order,max_items:section.max_items,stories:stories as Story[]});
  }
  return out;
}


export type VideoStory = {
  id:string;
  title:string;
  video_url:string;
  provider:string|null;
  published_at:string|null;
  is_featured:boolean;
  youtube_id:string|null;
  display_title:string;
};

export function getYoutubeId(url:string){
  try{
    const parsed=new URL(url);
    if(parsed.hostname==='youtu.be')return parsed.pathname.replace(/^\//,'').split('/')[0]||null;
    if(parsed.hostname.includes('youtube.com')){
      if(parsed.pathname.startsWith('/shorts/'))return parsed.pathname.split('/')[2]||null;
      return parsed.searchParams.get('v');
    }
  }catch{}
  return null;
}

async function resolveYoutubeTitle(url:string,fallback:string){
  try{
    const endpoint=`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response=await fetch(endpoint,{next:{revalidate:86400}});
    if(!response.ok)return fallback;
    const data=await response.json() as {title?:string};
    return data.title?.trim()||fallback;
  }catch{return fallback;}
}

export async function getPublishedVideos(limit=8):Promise<VideoStory[]>{
  const supabase=await createClient();
  const {data,error}=await supabase.from('videos').select('id,title,video_url,provider,published_at,is_featured').eq('is_published',true).order('is_featured',{ascending:false}).order('published_at',{ascending:false}).limit(limit);
  if(error)throw error;
  return Promise.all((data||[]).map(async(v:any)=>{
    const youtube_id=getYoutubeId(v.video_url);
    const display_title=youtube_id?await resolveYoutubeTitle(v.video_url,v.title):v.title;
    return {...v,youtube_id,display_title} as VideoStory;
  }));
}
