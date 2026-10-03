import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSectionPage, sectionDescription } from '@/lib/section';
import { SectionPager } from '@/components/SectionPager';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';
import { AdSlot } from '@/components/AdSlot';
import { NOINDEX_SECTIONS, RSS_ALTERNATE, SITE_NAME, absoluteUrl, articleUrl } from '@/lib/site';
import { getPublicStoryTitle } from '@/lib/public-story-display';

export const revalidate = 60;

/** Pages are built on first visit, then cached for a minute (and refreshed when stories are published). */
export async function generateStaticParams() { return []; }

const getSection = (slug: string) => getSectionPage(slug, 1);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const section = await getSection(slug);
  if (!section) return {};
  const { cat, stories } = section;
  const url = absoluteUrl(`/category/${cat.slug}`);
  const title = `${cat.name} news | ${SITE_NAME}`;
  const description = sectionDescription(cat.name, cat.description);
  const indexable = stories.length > 0 && !NOINDEX_SECTIONS.has(cat.slug);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, types: RSS_ALTERNATE },
    robots: { index: indexable, follow: true },
    openGraph: { type: 'website', url, siteName: SITE_NAME, title, description, locale: 'en_NZ', images: stories[0]?.media?.public_url ? [{ url: stories[0].media.public_url }] : undefined },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const section = await getSection(slug);
  if (!section) notFound();
  const { cat, stories } = section;
  const url = absoluteUrl(`/category/${cat.slug}`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name: `${cat.name} news`,
        description: sectionDescription(cat.name, cat.description),
        inLanguage: 'en-NZ',
        isPartOf: { '@id': `${absoluteUrl('/')}#website` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: stories.slice(0, 20).map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: articleUrl(s.slug), name: getPublicStoryTitle(s.title) })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: cat.name, item: url },
        ],
      },
    ],
  };

  return <>
    <SiteHeader/>
    <main className="shell category-page">
      <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>{cat.name}</span></nav>
      <div className="archive-heading"><span>Section</span><h1>{cat.name}</h1><p>{sectionDescription(cat.name, cat.description)}</p></div>
      <AdSlot slotKey="CATEGORY_TOP"/>
      <div className="story-grid">{stories.map((s: any) => <StoryCard key={s.id} story={s}/>)}</div>
      {!stories.length ? <div className="admin-empty">No published stories in this section yet.</div> : null}
      <SectionPager slug={cat.slug} page={1} totalPages={section.totalPages}/>
    </main>
    <PublicFooter/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}/>
  </>;
}
