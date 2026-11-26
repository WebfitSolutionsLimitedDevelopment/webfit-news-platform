'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './HeaderLogo.module.css';

/**
 * Header logo with the spinning-globe video (Vimeo 1250218638) playing in the same spot.
 * - The still logo shows first; the video loads a few seconds after the page, so it never slows the page down.
 * - Video is cropped to the globe and wordmark only (the web address line underneath is left out).
 * - Loops silently with no controls; clicks go through to the home link.
 * - Pauses when the header scrolls out of view; skipped for readers who ask for less motion or on data-saver.
 */
const VIMEO = 'https://player.vimeo.com';
const VIDEO_ID = '1250218638';
const START_AFTER_MS = 2500;

export function HeaderLogo({ alt, variant }: { alt: string; variant: 'desktop' | 'mobile' }) {
  const wrap = useRef<HTMLSpanElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [load, setLoad] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Decide whether to load the video: only for the header that's actually on screen (desktop or phone).
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const conn = (navigator as any).connection;
    if (conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType || '')) return;
    let t = 0;
    const start = () => { t = window.setTimeout(() => { if (el.offsetParent !== null) setLoad(true); }, START_AFTER_MS); };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
    return () => { window.clearTimeout(t); window.removeEventListener('load', start); };
  }, []);

  // Fade the video in once it's actually playing; pause it while the header is off screen.
  useEffect(() => {
    if (!load) return;
    const post = (method: string, value?: unknown) =>
      frame.current?.contentWindow?.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), VIMEO);
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== VIMEO || e.source !== frame.current?.contentWindow) return;
      let d: any; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
      if (d?.event === 'ready') post('addEventListener', 'play');
      if (d?.event === 'play') setPlaying(true);
    };
    window.addEventListener('message', onMsg);
    const fallback = window.setTimeout(() => setPlaying(true), 6000);
    const io = new IntersectionObserver(([entry]) => post(entry.isIntersecting ? 'play' : 'pause'));
    if (wrap.current) io.observe(wrap.current);
    return () => { window.removeEventListener('message', onMsg); window.clearTimeout(fallback); io.disconnect(); };
  }, [load]);

  return <span ref={wrap} className={`${styles.wrap} ${styles[variant]} ${playing ? styles.playing : ''}`}>
    <img className={styles.still} src="/webfit-news-logo-400.webp" alt={alt}/>
    {load ? <iframe ref={frame} className={styles.video} tabIndex={-1} aria-hidden="true" title=""
      src={`${VIMEO}/video/${VIDEO_ID}?background=1&autopause=0&dnt=1&api=1`} allow="autoplay"/> : null}
  </span>;
}
