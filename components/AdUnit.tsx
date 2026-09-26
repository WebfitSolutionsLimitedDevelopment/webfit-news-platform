'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LiveAd } from '@/lib/ads';
import styles from './AdUnit.module.css';

export type AdVariant = 'banner' | 'inline' | 'rail' | 'sticky';

const MOBILE_QUERY = '(max-width: 720px)';

function currentDevice(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return window.matchMedia(MOBILE_QUERY).matches ? 'mobile' : 'desktop';
}

function sendEvent(ad: LiveAd, event: 'impression' | 'video_start' | 'video_complete') {
  try {
    const body = JSON.stringify({ a: ad.assignment_id, e: event, d: currentDevice() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/ads/event', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/ads/event', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch {}
}

/** Weighted pick: priority acts as the weight, so 200 shows twice as often as 100. */
function pickAd(ads: LiveAd[], device: 'mobile' | 'desktop'): LiveAd | null {
  const eligible = ads.filter(ad => ad.device === 'all' || ad.device === device);
  if (!eligible.length) return null;
  const total = eligible.reduce((sum, ad) => sum + Math.max(1, ad.priority || 1), 0);
  let roll = Math.random() * total;
  for (const ad of eligible) {
    roll -= Math.max(1, ad.priority || 1);
    if (roll <= 0) return ad;
  }
  return eligible[0];
}

function clickHref(ad: LiveAd) {
  return `/api/ads/click?a=${encodeURIComponent(ad.assignment_id)}`;
}

function VideoCreative({ ad }: { ad: LiveAd }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (!video.ended) video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    }, { threshold: [0, 0.5, 1] });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (video.paused) video.play().catch(() => {});
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.ended) { video.currentTime = 0; setEnded(false); }
    if (video.paused) video.play().catch(() => {}); else video.pause();
  };

  return <div className={styles.videoWrap}>
    <video
      ref={videoRef}
      className={styles.video}
      src={ad.video_url || undefined}
      poster={ad.poster_image || undefined}
      muted
      playsInline
      preload="metadata"
      aria-label={ad.alt_text || ad.headline || 'Video advertisement'}
      onPlay={() => { setPlaying(true); setEnded(false); if (!started.current) { started.current = true; sendEvent(ad, 'video_start'); } }}
      onPause={() => setPlaying(false)}
      onEnded={() => { setPlaying(false); setEnded(true); sendEvent(ad, 'video_complete'); }}
    />
    <div className={styles.videoControls}>
      <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause video' : ended ? 'Replay video' : 'Play video'}>
        {playing ? 'Pause' : ended ? 'Replay' : 'Play'}
      </button>
      <button type="button" onClick={toggleSound} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
        {muted ? 'Sound on' : 'Mute'}
      </button>
    </div>
  </div>;
}

export function AdUnit({ ads, variant = 'banner', className = '' }: { ads: LiveAd[]; variant?: AdVariant; className?: string }) {
  // Server render and first paint use the highest-priority ad; the browser
  // then rotates between everything booked into this position.
  const [ad, setAd] = useState<LiveAd | null>(ads[0] ?? null);
  const [dismissed, setDismissed] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(variant !== 'sticky');
  const zoneRef = useRef<HTMLElement>(null);
  const seen = useRef(false);

  useEffect(() => {
    setAd(pickAd(ads, currentDevice()));
  }, [ads]);

  // Count an impression once, when at least half the ad has been on screen for one second.
  useEffect(() => {
    const node = zoneRef.current;
    if (!ad || !node || seen.current || typeof IntersectionObserver === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (!timer) timer = setTimeout(() => {
          if (!seen.current) { seen.current = true; sendEvent(ad, 'impression'); }
          observer.disconnect();
        }, 1000);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }, { threshold: [0, 0.5, 1] });
    observer.observe(node);
    return () => { observer.disconnect(); if (timer) clearTimeout(timer); };
  }, [ad, stickyVisible]);

  // Sticky bar: appear once the reader is a third of the way down, remember a close for the session.
  useEffect(() => {
    if (variant !== 'sticky') return;
    try { if (sessionStorage.getItem('wf-sticky-ad-closed') === '1') { setDismissed(true); return; } } catch {}
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.3) {
        setStickyVisible(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  const close = useCallback(() => {
    setDismissed(true);
    try { sessionStorage.setItem('wf-sticky-ad-closed', '1'); } catch {}
  }, []);

  if (!ad || dismissed) return null;
  if (variant === 'sticky' && !stickyVisible) return null;

  const deviceClass = ad.device === 'desktop' ? styles.desktopOnly : ad.device === 'mobile' ? styles.mobileOnly : '';
  const label = ad.is_election_ad ? 'Election advertisement' : 'Advertisement';
  const altText = ad.alt_text || ad.headline || (ad.advertiser ? `Advertisement from ${ad.advertiser}` : 'Advertisement');
  const hasImage = Boolean(ad.desktop_image || ad.mobile_image);
  const isVideo = ad.format === 'video' && Boolean(ad.video_url);

  return <aside
    ref={zoneRef}
    className={`${styles.zone} ${styles[variant]} ${deviceClass} ${className}`}
    aria-label={label}
    data-ad-slot={ad.slot_key}
  >
    <span className={styles.label}>{label}</span>
    {isVideo ? <>
      <VideoCreative key={ad.assignment_id} ad={ad}/>
      {ad.destination_url ? <div className={styles.cta}>
        <span>{ad.headline || ad.advertiser}</span>
        <a href={clickHref(ad)} target="_blank" rel="sponsored noopener">{ad.cta_label || 'Learn more'}</a>
      </div> : null}
    </> : hasImage ? (() => {
      const picture = <picture>
        {ad.mobile_image ? <source media={MOBILE_QUERY} srcSet={ad.mobile_image}/> : null}
        <img src={ad.desktop_image || ad.mobile_image || ''} alt={altText} loading={variant === 'banner' ? 'eager' : 'lazy'} decoding="async"/>
      </picture>;
      return ad.destination_url
        ? <a className={styles.frame} href={clickHref(ad)} target="_blank" rel="sponsored noopener">{picture}</a>
        : <div className={styles.frame}>{picture}</div>;
    })() : null}
    {ad.is_election_ad && ad.promoter_statement ? <p className={styles.promoter}>{ad.promoter_statement}</p> : null}
    {variant === 'sticky' ? <button type="button" className={styles.close} onClick={close} aria-label="Close advertisement">×</button> : null}
  </aside>;
}
