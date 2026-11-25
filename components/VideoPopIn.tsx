'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { LiveAd } from '@/lib/ads';
import { clickHref, sendEvent } from './AdUnit';
import styles from './VideoPopIn.module.css';

/**
 * Pop-in video ad (slot SITE_VIDEO_POP).
 * - Appears after the reader has had the site on screen for a minute (counted across pages in the visit).
 * - Small card in the corner on desktop, a sheet along the bottom on phones; never covers the whole page.
 * - Plays muted (browsers block sound until the reader asks), with a big "Tap for sound" button.
 * - Close with the ×, "Not now", or the Esc key. Closed: not shown again for 3 days. Watched to the end: not shown again.
 * - Waits while another pop-up (support prompt, story reader, lightbox) is open.
 */
const SHOW_AFTER_SECONDS = 60;
const SNOOZE_MS = 3 * 24 * 3600 * 1000;
const SKIP = /^\/(admin|ad-report|epaper|support-us|login|signin|account|reader|api)(\/|$)/;
const TIME_KEY = 'wf-vpop-seconds';
const MOBILE = '(max-width: 720px)';

function readNum(key: string) { try { return Number(sessionStorage.getItem(key)) || 0; } catch { return 0; } }
function writeNum(key: string, n: number) { try { sessionStorage.setItem(key, String(n)); } catch {} }
function suppressed(creative: string) {
  try {
    const v = JSON.parse(localStorage.getItem(`wf-vpop:${creative}`) || 'null');
    if (!v) return false;
    return v.s === 'watched' || Date.now() - v.t < SNOOZE_MS;
  } catch { return false; }
}
function remember(creative: string, s: 'closed' | 'watched') {
  try { localStorage.setItem(`wf-vpop:${creative}`, JSON.stringify({ s, t: Date.now() })); } catch {}
}
function vimeoId(url: string | null) {
  const m = url?.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function VideoPopIn() {
  const pathname = usePathname() || '/';
  const [ad, setAd] = useState<LiveAd | null>(null);
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const seconds = useRef(0);
  const done = useRef(false); // shown (or ruled out) in this page visit
  const started = useRef(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const skip = SKIP.test(pathname);

  // Count the minute: only while the tab is visible and nothing else is popped up.
  useEffect(() => {
    if (done.current) return;
    seconds.current = readNum(TIME_KEY);
    const t = window.setInterval(async () => {
      if (done.current || document.visibilityState !== 'visible') return;
      seconds.current += 1;
      writeNum(TIME_KEY, seconds.current);
      if (seconds.current < SHOW_AFTER_SECONDS || skip) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      done.current = true;
      window.clearInterval(t);
      try {
        const res = await fetch('/api/ads/pop');
        const ads: LiveAd[] = res.ok ? await res.json() : [];
        const device = window.matchMedia(MOBILE).matches ? 'mobile' : 'desktop';
        const pick = ads.find(a => (a.device === 'all' || a.device === device) && a.video_url && !suppressed(a.creative_id));
        if (!pick) return;
        setAd(pick);
        setOpen(true);
        sendEvent(pick, 'impression');
      } catch {}
    }, 1000);
    return () => window.clearInterval(t);
  }, [skip]);

  // Hide it if the reader moves to a page where it shouldn't be.
  useEffect(() => { if (skip && open) setOpen(false); }, [skip, open]);

  const close = useCallback((how: 'closed' | 'watched' = 'closed') => {
    if (ad) remember(ad.creative_id, how);
    setOpen(false);
  }, [ad]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

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

  // Vimeo player events (play / ended) arrive as messages from the player frame.
  const vimeo = vimeoId(ad?.video_url ?? null);
  useEffect(() => {
    if (!open || !vimeo) return;
    const post = (method: string, value?: unknown) => frame.current?.contentWindow?.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), 'https://player.vimeo.com');
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== 'https://player.vimeo.com') return;
      let d: any; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
      if (d?.event === 'ready') { post('addEventListener', 'play'); post('addEventListener', 'ended'); }
      if (d?.event === 'play') onStart();
      if (d?.event === 'ended') onEnd();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [open, vimeo, onStart, onEnd]);

  // After the end card has been up a while, tidy it away.
  useEffect(() => {
    if (!ended) return;
    const t = window.setTimeout(() => setOpen(false), 12000);
    return () => window.clearTimeout(t);
  }, [ended]);

  const unmute = () => {
    setMuted(false);
    if (vimeo) {
      const w = frame.current?.contentWindow;
      w?.postMessage(JSON.stringify({ method: 'setMuted', value: false }), 'https://player.vimeo.com');
      w?.postMessage(JSON.stringify({ method: 'setVolume', value: 1 }), 'https://player.vimeo.com');
    } else if (video.current) {
      video.current.muted = false;
      video.current.play().catch(() => {});
    }
  };

  const replay = () => {
    setEnded(false);
    if (vimeo) {
      const w = frame.current?.contentWindow;
      w?.postMessage(JSON.stringify({ method: 'setCurrentTime', value: 0 }), 'https://player.vimeo.com');
      w?.postMessage(JSON.stringify({ method: 'play' }), 'https://player.vimeo.com');
    } else if (video.current) {
      video.current.currentTime = 0;
      video.current.play().catch(() => {});
    }
  };

  if (!ad || !open) return null;
  const src = vimeo
    ? `https://player.vimeo.com/video/${vimeo}?autoplay=1&muted=1&playsinline=1&title=0&byline=0&portrait=0&dnt=1&api=1`
    : null;
  const cta = ad.cta_label || 'Find out more';

  return <aside className={styles.pop} aria-label={`Advertisement: ${ad.headline || ad.advertiser || 'video'}`}>
    <div className={styles.head}>
      <span className={styles.label}>Advertisement</span>
      <span className={styles.title}>{ad.headline || ad.advertiser}</span>
      <button type="button" className={styles.close} onClick={() => close()} aria-label="Close video">×</button>
    </div>
    <div className={styles.screen}>
      {src
        ? <iframe ref={frame} src={src} title={ad.alt_text || ad.headline || 'Video advertisement'} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>
        : <video ref={video} src={ad.video_url || undefined} poster={ad.poster_image || undefined} autoPlay muted playsInline controls
            onPlay={onStart} onEnded={onEnd}/>}
      {muted && !ended ? <button type="button" className={styles.sound} onClick={unmute}><span aria-hidden="true">🔊</span> Tap for sound</button> : null}
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
      <button type="button" className={styles.later} onClick={() => close()}>Not now</button>
    </div>
  </aside>;
}
