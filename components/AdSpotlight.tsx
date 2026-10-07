'use client';
import { useEffect, useRef, useState } from 'react';
import type { LiveAd } from '@/lib/ads';
import { clickHref, sendEvent } from './AdUnit';
import { resizedImage } from '@/lib/image-url';
import styles from './AdSpotlight.module.css';

/** Wait this long after the page opens, then slide in. */
const SHOW_AFTER_MS = 3000;
/** Stay up this long (paused while the reader hovers or focuses it), then slide away. */
const STAY_MS = 12000;

/**
 * Short-lived promotion: a card slides into the bottom corner a few seconds
 * after the page opens, stays briefly, then slides away by itself. Once per
 * ad per browser session, and the reader can close it. It never covers the
 * story text on desktop, and on phones it is a slim bar along the bottom.
 */
export function AdSpotlight({ ads }: { ads: LiveAd[] }) {
  const ad = ads.find(a => a.format === 'image' && (a.desktop_image || a.mobile_image)) ?? null;
  const [phase, setPhase] = useState<'waiting' | 'in' | 'out'>('waiting');
  const [hold, setHold] = useState(false);
  const counted = useRef(false);
  const seenKey = ad ? `wf-spotlight-${ad.assignment_id}` : '';

  useEffect(() => {
    if (!ad) return;
    try { if (sessionStorage.getItem(seenKey)) return; } catch {}
    const timer = setTimeout(() => setPhase('in'), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [ad, seenKey]);

  useEffect(() => {
    if (phase !== 'in' || !ad) return;
    if (!counted.current) {
      counted.current = true;
      sendEvent(ad, 'impression');
      try { sessionStorage.setItem(seenKey, '1'); } catch {}
    }
    if (hold) return;
    const timer = setTimeout(() => setPhase('out'), STAY_MS);
    return () => clearTimeout(timer);
  }, [phase, hold, ad, seenKey]);

  if (!ad || phase === 'waiting') return null;
  const image = ad.mobile_image || ad.desktop_image || '';
  const text = ad.headline || ad.alt_text || ad.advertiser || 'Advertisement';
  const href = ad.destination_url ? clickHref(ad) : undefined;

  return <aside
    className={`${styles.card} ${phase === 'out' ? styles.out : styles.in}`}
    aria-label="Advertisement"
    onMouseEnter={() => setHold(true)}
    onMouseLeave={() => setHold(false)}
    onFocus={() => setHold(true)}
    onBlur={() => setHold(false)}
    onAnimationEnd={() => { if (phase === 'out') setPhase('waiting'); }}
  >
    <span className={styles.label}>Advertisement</span>
    <button type="button" className={styles.close} onClick={() => setPhase('out')} aria-label="Close advertisement">×</button>
    <a className={styles.body} href={href} target="_blank" rel="sponsored noopener">
      <img className={styles.poster} src={resizedImage(image, 560, 78)} alt={ad.alt_text || text} decoding="async"/>
      <span className={styles.text}>
        <strong>{text}</strong>
        {href ? <span className={styles.cta}>{ad.cta_label || 'Learn more'}</span> : null}
      </span>
    </a>
  </aside>;
}
