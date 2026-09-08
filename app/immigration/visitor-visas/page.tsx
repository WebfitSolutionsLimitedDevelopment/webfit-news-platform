import type { Metadata } from 'next';
import { VisaCategoryLanding } from '@/components/immigration/VisaCategoryLanding';
import { getImmigrationCategoryPage } from '@/lib/immigration-category-pages';

const config = getImmigrationCategoryPage('visitor-visas')!;
const url = 'https://www.webfitnews.com/immigration/visitor-visas';

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: url },
  openGraph: { title: config.metaTitle, description: config.metaDescription, url, siteName: 'Webfit News', type: 'website', locale: 'en_NZ' },
  twitter: { card: 'summary_large_image', title: config.metaTitle, description: config.metaDescription },
};

export default function VisitorVisasPage() {
  return <VisaCategoryLanding config={config} />;
}
