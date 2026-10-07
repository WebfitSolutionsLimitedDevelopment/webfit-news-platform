'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LiveAd } from '@/lib/ads';
import styles from './AdUnit.module.css';
import { imageSrcSet, resizedImage } from '@/lib/image-url';

export type AdVariant = 'banner' | 'inline' | 'rail' | 'sticky';

const MOBILE_QUERY = '(max-width: 720px)';

/** Posters use the shared resizer (keeps shape, sends WebP, leaves GIFs alone). */
const resized = (url: string, width: number) => resizedImage(url, width, 78);
const srcSet = (url: string, widths: number[]) => imageSrcSet(url, widths, 78);

/** Widths to offer per position, and how wide the slot is on screen. */
const IMAGE_SIZES: Record<AdVariant, { widths: number[]; sizes: string }> = {
  banner: { widths: [480, 970, 1400], sizes: '(max-width: 720px) 100vw, 970px' },
  inline: { widths: [480, 728, 1100], sizes: '(max-width: 720px) 100vw, 728px' },
  rail: { widths: [300, 600], sizes: '300px' },
  sticky: { widths: [320, 640], sizes: '100vw' },
};

function currentDevice(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return window.matchMedia(MOBILE_QUERY).matches ? 'mobile' : 'desktop';
}

export function sendEvent(ad: LiveAd, event: 'impression' | 'video_start' | 'video_complete') {
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

export function clickHref(ad: LiveAd) {
  return `/api/ads/click?a=${encodeURIComponent(ad.assignment_id)}`;
}

function VideoCreative({ ad, active = true, onEnded }: { ad: LiveAd; active?: boolean; onEnded?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!active) { video.pause(); return; }
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
  }, [active]);

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
      poster={ad.poster_image ? resized(ad.poster_image, 1100) : undefined}
      muted
      playsInline
      preload="metadata"
      aria-label={ad.alt_text || ad.headline || 'Video advertisement'}
      onPlay={() => { setPlaying(true); setEnded(false); if (!started.current) { started.current = true; sendEvent(ad, 'video_start'); } }}
      onPause={() => setPlaying(false)}
      onEnded={() => { setPlaying(false); setEnded(true); sendEvent(ad, 'video_complete'); onEnded?.(); }}
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

/** How long each poster stays up before the next one slides in. */
const ROTATE_MS = 5000;

function Creative({ ad, variant, active, onVideoEnd }: { ad: LiveAd; variant: AdVariant; active: boolean; onVideoEnd: () => void }) {
  const altText = ad.alt_text || ad.headline || (ad.advertiser ? `Advertisement from ${ad.advertiser}` : 'Advertisement');
  const isVideo = ad.format === 'video' && Boolean(ad.video_url);
  const hasImage = Boolean(ad.desktop_image || ad.mobile_image);
  return <>
    {isVideo ? <>
      <VideoCreative ad={ad} active={active} onEnded={onVideoEnd}/>
      {ad.destination_url ? <div className={styles.cta}>
        <span>{ad.headline || ad.advertiser}</span>
        <a href={clickHref(ad)} target="_blank" rel="sponsored noopener" tabIndex={active ? 0 : -1}>{ad.cta_label || 'Learn more'}</a>
      </div> : null}
    </> : hasImage ? (() => {
      const { widths, sizes } = IMAGE_SIZES[variant];
      const main = ad.desktop_image || ad.mobile_image || '';
      const mobile = ad.mobile_image && ad.mobile_image !== main ? ad.mobile_image : null;
      const picture = <picture>
        {mobile ? <source media={MOBILE_QUERY} srcSet={srcSet(mobile, [480, 720, 1080]) || mobile} sizes="100vw"/> : null}
        <img src={resized(main, widths[1] || widths[0])} srcSet={srcSet(main, widths)} sizes={sizes} alt={altText} loading={variant === 'banner' ? 'eager' : 'lazy'} decoding="async"/>
      </picture>;
      return ad.destination_url
        ? <a className={styles.frame} href={clickHref(ad)} target="_blank" rel="sponsored noopener" tabIndex={active ? 0 : -1}>{picture}</a>
        : <div className={styles.frame}>{picture}</div>;
    })() : null}
    {ad.is_election_ad && ad.promoter_statement ? <p className={styles.promoter}>{ad.promoter_statement}</p> : null}
  </>;
}

