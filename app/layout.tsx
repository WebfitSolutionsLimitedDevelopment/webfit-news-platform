import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import { getSiteUrl } from '../lib/env';
import { getPublicSiteSettings } from '../lib/public-settings';

const GA_MEASUREMENT_ID = 'G-YP1WWRYGHY';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const settings = await getPublicSiteSettings();
  const siteName =
    settings.identity.name ||
    settings.seo.site_name ||
    'Webfit News';

  const tagline =
    settings.identity.tagline ||
    'Independent New Zealand news, analysis and community reporting.';

  const suffix =
    settings.seo.default_title_suffix ||
    ` | ${siteName}`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteName,
      template: `%s${suffix}`,
    },
    description: tagline,
    openGraph: {
      siteName,
      locale: settings.seo.default_locale || 'en_NZ',
      type: 'website',
      url: siteUrl,
      description: tagline,
    },
    alternates: {
      canonical: '/',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-NZ">
      <body>{children}</body>

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />

      <Script
        id="google-analytics"
        strategy="afterInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>

      <Script
        async
        strategy="afterInteractive"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9134063543493779"
        crossOrigin="anonymous"
      />
    </html>
  );
}