'use client';
import { useEffect, useRef, useState } from 'react';
import type { LiveAd } from '@/lib/ads';
import { clickHref, sendEvent } from './AdUnit';
import { resizedImage } from '@/lib/image-url';
import styles from './AdSpotlight.module.css';
import { AdLightbox } from './AdLightbox';
import { useReadingGate } from './useReadingGate';

/** Stay up this long (paused while the reader hovers or focuses it), then slide away. */
const STAY_MS = 12000;

/**
 * Short-lived promotion: a card slides into the bottom corner once the reader
 * has read for 10 seconds and scrolled or tapped (useReadingGate), stays briefly, then slides away by itself. Once per
 * ad per browser session, and the reader can close it. It never covers the
 * story text on desktop, and on phones it is a slim bar along the bottom.
 */
export function AdSpotlight({ ads }: { ads: LiveAd[] }) {
  const ad = ads.find(a => a.format === 'image' && (a.desktop_image || a.mobile_image)) ?? null;
  const [phase, setPhase] = useState<'waiting' | 'in' | 'out'>('waiting');
  const [hold, setHold] = useState(false);
  const [big, setBig] = useState(false);
  const counted = useRef(false);
  const seenKey = ad ? `wf-spotlight-${ad.assignment_id}` : '';
  const readEnough = useReadingGate(Boolean(ad));

  useEffect(() => {
    if (!ad || !readEnough) return;
    try { if (sessionStorage.getItem(seenKey)) return; } catch {}
    setPhase('in');
  }, [ad, seenKey, readEnough]);

  useEffect(() => {
    if (phase !== 'in' || !ad) return;
    if (!counted.current) {
      counted.current = true;
      sendEvent(ad, 'impression');
      try { sessionStorage.setItem(seenKey, '1'); } catch {}
    }
    if (hold || big) return;
    const timer = setTimeout(() => setPhase('out'), STAY_MS);
    return () => clearTimeout(timer);
  }, [phase, hold, big, ad, seenKey]);

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
    <div className={styles.body}>
      <button type="button" className={styles.open} onClick={() => { setBig(true); sendEvent(ad, 'expand'); }} aria-label={`${ad.alt_text || text}. Open larger`}>
        <img className={styles.poster} src={resizedImage(image, 560, 78)} alt="" decoding="async"/>
      </button>
      <span className={styles.text}>
        <strong>{text}</strong>
        {href ? <a className={styles.cta} href={href} target="_blank" rel="sponsored noopener">{ad.cta_label || 'Learn more'}</a> : null}
      </span>
    </div>
    {big ? <AdLightbox ad={ad} clickHref={href ?? null} onClose={() => setBig(false)}/> : null}
  </aside>;
}
