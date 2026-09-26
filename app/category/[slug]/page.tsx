import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';
import { AdSlot } from '@/components/AdSlot';

export const revalidate=60;

export default async function CategoryPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const supabase=await createClient();
  const {data:category}=await supabase.from('categories').select('id,name,description').eq('slug',slug).eq('is_active',true).maybeSingle();
  if(!category)notFound();
  const {data:links}=await supabase.from('article_categories').select('article:article_id(id,title,slug,excerpt,published_at,featured_media_id,article_type,status,media:featured_media_id(public_url,alt_text))').eq('category_id',category.id).limit(80);
  const stories=(links||[]).map((link:any)=>link.article).filter((story:any)=>story?.status==='published').sort((left:any,right:any)=>new Date(right.published_at||0).getTime()-new Date(left.published_at||0).getTime());
  return <>
    <SiteHeader/>
    <main className="shell category-page">
      <AdSlot slotKey="CATEGORY_TOP" className="category-ad-top"/>
      <div className="archive-heading"><span>Section</span><h1>{category.name}</h1>{category.description?<p>{category.description}</p>:null}</div>
      <div className="story-grid">{stories.map((story:any)=><StoryCard key={story.id} story={story}/>)}</div>
      {!stories.length?<div className="admin-empty">No published stories in this section yet.</div>:null}
    </main>
    <AdSlot slotKey="MOBILE_STICKY"/>
    <PublicFooter/>
  </>;
}