/** Order for this visit: weighted random start, then the rest in turn, so every advertiser gets seen. */
function rotationOrder(ads: LiveAd[]): LiveAd[] {
  if (ads.length < 2) return ads;
  const first = pickAd(ads, currentDevice());
  const i = first ? ads.indexOf(first) : 0;
  return [...ads.slice(i), ...ads.slice(0, i)];
}

export function AdUnit({ ads, variant = 'banner', className = '' }: { ads: LiveAd[]; variant?: AdVariant; className?: string }) {
  // Server render and first paint show the highest-priority ad. In the browser,
  // every ad booked into this position takes a turn, one after another.
  const [list, setList] = useState<LiveAd[]>(ads.slice(0, 1));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(variant !== 'sticky');
  const zoneRef = useRef<HTMLElement>(null);
  const counted = useRef<Set<string>>(new Set());

  useEffect(() => {
    const device = currentDevice();
    const eligible = ads.filter(ad => ad.device === 'all' || ad.device === device);
    // Start from the ad the server already painted, so nothing swaps on load (no flicker).
    // Readers still see every ad because the position keeps rotating.
    const painted = eligible.findIndex(ad => ad.assignment_id === ads[0]?.assignment_id);
    setList(painted >= 0 ? [...eligible.slice(painted), ...eligible.slice(0, painted)] : rotationOrder(eligible));
    setIndex(0);
  }, [ads]);

  const ad = list[index] ?? null;
  const many = list.length > 1;
  const next = useCallback(() => setIndex(i => (list.length ? (i + 1) % list.length : 0)), [list.length]);
  const prev = useCallback(() => setIndex(i => (list.length ? (i - 1 + list.length) % list.length : 0)), [list.length]);

  // Is the ad position on screen? Rotation and view counting only happen while it is.
  useEffect(() => {
    const node = zoneRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting && entry.intersectionRatio >= 0.5), { threshold: [0, 0.5, 1] });
    observer.observe(node);
    return () => observer.disconnect();
  }, [list, stickyVisible]);

  // Count a view once per ad, when it has been the one showing, at least half on screen, for one second.
  useEffect(() => {
    if (!ad || !onScreen || counted.current.has(ad.assignment_id)) return;
    const timer = setTimeout(() => {
      if (!counted.current.has(ad.assignment_id)) { counted.current.add(ad.assignment_id); sendEvent(ad, 'impression'); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [ad, onScreen]);

  // Move to the next poster every few seconds. Videos play to the end instead.
  useEffect(() => {
    if (!many || !ad || paused || !onScreen || ad.format === 'video') return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setTimeout(next, ROTATE_MS);
    return () => clearTimeout(timer);
  }, [many, ad, paused, onScreen, next]);

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

  const deviceClass = !many ? (ad.device === 'desktop' ? styles.desktopOnly : ad.device === 'mobile' ? styles.mobileOnly : '') : '';
  const label = ad.is_election_ad ? 'Election advertisement' : 'Advertisement';

  return <aside
    ref={zoneRef}
    className={`${styles.zone} ${styles[variant]} ${deviceClass} ${className}`}
    aria-label={label}
    aria-roledescription={many ? 'carousel' : undefined}
    data-ad-slot={ad.slot_key}
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)}
    onBlur={() => setPaused(false)}
  >
    <span className={styles.label}>{label}{many ? <span className={styles.count}> {index + 1} of {list.length}</span> : null}</span>
    {/* Always the same wrapper, so the first ad is not re-mounted (and does not blink) when rotation starts. */}
    <div className={styles.stack}>
      {list.map((item, i) => <div
        key={item.assignment_id}
        className={`${styles.slide} ${i === index ? styles.slideOn : ''}`}
        aria-hidden={i !== index}
        role="group"
        aria-roledescription="slide"
        aria-label={`${i + 1} of ${list.length}`}
      >
        <Creative ad={item} variant={variant} active={i === index} onVideoEnd={next}/>
      </div>)}
    </div>
    {many && variant !== 'sticky' ? <div className={styles.dots}>
      <button type="button" className={styles.arrow} onClick={prev} aria-label="Previous advertisement">‹</button>
      {list.map((item, i) => <button
        key={item.assignment_id}
        type="button"
        className={i === index ? styles.dotOn : ''}
        aria-label={`Show advertisement ${i + 1} of ${list.length}`}
        aria-current={i === index}
        onClick={() => setIndex(i)}
      />)}
      <button type="button" className={styles.arrow} onClick={next} aria-label="Next advertisement">›</button>
    </div> : null}
    {variant === 'sticky' ? <button type="button" className={styles.close} onClick={close} aria-label="Close advertisement">×</button> : null}
  </aside>;
}
