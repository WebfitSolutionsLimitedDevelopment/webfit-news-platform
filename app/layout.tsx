import './globals.css';
import './public-image-fit.css';
import './admin-mobile.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { headers } from 'next/headers';
import { getSiteUrl } from '../lib/env';
import { getPublicSiteSettings } from '../lib/public-settings';

const GA_MEASUREMENT_ID = 'G-YP1WWRYGHY';

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

    manifest: '/manifest.json',

    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteName,
    },

    icons: {
      icon: [
        {
          url: '/favicon.ico',
        },
        {
          url: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          url: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
      apple: [
        {
          url: '/apple-touch-icon.png',
          sizes: '180x180',
          type: 'image/png',
        },
      ],
    },

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The iOS and Android apps tag their WebView requests with an
  // "WebfitNewsApp/1.0" marker appended to the User-Agent. When a request
  // comes from inside our own native app (not a regular browser), we skip
  // Google Analytics and Google AdSense entirely. Neither script nor the
  // tracking-consent prompt Google shows for them is needed in-app, and
  // this keeps the native apps from doing any cross-app/site tracking that
  // would otherwise require Apple's App Tracking Transparency permission.
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isNativeApp = userAgent.includes('WebfitNewsApp');

  return (
    <html lang="en-NZ">
      <body>{children}</body>

      {!isNativeApp && (
        <>
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
        </>
      )}

      <Script id="sw-register" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js').catch(function () {});
            });
          }
        `}
      </Script>
    </html>
  );
}