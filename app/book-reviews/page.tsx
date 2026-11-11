import type { Metadata } from 'next';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase-public';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';

export const revalidate = 60;

const BOOK_TAG_SLUGS = ['book', 'books', 'book-review', 'book-reviews'];

export const metadata: Metadata = {
  title: { absolute: 'Book Reviews | Webfit News' },
  description: 'Book reviews and book-related stories from Webfit News.',
  alternates: { canonical: 'https://webfitnews.com/book-reviews' },
  openGraph: {
    type: 'website',
    title: 'Book Reviews | Webfit News',
    description: 'Book reviews and book-related stories from Webfit News.',
    url: 'https://webfitnews.com/book-reviews',
    siteName: 'Webfit News',
  },
};

export default async function BookReviewsPage() {
  const supabase = await createPublicClient();
  const { data: tags, error: tagError } = await supabase
    .from('tags')
    .select('id')
    .in('slug', BOOK_TAG_SLUGS);
  if (tagError) throw tagError;

  let stories: any[] = [];
  if (tags?.length) {
    const { data: links, error } = await supabase
      .from('article_tags')
      .select('article:article_id(id,title,slug,excerpt,published_at,featured_media_id,article_type,status,media:featured_media_id(public_url,alt_text))')
      .in('tag_id', tags.map(tag => tag.id))
      .limit(1000);
    if (error) throw error;

    const unique = new Map<string, any>();
    for (const link of links || []) {
      const article = (link as any).article;
      if (article?.status === 'published') unique.set(article.id, article);
    }
    stories = [...unique.values()].sort(
      (a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
    );
  }

  return <>
    <SiteHeader/>
    <main className="shell category-page">
      <nav className="article-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><span>Book Reviews</span>
      </nav>
      <div className="archive-heading">
        <span>Books &amp; Culture</span>
        <h1>Book Reviews</h1>
        <p>Reviews, recommendations and stories about books.</p>
      </div>
      <div className="story-grid">
        {stories.map(story => <StoryCard key={story.id} story={story}/>)}
      </div>
      {!stories.length ? <div className="admin-empty">No book reviews published yet.</div> : null}
    </main>
    <PublicFooter/>
  </>;
}
