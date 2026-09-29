import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createPublicClient as createClient } from '@/lib/supabase-public';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';
import { SITE_NAME, SITE_URL, absoluteUrl, articleUrl } from '@/lib/site';
import { getPublicStoryTitle } from '@/lib/public-story-display';

export const revalidate = 300;
export async function generateStaticParams() { return []; }

const getAuthor = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: author } = await supabase
    .from('authors')
    .select('id,name,slug,title,bio,avatar_url,facebook_url,x_url,linkedin_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (!author) return null;
  const { data: stories, count } = await supabase
    .from('articles')
    .select('id,title,slug,excerpt,published_at,featured_media_id,article_type,media:media!articles_featured_media_id_fkey(public_url,alt_text)', { count: 'exact' })
    .eq('author_id', author.id)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(36);
  return { author, stories: (stories || []) as any[], total: count || 0 };
});

function authorSummary(a: { name: string; title?: string | null; bio?: string | null }) {
  return a.bio?.trim() || `${a.name}${a.title ? `, ${a.title},` : ''} reports for ${SITE_NAME}, an independent New Zealand news publisher.`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAuthor(slug);
  if (!data) return {};
  const { author, total } = data;
  const url = absoluteUrl(`/author/${author.slug}`);
  const title = `${author.name}${author.title ? `, ${author.title}` : ''} | ${SITE_NAME}`;
  const description = authorSummary(author).slice(0, 155);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: total > 0, follow: true },
    openGraph: { type: 'profile', url, siteName: SITE_NAME, title, description, images: author.avatar_url ? [{ url: author.avatar_url }] : undefined },
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getAuthor(slug);
  if (!data) notFound();
  const { author, stories, total } = data;
  const url = absoluteUrl(`/author/${author.slug}`);
  const sameAs = [author.facebook_url, author.x_url, author.linkedin_url].filter(Boolean);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${url}#page`,
        url,
        name: author.name,
        inLanguage: 'en-NZ',
        mainEntity: {
          '@type': 'Person',
          '@id': `${url}#person`,
          name: author.name,
          url,
          jobTitle: author.title || undefined,
          description: authorSummary(author),
          image: author.avatar_url || undefined,
          sameAs: sameAs.length ? sameAs : undefined,
          worksFor: { '@id': `${SITE_URL}/#organization` },
        },
        hasPart: stories.slice(0, 10).map(s => ({ '@type': 'NewsArticle', headline: getPublicStoryTitle(s.title).slice(0, 110), url: articleUrl(s.slug), datePublished: s.published_at })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: author.name, item: url },
        ],
      },
    ],
  };

  return <>
    <SiteHeader/>
    <main className="shell category-page">
      <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>{author.name}</span></nav>
      <div className="archive-heading" style={{ display: 'grid', gridTemplateColumns: author.avatar_url ? '96px 1fr' : '1fr', gap: '18px', alignItems: 'center' }}>
        {author.avatar_url ? <img src={author.avatar_url} alt={author.name} width={96} height={96} style={{ borderRadius: '50%', objectFit: 'cover', width: 96, height: 96 }}/> : null}
        <div>
          <span>{author.title || 'Reporter'}</span>
          <h1>{author.name}</h1>
          <p>{authorSummary(author)}</p>
          <p style={{ fontSize: 14 }}>{total.toLocaleString('en-NZ')} {total === 1 ? 'story' : 'stories'} for {SITE_NAME}.{sameAs.length ? ' ' : ''}{sameAs.map((href, i) => <a key={href as string} href={href as string} rel="me noopener" target="_blank" style={{ marginRight: 10 }}>{['Facebook', 'X', 'LinkedIn'][[author.facebook_url, author.x_url, author.linkedin_url].indexOf(href)] || `Profile ${i + 1}`}</a>)}</p>
        </div>
      </div>
      <div className="story-grid">{stories.map(s => <StoryCard key={s.id} story={s}/>)}</div>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}/>
  </>;
}
