'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { LiveAd } from '@/lib/ads';
import { clickHref, sendEvent } from './AdUnit';
import styles from './VideoPopIn.module.css';

/**
 * Pop-in video ads. Two kinds, never on screen together:
 *  - "now"   (slot SITE_VIDEO_POP_NOW): slides in as soon as a page opens. Closed: hidden for a day.
 *  - "later" (slot SITE_VIDEO_POP): after the site has been on screen for a minute in a visit. Closed: hidden 3 days.
 * Each shows at most once per visit. Watched to the end: never shown again.
 * Corner card on desktop, compact card on phones (vertical videos sit to the right, landscape ones along the bottom);
 * never covers the whole page. Not on admin, e-paper, support or sign-in pages.
 * Browsers only allow sound after the reader taps, so videos start muted with a big "Tap for sound" button
 * (tapping the video does the same).
 */
type Kind = 'now' | 'later';
const RULES: Record<Kind, { snoozeMs: number }> = {
  now: { snoozeMs: 24 * 3600 * 1000 },
  later: { snoozeMs: 3 * 24 * 3600 * 1000 },
};
const NOW_DELAY_MS = 1500;
const LATER_AFTER_SECONDS = 60;
const SKIP = /^\/(admin|ad-report|epaper|support-us|login|signin|account|reader|api)(\/|$)/;
const TIME_KEY = 'wf-vpop-seconds';
const MOBILE = '(max-width: 720px)';
const VIMEO = 'https://player.vimeo.com';

function sessionGet(key: string) { try { return sessionStorage.getItem(key); } catch { return null; } }
function sessionSet(key: string, v: string) { try { sessionStorage.setItem(key, v); } catch {} }
function suppressed(ad: LiveAd, kind: Kind) {
  try {
    const v = JSON.parse(localStorage.getItem(`wf-vpop:${ad.creative_id}`) || 'null');
    if (!v) return false;
    return v.s === 'watched' || Date.now() - v.t < RULES[kind].snoozeMs;
  } catch { return false; }
}
function remember(creative: string, s: 'closed' | 'watched') {
  try { localStorage.setItem(`wf-vpop:${creative}`, JSON.stringify({ s, t: Date.now() })); } catch {}
}
function vimeoId(url: string | null) {
  const m = url?.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}
function pick(ads: LiveAd[], kind: Kind) {
  const device = window.matchMedia(MOBILE).matches ? 'mobile' : 'desktop';
  return ads.find(a => (a.device === 'all' || a.device === device) && a.video_url && !suppressed(a, kind)) || null;
}

