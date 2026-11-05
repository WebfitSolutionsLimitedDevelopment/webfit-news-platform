'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LiveAd } from '@/lib/ads';
import { clickHref, sendEvent } from './AdUnit';
import { resizedImage } from '@/lib/image-url';
import styles from './AdScroller.module.css';

/*
 * Full-screen scroll-through ad (an interscroller) for phones, in the ARTICLE_SCROLLER spot.
 *
 * Two or more posters: stacked cards driven by the reader's scrolling, as on awaaz.co.nz. Each poster
 * fills the screen and stays pinned; scrolling on, the next poster slides up from the bottom and covers
 * it; after the last one the story slides up over them. Scrolling back reverses it.
 * One poster: a still "window": the poster stays fixed while the story scrolls past it.
 *
 * Hidden on computers. One view counted per poster when at least half of it has been on screen.
 */

const src = (ad: LiveAd) => resizedImage(ad.mobile_image || ad.poster_image || ad.desktop_image || '', 1080, 80);

function Poster({ ad }: { ad: LiveAd }) {
  // A blurred copy of the poster behind it fills the screen, so posters that aren't phone-shaped have no black bars.
  return <>
    <img className={styles.bg} src={src(ad)} alt="" aria-hidden="true" decoding="async"/>
    <img className={styles.art} src={src(ad)} alt={ad.alt_text || ad.headline || ''} decoding="async"/>
    {ad.cta_label ? <span className={styles.cta}>{ad.cta_label} ›</span> : null}
  </>;
}

export function AdScroller({ ads }: { ads: LiveAd[] }) {
  const slides = useMemo(() => ads.filter(ad => ad.device !== 'desktop' && (ad.mobile_image || ad.poster_image || ad.desktop_image)).slice(0, 4), [ads]);
  const [phone, setPhone] = useState(false);
  const panels = useRef<Array<HTMLElement | null>>([]);
  const counted = useRef(new Set<string>());

  useEffect(() => {
    const q = window.matchMedia('(max-width: 720px)');
    const set = () => setPhone(q.matches);
    set(); q.addEventListener('change', set);
    return () => q.removeEventListener('change', set);
  }, []);

  // Count a view for each poster once at least half of it has been on screen.
  useEffect(() => {
    if (!phone || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting || e.intersectionRatio < 0.5) continue;
        const ad = slides[Number((e.target as HTMLElement).dataset.i)];
        if (ad && !counted.current.has(ad.assignment_id)) { counted.current.add(ad.assignment_id); sendEvent(ad, 'impression'); }
      }
    }, { threshold: [0.5] });
    panels.current.forEach(p => p && io.observe(p));
    return () => io.disconnect();
  }, [phone, slides]);

  if (!slides.length) return null;
  const link = (ad: LiveAd) => ({ href: clickHref(ad), target: '_blank', rel: 'sponsored noopener', 'aria-label': ad.alt_text || ad.headline || ad.advertiser || 'Advertisement' });

  return <div className={styles.wrap} aria-label="Advertisement">
    <span className={styles.label}>Advertisement · scroll to keep reading</span>
    {slides.length === 1
      ? <a className={styles.window} {...link(slides[0])} ref={el => { panels.current[0] = el; }} data-i={0}>
          <span className={styles.fixed}><Poster ad={slides[0]}/></span>
        </a>
      : <div className={styles.stack} style={{ ['--cards' as string]: slides.length }}>
          {slides.map((ad, i) => <a key={ad.assignment_id} className={styles.card} {...link(ad)} ref={el => { panels.current[i] = el; }} data-i={i} style={{ zIndex: i + 1 }}>
            <Poster ad={ad}/>
          </a>)}
        </div>}
    <span className={styles.label}>Story continues</span>
  </div>;
}
