import './globals.css';
import type { Metadata } from 'next';
import { getSiteUrl } from '../lib/env';
import { getPublicSiteSettings } from '../lib/public-settings';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const settings = await getPublicSiteSettings();
  const siteName = settings.identity.name || settings.seo.site_name || 'Webfit News';
  const tagline = settings.identity.tagline || 'Independent New Zealand news, analysis and community reporting.';
  const suffix = settings.seo.default_title_suffix || ` | ${siteName}`;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: siteName, template: `%s${suffix}` },
    description: tagline,
    openGraph: { siteName, locale: settings.seo.default_locale || 'en_NZ', type: 'website', url: siteUrl, description: tagline },
    alternates: { canonical: '/' },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en-NZ"><body>{children}</body></html>;
}
