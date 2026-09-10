import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: tag } = await supabase.from('tags').select('name,slug').eq('slug', slug).maybeSingle();
  if (!tag) return {};
  return {
    title: `${tag.name} | Webfit News`,
    alternates: { canonical: `https://webfitnews.com/tag/${tag.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: tag } = await supabase.from('tags').select('id,name,slug').eq('slug', slug).maybeSingle();
  if (!tag) notFound();

  const { data: links, error } = await supabase
    .from('article_tags')
    .select('article:article_id(id,title,slug,excerpt,published_at,featured_media_id,article_type,status,media:featured_media_id(public_url,alt_text))')
    .eq('tag_id', tag.id)
    .limit(100);

  if (error) throw error;

  const stories = (links || [])
    .map((x: any) => x.article)
    .filter((x: any) => x?.status === 'published')
    .sort((a: any, b: any) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());

  return <>
    <SiteHeader/>
    <main className="shell category-page">
      <div className="archive-heading"><span>Topic</span><h1>{tag.name}</h1></div>
      <div className="story-grid">{stories.map((story: any) => <StoryCard key={story.id} story={story}/>)}</div>
      {!stories.length ? <div className="admin-empty">No published stories found for this topic.</div> : null}
    </main>
    <PublicFooter/>
  </>;
}
