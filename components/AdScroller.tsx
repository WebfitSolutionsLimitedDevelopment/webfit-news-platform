'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LiveAd } from '@/lib/ads';
import { clickHref, sendEvent } from './AdUnit';
import { resizedImage } from '@/lib/image-url';
import styles from './AdScroller.module.css';

/*
 * Full-screen "scroll-through" ad (an interscroller) for phones, in the ARTICLE_SCROLLER spot.
 * The story scrolls past a window; behind it the poster fills the screen and stays still, so the
 * story slides off it and back on. With two or more posters booked, they fade into each other every
 * few seconds while the window is on screen. Hidden on computers. One view counted per poster shown.
 */

const SLIDE_MS = 3500;

export function AdScroller({ ads }: { ads: LiveAd[] }) {
  const slides = useMemo(() => ads.filter(ad => ad.device !== 'desktop' && (ad.mobile_image || ad.poster_image || ad.desktop_image)).slice(0, 4), [ads]);
  const [onScreen, setOnScreen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const counted = useRef(new Set<string>());

  useEffect(() => {
    const q = window.matchMedia('(max-width: 720px)');
    const set = () => setPhone(q.matches);
    set(); q.addEventListener('change', set);
    return () => q.removeEventListener('change', set);
  }, []);

  // Is the window on screen? (Fading and counting only happen while it is.)
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !phone || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting && e.intersectionRatio >= 0.5), { threshold: [0, 0.5, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [phone]);

  // Fade to the next poster every few seconds while on screen (not for readers who turn motion off).
  useEffect(() => {
    if (!onScreen || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setActive(i => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [onScreen, slides.length]);

  // One view per poster per page, when it has actually been on screen.
  useEffect(() => {
    const ad = slides[active];
    if (onScreen && ad && !counted.current.has(ad.assignment_id)) { counted.current.add(ad.assignment_id); sendEvent(ad, 'impression'); }
  }, [onScreen, active, slides]);

  if (!slides.length) return null;
  const current = slides[active] || slides[0];
  return <div className={styles.wrap} ref={boxRef} aria-label="Advertisement">
    <span className={styles.label}>Advertisement · scroll to keep reading</span>
    <a className={styles.window} href={clickHref(current)} target="_blank" rel="sponsored noopener" aria-label={current.alt_text || current.headline || current.advertiser || 'Advertisement'}>
      <span className={styles.fixed}>
        {/* Each poster sits on a blurred copy of itself, so posters that aren't phone-shaped fill the screen without black bars.
            Loaded with the page (not lazily), so the window never opens on a black screen. */}
        {slides.map((ad, i) => {
          const src = resizedImage(ad.mobile_image || ad.poster_image || ad.desktop_image || '', 1080, 80);
          return <span key={ad.assignment_id} className={`${styles.slide} ${i === active ? styles.on : ''}`}>
            <img className={styles.bg} src={src} alt="" aria-hidden="true" decoding="async"/>
            <img className={styles.art} src={src} alt={i === active ? (ad.alt_text || '') : ''} decoding="async"/>
          </span>;
        })}
      </span>
      {current.cta_label ? <span className={styles.cta}>{current.cta_label} ›</span> : null}
    </a>
    <span className={styles.label}>Story continues</span>
  </div>;
}
