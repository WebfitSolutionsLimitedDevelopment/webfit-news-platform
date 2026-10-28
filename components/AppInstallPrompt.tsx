'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useReadingGate } from './useReadingGate';

/** The Webfit News iPhone app on the App Store. */
export const IOS_APP_URL = process.env.NEXT_PUBLIC_IOS_APP_URL || 'https://apps.apple.com/nz/app/webfit-news/id6806497365';

const SKIP = /^\/(admin|login|auth)(\/|$)/;
const KEY = 'wf-app-prompt';
const DAY = 86_400_000;

/**
 * "Get the app" card for iPhone and iPad readers.
 * Shows once a reader has spent 30 seconds on a page (tab visible) and scrolled.
 * Never inside the app itself, never in the CMS. "Not now" hides it for 14 days;
 * tapping "Get the app" hides it for 60 days.
 */
export function AppInstallPrompt() {
  const pathname = usePathname() || '';
  const [eligible, setEligible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!IOS_APP_URL || SKIP.test(pathname)) return;
    const ua = navigator.userAgent;
    const iOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
    if (!iOS || ua.includes('WebfitNewsApp')) return;
    try {
      const until = Number(localStorage.getItem(KEY) || 0);
      if (until > Date.now()) return;
    } catch {}
    setEligible(true);
  }, [pathname]);

  const ready = useReadingGate(eligible, 30_000);
  useEffect(() => { if (ready && eligible) setOpen(true); }, [ready, eligible]);

  const hide = (days: number) => {
    setOpen(false);
    setEligible(false);
    try { localStorage.setItem(KEY, String(Date.now() + days * DAY)); } catch {}
  };

  if (!open) return null;
  return <div className="app-prompt" role="dialog" aria-labelledby="app-prompt-title" aria-describedby="app-prompt-text">
    <img src="/icon-192.png" alt="" width={52} height={52}/>
    <div className="app-prompt-copy">
      <strong id="app-prompt-title">Webfit News app for iPhone</strong>
      <span id="app-prompt-text">Ad-free news and breaking alerts. Free on the App Store.</span>
    </div>
    <div className="app-prompt-actions">
      <a href={IOS_APP_URL} className="app-prompt-get" onClick={() => hide(60)} target="_blank" rel="noopener">Get the app</a>
      <button type="button" className="app-prompt-later" onClick={() => hide(14)}>Not now</button>
    </div>
    <button type="button" className="app-prompt-close" aria-label="Close" onClick={() => hide(14)}>×</button>
  </div>;
}
