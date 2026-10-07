import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { EpaperScreen } from '@/components/epaper/EpaperScreen';
import { getEdition, getEditionShelf, isEditionKey } from '@/lib/epaper';
import { SITE_NAME, absoluteUrl } from '@/lib/site';

export const revalidate = 300;

/** Editions are built on first visit, then cached. */
export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ edition: string }> }): Promise<Metadata> {
  const { edition: key } = await params;
  if (!isEditionKey(key)) return {};
  const edition = await getEdition(key);
  if (!edition) return {};
  const title = `${edition.title} | E-paper | ${SITE_NAME}`;
  const description = `Webfit News weekly e-paper No. ${edition.number}: ${edition.storyCount} stories from ${edition.coverage}, in full.`;
  return {
    title: { absolute: title },
    description,
    // Editions repeat stories that already have their own pages, so only /epaper is indexed.
    alternates: { canonical: absoluteUrl(`/epaper/${edition.key}`) },
    robots: { index: false, follow: true },
    openGraph: { type: 'website', url: absoluteUrl(`/epaper/${edition.key}`), siteName: SITE_NAME, title, description, locale: 'en_NZ', images: edition.coverImage ? [{ url: edition.coverImage }] : undefined },
  };
}

export default async function EpaperEditionPage({ params }: { params: Promise<{ edition: string }> }) {
  const { edition: key } = await params;
  if (!isEditionKey(key)) notFound();
  const [edition, shelf] = await Promise.all([getEdition(key), getEditionShelf()]);
  if (!edition) notFound();
  return <>
    <SiteHeader/>
    <EpaperScreen edition={edition} shelf={shelf}/>
    <PublicFooter/>
  </>;
}
