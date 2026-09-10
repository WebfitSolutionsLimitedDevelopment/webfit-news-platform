import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';

export const revalidate = 60;
const PAGE_SIZE = 24;

export default async function LegacyPageArchive({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const page = Number(number);
  if (!Number.isInteger(page) || page < 1 || page > 500) notFound();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = await createClient();
  const { data: stories, error, count } = await supabase
    .from('articles')
    .select('id,title,slug,excerpt,published_at,featured_media_id,article_type,status,media:featured_media_id(public_url,alt_text)', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) throw error;
  if (!stories?.length) notFound();

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
  if (page > totalPages) notFound();

  return <>
    <SiteHeader/>
    <main className="shell category-page">
      <div className="archive-heading"><span>Archive</span><h1>Latest News</h1><p>Page {page} of {totalPages}</p></div>
      <div className="story-grid">{stories.map((story: any) => <StoryCard key={story.id} story={story}/>)}</div>
      <nav style={{display:'flex',justifyContent:'space-between',gap:'1rem',margin:'2rem 0 3rem'}} aria-label="Archive pagination">
        <div>{page > 1 ? <Link href={page === 2 ? '/' : `/page/${page - 1}`}>← Newer stories</Link> : null}</div>
        <div>{page < totalPages ? <Link href={`/page/${page + 1}`}>Older stories →</Link> : null}</div>
      </nav>
    </main>
    <PublicFooter/>
  </>;
}
