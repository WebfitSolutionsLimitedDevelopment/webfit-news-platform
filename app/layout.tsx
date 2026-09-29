import './globals.css';
import './public-image-fit.css';
import './admin-mobile.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { ThirdPartyScripts } from '../components/ThirdPartyScripts';
import { getSiteUrl } from '../lib/env';
import { getPublicSiteSettings } from '../lib/public-settings';

const CANONICAL_SITE_URL='https://webfitnews.com';

export const viewport: Viewport = {
  themeColor: '#0b1117',
  width: 'device-width',
  initialScale: 1,
};

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

    // Let Google show large images, full snippets and video previews in Search,
    // Top Stories and Discover. Without max-image-preview:large, Discover only
    // shows small thumbnails.
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },

    alternates: {
      types: { 'application/rss+xml': [{ url: '/rss.xml', title: 'Webfit News: latest stories' }] },
    },

    manifest: '/manifest.json',

    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteName,
    },

    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },

    openGraph: {
      siteName,
      locale: settings.seo.default_locale || 'en_NZ',
      type: 'website',
      url: siteUrl,
      description: tagline,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  const siteStructuredData={
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':['NewsMediaOrganization','Organization'],
        '@id':`${CANONICAL_SITE_URL}/#organization`,
        name:'Webfit News',
        url:CANONICAL_SITE_URL,
        logo:{'@type':'ImageObject',url:`${CANONICAL_SITE_URL}/webfit-news-logo.png`},
        description:'Independent New Zealand news, analysis, community reporting and practical New Zealand information guides.',
        areaServed:{'@type':'Country',name:'New Zealand'},
        sameAs:['https://www.facebook.com/webfitnews','https://www.youtube.com/@webfitnews'],
        publishingPrinciples:`${CANONICAL_SITE_URL}/editorial-policy`,
        correctionsPolicy:`${CANONICAL_SITE_URL}/corrections`,
        ethicsPolicy:`${CANONICAL_SITE_URL}/editorial-policy`,
      },
      {
        '@type':'WebSite',
        '@id':`${CANONICAL_SITE_URL}/#website`,
        name:'Webfit News',
        url:CANONICAL_SITE_URL,
        publisher:{'@id':`${CANONICAL_SITE_URL}/#organization`},
        inLanguage:'en-NZ',
      },
    ],
  };

  return (
    <html lang="en-NZ">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(siteStructuredData).replace(/</g,'\\u003c')}}/>

      <ThirdPartyScripts/>

      <Script id="sw-register" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js').catch(function () {});
            });
          }
        `}
      </Script>
      </body>
    </html>
  );
}
