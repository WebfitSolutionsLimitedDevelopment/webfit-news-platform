import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { StoryCard } from '@/components/StoryCard';
import { SectionPager } from '@/components/SectionPager';
import { getSectionPage, sectionPath } from '@/lib/section';
import { SITE_NAME, absoluteUrl } from '@/lib/site';

export const revalidate = 300;
export async function generateStaticParams() { return []; }

function pageNumber(n: string) {
  const page = Number(n);
  return Number.isInteger(page) && page >= 1 && page <= 500 ? page : null;
}

/**
 * Older stories in a section. Crawlable so Google can follow the links to
 * every story, but kept out of search results themselves (the same approach
 * as the /page/<n> archive), so only page 1 of a section competes in search.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string; n: string }> }): Promise<Metadata> {
  const { slug, n } = await params;
  const page = pageNumber(n);
  if (!page) return {};
  const section = await getSectionPage(slug, page);
  if (!section) return {};
  const title = `${section.cat.name} news, page ${page} | ${SITE_NAME}`;
  return {
    title: { absolute: title },
    description: `Older ${section.cat.name} stories from Webfit News, page ${page} of ${section.totalPages}.`,
    alternates: { canonical: absoluteUrl(sectionPath(section.cat.slug, page)) },
    robots: { index: false, follow: true },
  };
}

export default async function SectionArchivePage({ params }: { params: Promise<{ slug: string; n: string }> }) {
  const { slug, n } = await params;
  const page = pageNumber(n);
  if (!page) notFound();
  if (page === 1) permanentRedirect(sectionPath(slug));
  const section = await getSectionPage(slug, page);
  if (!section || !section.stories.length || page > section.totalPages) notFound();
  const { cat, stories, totalPages } = section;

  return <>
    <SiteHeader/>
    <main className="shell category-page">
      <nav className="article-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href={sectionPath(cat.slug)}>{cat.name}</Link><span>/</span><span>Page {page}</span></nav>
      <div className="archive-heading"><span>Section</span><h1>{cat.name}: page {page}</h1><p>Older {cat.name} stories, page {page} of {totalPages}.</p></div>
      <div className="story-grid">{stories.map((s: any) => <StoryCard key={s.id} story={s}/>)}</div>
      <SectionPager slug={cat.slug} page={page} totalPages={totalPages}/>
    </main>
    <PublicFooter/>
  </>;
}
