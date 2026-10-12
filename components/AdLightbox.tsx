'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { LiveAd } from '@/lib/ads';
import { resizedImage } from '@/lib/image-url';
import styles from './AdLightbox.module.css';

/**
 * Full-size view of a poster ad. Opens when a reader taps a poster, so the
 * small print (phone numbers, dates, addresses) is readable. The advertiser's
 * link becomes a button under the big poster; ads without a link just show
 * large. Closes with ×, a tap on the backdrop, or Escape.
 */
export function AdLightbox({ ad, clickHref, onClose }: { ad: LiveAd; clickHref: string | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [onClose]);

  const image = ad.desktop_image || ad.mobile_image || ad.poster_image || '';
  const alt = ad.alt_text || ad.headline || (ad.advertiser ? `Advertisement from ${ad.advertiser}` : 'Advertisement');
  const label = ad.is_election_ad ? 'Election advertisement' : 'Advertisement';

  return createPortal(<div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={`${label}: ${alt}`} onClick={onClose}>
    <div className={styles.panel} onClick={e => e.stopPropagation()}>
      <div className={styles.top}>
        <span className={styles.label}>{label}{ad.advertiser && !ad.is_election_ad ? ` · ${ad.advertiser}` : ''}</span>
        <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close">×</button>
      </div>
      <img className={styles.poster} src={resizedImage(image, 1600, 85)} alt={alt} decoding="async"/>
      {ad.is_election_ad && ad.promoter_statement ? <p className={styles.promoter}>{ad.promoter_statement}</p> : null}
      {clickHref ? <a className={styles.cta} href={clickHref} target="_blank" rel="sponsored noopener">{ad.cta_label || 'Visit website'} →</a> : null}
    </div>
  </div>, document.body);
}