export function VideoPopIn() {
  const pathname = usePathname() || '/';
  const skip = SKIP.test(pathname);
  const skipRef = useRef(skip);
  skipRef.current = skip;
  const [ad, setAd] = useState<LiveAd | null>(null);
  const [kind, setKind] = useState<Kind>('now');
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const feed = useRef<{ now: LiveAd[]; later: LiveAd[] } | null>(null);
  const openRef = useRef(false);
  const started = useRef(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  const show = useCallback((a: LiveAd, k: Kind) => {
    openRef.current = true;
    started.current = false;
    sessionSet(`wf-vpop-shown:${k}`, '1');
    setMuted(true);
    setEnded(false);
    setKind(k);
    setAd(a);
    sendEvent(a, 'impression');
  }, []);

  const blocked = () => {
    if (openRef.current || skipRef.current || document.visibilityState !== 'visible') return true;
    if (document.querySelector('[aria-modal="true"]')) return true;
    const el = document.activeElement;
    return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
  };

  // Load the feed once, then: "now" ad straight away, "later" ad after a minute on the site.
  useEffect(() => {
    let cancelled = false;
    let seconds = Number(sessionGet(TIME_KEY)) || 0;
    let tick = 0;
    (async () => {
      try {
        const res = await fetch('/api/ads/pop');
        if (!res.ok || cancelled) return;
        feed.current = await res.json();
      } catch { return; }
      tick = window.setInterval(() => {
        const f = feed.current;
        if (!f || cancelled) return;
        if (document.visibilityState === 'visible') {
          seconds += 1;
          sessionSet(TIME_KEY, String(seconds));
        }
        if (blocked()) return;
        if (!sessionGet('wf-vpop-shown:now') && seconds * 1000 >= NOW_DELAY_MS) {
          const a = pick(f.now, 'now');
          if (a) return show(a, 'now');
          sessionSet('wf-vpop-shown:now', 'none');
        }
        if (!sessionGet('wf-vpop-shown:later') && seconds >= LATER_AFTER_SECONDS) {
          const a = pick(f.later, 'later');
          if (a) return show(a, 'later');
          sessionSet('wf-vpop-shown:later', 'none');
        }
        if (sessionGet('wf-vpop-shown:now') && sessionGet('wf-vpop-shown:later')) window.clearInterval(tick);
      }, 1000);
    })();
    return () => { cancelled = true; window.clearInterval(tick); };
  }, [show]);

  const close = useCallback((how: 'closed' | 'watched' = 'closed') => {
    if (ad) remember(ad.creative_id, how);
    openRef.current = false;
    setAd(null);
  }, [ad]);

  // Moving to a page where pop-ins don't belong hides it.
  useEffect(() => { if (skip && ad) { openRef.current = false; setAd(null); } }, [skip, ad]);

  useEffect(() => {
    if (!ad) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ad, close]);

  const onStart = useCallback(() => {
    if (!ad || started.current) return;
    started.current = true;
    sendEvent(ad, 'video_start');
  }, [ad]);
  const onEnd = useCallback(() => {
    if (!ad) return;
    sendEvent(ad, 'video_complete');
    remember(ad.creative_id, 'watched');
    setEnded(true);
  }, [ad]);

  const vimeo = vimeoId(ad?.video_url ?? null);
  const post = (method: string, value?: unknown) =>
    frame.current?.contentWindow?.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), VIMEO);

  // Vimeo player events (play / ended) arrive as messages from the player frame.
  useEffect(() => {
    if (!ad || !vimeo) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== VIMEO) return;
      let d: any; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
      if (d?.event === 'ready') { post('addEventListener', 'play'); post('addEventListener', 'ended'); }
      if (d?.event === 'play') onStart();
      if (d?.event === 'ended') onEnd();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [ad, vimeo, onStart, onEnd]);

  // After the end card has been up a while, tidy it away.
  useEffect(() => {
    if (!ended) return;
    const t = window.setTimeout(() => { openRef.current = false; setAd(null); }, 12000);
    return () => window.clearTimeout(t);
  }, [ended]);

  const unmute = () => {
    setMuted(false);
    if (vimeo) { post('setMuted', false); post('setVolume', 1); }
    else if (video.current) { video.current.muted = false; video.current.play().catch(() => {}); }
  };
  const replay = () => {
    setEnded(false);
    if (vimeo) { post('setCurrentTime', 0); post('play'); }
    else if (video.current) { video.current.currentTime = 0; video.current.play().catch(() => {}); }
  };

  if (!ad) return null;
  const portrait = !!ad.video_width && !!ad.video_height && ad.video_height > ad.video_width;
  const src = vimeo ? `${VIMEO}/video/${vimeo}?autoplay=1&muted=1&playsinline=1&title=0&byline=0&portrait=0&dnt=1&api=1` : null;
  const cta = ad.cta_label || 'Find out more';

  return <aside className={`${styles.pop} ${portrait ? styles.portrait : ''}`} aria-label={`Advertisement: ${ad.headline || ad.advertiser || 'video'}`} data-kind={kind}>
    <div className={styles.head}>
      <span className={styles.label}>Advertisement</span>
      <span className={styles.title}>{ad.headline || ad.advertiser}</span>
      <button type="button" className={styles.close} onClick={() => close()} aria-label="Close video">×</button>
    </div>
    <div className={styles.screen}>
      {src
        ? <iframe ref={frame} src={src} title={ad.alt_text || ad.headline || 'Video advertisement'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>
        : <video ref={video} src={ad.video_url || undefined} poster={ad.poster_image || undefined} autoPlay muted playsInline controls onPlay={onStart} onEnded={onEnd}/>}
      {muted && !ended ? <button type="button" className={styles.tapLayer} onClick={unmute} aria-label="Turn sound on"/> : null}
      {ended ? <div className={styles.endCard}>
        <p>Thanks for watching</p>
        <div className={styles.endActions}>
          <a className={styles.cta} href={clickHref(ad)} target="_blank" rel="noopener sponsored">{cta} ›</a>
          <button type="button" className={styles.ghost} onClick={replay}>Watch again</button>
        </div>
      </div> : null}
    </div>
    <div className={styles.foot}>
      <a className={styles.cta} href={clickHref(ad)} target="_blank" rel="noopener sponsored">{cta} ›</a>
      {muted && !ended ? <button type="button" className={styles.sound} onClick={unmute}><span aria-hidden="true">🔊</span> Tap for sound</button> : null}
      <button type="button" className={styles.later} onClick={() => close()}>Not now</button>
    </div>
  </aside>;
}
