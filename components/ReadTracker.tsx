'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Webfit News' own readership count (the "Analytics" page in the CMS).
 * One request when a page opens, then reading time and scroll depth when the
 * reader leaves or hides the tab. The browser keeps a random ID so we can tell
 * new readers from returning ones; no name, email or IP address is stored.
 */
const SKIP = /^\/(admin|login|auth|api)(\/|$)/;
const KEY = 'wf-reader-id';

function readerId(): { id: string; returning: boolean } {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return { id: saved, returning: true };
    const fresh = crypto.randomUUID();
    localStorage.setItem(KEY, fresh);
    return { id: fresh, returning: false };
  } catch {
    // Private mode or storage blocked: count the view, but as a one-off reader.
    return { id: crypto.randomUUID(), returning: false };
  }
}

function device() {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'mobile';
  return 'desktop';
}

function send(body: object, beacon = false) {
  const json = JSON.stringify(body);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([json], { type: 'application/json' }));
    return null;
  }
  return fetch('/api/track', { method: 'POST', body: json, headers: { 'Content-Type': 'application/json' }, keepalive: true });
}

export function ReadTracker() {
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (SKIP.test(pathname) || typeof crypto?.randomUUID !== 'function') return;
    const reader = readerId();
    const params = new URLSearchParams(location.search);
    // Only the first page of a visit has an outside referrer; later pages are internal.
    let ref = document.referrer;
    try {
      if (sessionStorage.getItem('wf-seen')) ref = location.origin;
      sessionStorage.setItem('wf-seen', '1');
    } catch {}

    let viewId: string | null = null;
    let seconds = 0;
    let scroll = 0;
    let lastSent = '';
    const measure = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.round(((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100) : 100;
      scroll = Math.max(scroll, Math.min(100, pct));
    };
    const flush = () => {
      const mark = `${seconds}:${scroll}`;
      if (!viewId || mark === lastSent) return;
      lastSent = mark;
      send({ k: 'time', id: viewId, v: reader.id, t: seconds, s: scroll }, true);
    };

    send({ k: 'view', p: pathname, v: reader.id, r: reader.returning, ref: ref || undefined, utm: params.get('utm_source') || undefined, d: device() })
      ?.then(r => (r.ok ? r.json() : null))
      .then(j => { viewId = j?.id ?? null; })
      .catch(() => {});

    // Count only time with the page visible; stop counting after 30 minutes.
    const tick = window.setInterval(() => {
      if (document.visibilityState === 'visible' && seconds < 1800) seconds += 5;
      if (seconds === 30 || seconds === 120) flush();
    }, 5000);
    const onScroll = () => measure();
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    measure();

    return () => {
      flush();
      window.clearInterval(tick);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, [pathname]);

  return null;
}
