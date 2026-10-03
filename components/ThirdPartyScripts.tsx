'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-YP1WWRYGHY';

/**
 * Analytics and AdSense, skipped inside the Webfit News app. The app check
 * used to read request headers on the server, which made every page on the
 * site uncacheable; the browser can check its own user agent instead.
 */
/**
 * AdSense Auto ads are loaded only once the reader starts using the page
 * (scrolls, taps or presses a key). Loaded straight away, they dropped a
 * 280px ad above the headline after it had painted, pushing the story down
 * (CLS ~0.2, Google's limit is 0.1) and adding ~350 KB of script to the
 * first load. Once the reader has scrolled, the browser keeps what they are
 * reading in place when the ad is inserted above it.
 */
function useAfterFirstInteraction(enabled: boolean) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const events = ['scroll', 'pointerdown', 'touchstart', 'keydown'] as const;
    const go = () => { setReady(true); events.forEach(e => window.removeEventListener(e, go)); };
    if (window.scrollY > 0) { go(); return; }
    events.forEach(e => window.addEventListener(e, go, { passive: true, once: true }));
    return () => events.forEach(e => window.removeEventListener(e, go));
  }, [enabled]);
  return ready;
}

export function ThirdPartyScripts() {
  const [load, setLoad] = useState(false);
  useEffect(() => {
    setLoad(!navigator.userAgent.includes('WebfitNewsApp'));
  }, []);
  const adsReady = useAfterFirstInteraction(load);
  if (!load) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive"/>
    <Script id="google-analytics" strategy="afterInteractive">
      {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
    </Script>
    {adsReady ? <Script async strategy="afterInteractive" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9134063543493779" crossOrigin="anonymous"/> : null}
  </>;
}
