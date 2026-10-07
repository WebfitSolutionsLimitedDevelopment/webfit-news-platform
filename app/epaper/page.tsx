import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { EpaperScreen } from '@/components/epaper/EpaperScreen';
import { getEdition, getEditionShelf } from '@/lib/epaper';
import { SITE_NAME, absoluteUrl } from '@/lib/site';

/** Rebuilt at most every 5 minutes, and straight away when a story is published. */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const edition = await getEdition();
  const title = `E-paper | ${SITE_NAME}`;
  const description = 'Read Webfit News as a newspaper, twice a week: New Zealand, politics, immigration, India & community, business, lifestyle and sport, printed in full and laid out page by page.';
  const url = absoluteUrl('/epaper');
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, siteName: SITE_NAME, title, description, locale: 'en_NZ', images: edition?.coverImage ? [{ url: edition.coverImage }] : undefined },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function EpaperLatestPage() {
  const [edition, shelf] = await Promise.all([getEdition(), getEditionShelf()]);
  if (!edition) notFound();
  return <>
    <SiteHeader/>
    <EpaperScreen edition={edition} shelf={shelf}/>
    <PublicFooter/>
  </>;
}
