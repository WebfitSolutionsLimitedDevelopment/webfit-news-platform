'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LiveAd } from '@/lib/ads';
import { clickHref, sendEvent } from './AdUnit';
import { resizedImage } from '@/lib/image-url';
import styles from './AdCinema.module.css';

/*
 * "Cinema" ad under each story (ARTICLE_CINEMA): a wide, full-width panel straight after the last
 * paragraph, before the share box. It never sits inside the text, so it can't get in the way of reading;
 * readers who aren't interested simply scroll past. While it's on screen the picture drifts slowly
 * (a gentle camera move), and stops for readers who turn motion off. One view counted per page.
 */

export function AdCinema({ ads }: { ads: LiveAd[] }) {
  // One booking shown per page, picked by priority (200 shows twice as often as 100).
  const ad = useMemo(() => {
    const total = ads.reduce((s, a) => s + Math.max(1, a.priority || 1), 0);
    let roll = Math.random() * total;
    for (const a of ads) { roll -= Math.max(1, a.priority || 1); if (roll <= 0) return a; }
    return ads[0];
  }, [ads]);
  const ref = useRef<HTMLAnchorElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      const visible = e.isIntersecting && e.intersectionRatio >= 0.5;
      setOnScreen(visible);
      if (visible && ad && !counted.current) { counted.current = true; sendEvent(ad, 'impression'); }
    }, { threshold: [0, 0.5, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [ad]);

  if (!ad) return null;
  const image = ad.desktop_image || ad.poster_image || ad.mobile_image;
  if (!image) return null;
  return <aside className={styles.wrap} aria-label="Advertisement">
    <span className={styles.label}>Advertisement</span>
    <a ref={ref} className={`${styles.panel} ${onScreen ? styles.playing : ''}`} href={clickHref(ad)} target="_blank" rel="sponsored noopener" aria-label={ad.alt_text || ad.headline || ad.advertiser || 'Advertisement'}>
      <img className={styles.art} src={resizedImage(image, 1600, 82)} srcSet={`${resizedImage(image, 800, 80)} 800w, ${resizedImage(image, 1600, 82)} 1600w`} sizes="(max-width: 880px) 100vw, 850px" alt={ad.alt_text || ''} loading="lazy" decoding="async"/>
    </a>
    {/* Caption strip under the picture, so the button never covers the poster's title or credits. */}
    <a className={styles.caption} href={clickHref(ad)} target="_blank" rel="sponsored noopener" tabIndex={-1}>
      <span>{ad.headline || ad.advertiser}</span>
      {ad.cta_label ? <b>{ad.cta_label} ›</b> : null}
    </a>
  </aside>;
}
