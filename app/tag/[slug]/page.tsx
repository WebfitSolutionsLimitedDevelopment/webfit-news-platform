import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createPublicClient as createClient } from '@/lib/supabase-public';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';

export const revalidate = 60;

/** Pages are built on first visit, then cached for a minute (and refreshed when stories are published). */
export async function generateStaticParams() { return []; }

/** Topic pages with only a story or two are thin; keep them out of search until they grow. */
const TAG_INDEX_MIN_STORIES = 3;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: tag } = await supabase.from('tags').select('id,name,slug').eq('slug', slug).maybeSingle();
  if (!tag) return {};
  const { count } = await supabase.from('article_tags').select('article_id', { count: 'exact', head: true }).eq('tag_id', tag.id);
  const title = `${tag.name}: latest news and stories | Webfit News`;
  const description = `Webfit News coverage of ${tag.name}: the latest New Zealand news, analysis and community stories.`;
  const url = `https://webfitnews.com/tag/${tag.slug}`;
  const indexable = (count || 0) >= TAG_INDEX_MIN_STORIES;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: indexable, follow: true },
    openGraph: { type: 'website', url, siteName: 'Webfit News', title, description, locale: 'en_NZ' },
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
    .limit(300);

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
