'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-YP1WWRYGHY';

/**
 * Analytics and AdSense, skipped inside the Webfit News app. The app check
 * used to read request headers on the server, which made every page on the
 * site uncacheable; the browser can check its own user agent instead.
 */
export function ThirdPartyScripts() {
  const [load, setLoad] = useState(false);
  useEffect(() => {
    setLoad(!navigator.userAgent.includes('WebfitNewsApp'));
  }, []);
  if (!load) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive"/>
    <Script id="google-analytics" strategy="afterInteractive">
      {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
    </Script>
    <Script async strategy="afterInteractive" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9134063543493779" crossOrigin="anonymous"/>
  </>;
}
