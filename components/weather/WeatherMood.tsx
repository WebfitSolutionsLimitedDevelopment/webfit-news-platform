'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SEASONS, SKIES, type Feel, type Season, type Sky, type WeatherMood as Mood } from '../../lib/weather-mood';
import { startWeatherFx, type FxKind } from './weather-fx';
import { christmasCountdownActive } from '../../lib/christmas';

/** No weather effects in the newsroom, sign-in, ad reports or the e-paper (it copies a printed page). */
const SKIP = /^\/(admin|login|epaper|ad-report)(\/|$)/;
const CACHE_KEY = 'wf-wx-mood-v2';
const CACHE_MS = 10 * 60 * 1000;

/** Browser bar colour on phones, per sky. */
const BAR: Record<Sky, string> = {
  clear: '#0b1117', cloud: '#3b4652', fog: '#8a949c', drizzle: '#3d4e5e',
  rain: '#2f4152', storm: '#1f2a36', sleet: '#5b6b7a', snow: '#6f8396',
};

function fxFor(mood: Mood): FxKind | null {
  if (mood.sky === 'drizzle' || mood.sky === 'rain' || mood.sky === 'storm' || mood.sky === 'sleet' || mood.sky === 'snow') return mood.sky;
  if (mood.night || mood.sky === 'fog') return null;
  // The Christmas card is the seasonal moment in Nov and Dec; no petals or leaves alongside it.
  if (christmasCountdownActive()) return null;
  if (mood.season === 'autumn') return 'leaves';
  if (mood.season === 'spring') return 'petals';
  return null;
}

/** ?wx=rain&season=winter&night=1&feel=cold previews any mood without waiting for the weather. */
function previewMood(): Mood | null {
  const q = new URLSearchParams(window.location.search);
  const sky = q.get('wx') as Sky | null;
  if (!sky || !SKIES.includes(sky)) return null;
  const season = q.get('season') as Season | null;
  const feel = q.get('feel') as Feel | null;
  return {
    sky,
    season: season && SEASONS.includes(season) ? season : 'spring',
    night: q.get('night') === '1',
    feel: feel === 'hot' || feel === 'cold' ? feel : 'mild',
    wind: Number(q.get('wind')) || 4,
  };
}

async function loadMood(): Promise<Mood | null> {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.mood;
  } catch {}
  try {
    const res = await fetch('/api/weather-mood');
    if (!res.ok) return null;
    const mood: Mood = await res.json();
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), mood })); } catch {}
    return mood;
  } catch {
    return null;
  }
}

/** The masthead band (logo row, plus the desktop section menu) in page coordinates. */
function mastheadBand(): { top: number; height: number } {
  let top = Infinity, bottom = 0;
  document.querySelectorAll('[data-wx-masthead]').forEach(h => {
    const r = h.getBoundingClientRect();
    if (r.height > 0) { top = Math.min(top, r.top + window.scrollY); bottom = Math.max(bottom, r.bottom + window.scrollY); }
  });
  if (!bottom) return { top: 0, height: 0 };
  const nav = document.querySelector<HTMLElement>('.nav-premium-wrap');
  if (nav && nav.offsetHeight > 0) bottom += nav.offsetHeight;
  return { top: Math.round(top), height: Math.round(bottom - top) };
}

/**
 * Brings the reader's local weather into the masthead: a tint plus rain,
 * snow, mist or sun glow across the logo row and section menu, fading out
 * above the first story. The support banner and date bar stay as they are. Nothing is drawn over stories,
 * the Christmas card or the Breaking bar, and nothing on the page moves.
 * Attributes on <html> pick the look; styles are in app/weather-mood.css.
 */
export function WeatherMood() {
  const pathname = usePathname() || '';
  const skip = SKIP.test(pathname);
  const [mood, setMood] = useState<Mood | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [band, setBand] = useState({ top: 0, height: 0 });

  // Measure the masthead band and keep it right when the window or header changes size.
  useEffect(() => {
    if (skip || !mood) return;
    const measure = () => setBand(mastheadBand());
    measure();
    const watch = new ResizeObserver(measure);
    document.querySelectorAll('[data-wx-masthead]').forEach(h => watch.observe(h));
    window.addEventListener('resize', measure);
    return () => { watch.disconnect(); window.removeEventListener('resize', measure); };
  }, [skip, mood, pathname]);

  useEffect(() => {
    if (skip || mood) return;
    let cancelled = false;
    const preview = previewMood();
    if (preview) { setMood(preview); return; }
    // Wait until the page has settled so the weather never competes with the story loading.
    const idle = (window as any).requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 1200));
    idle(() => { loadMood().then(m => { if (!cancelled && m) setMood(m); }); }, { timeout: 3000 });
    return () => { cancelled = true; };
  }, [skip, mood]);

  // Attributes on <html> drive the colours.
  useEffect(() => {
    const root = document.documentElement;
    if (skip || !mood) {
      for (const a of ['data-wx-sky', 'data-wx-season', 'data-wx-time', 'data-wx-feel']) root.removeAttribute(a);
      return;
    }
    root.setAttribute('data-wx-sky', mood.sky);
    root.setAttribute('data-wx-season', mood.season);
    root.setAttribute('data-wx-time', mood.night ? 'night' : 'day');
    root.setAttribute('data-wx-feel', mood.feel);
    const meta = document.querySelector('meta[name="theme-color"]');
    const before = meta?.getAttribute('content');
    meta?.setAttribute('content', BAR[mood.sky]);
    return () => { if (meta && before) meta.setAttribute('content', before); };
  }, [skip, mood]);

  // The moving layer, only when the device allows motion.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (skip || !mood || !canvas || !band.height) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const kind = fxFor(mood);
    if (!kind) return;
    return startWeatherFx(canvas, kind, mood.wind);
  }, [skip, mood, band.height > 0]);

  if (skip || !mood || !band.height) return null;
  return (
    <div className="wx-layer" aria-hidden="true" style={{ top: band.top, height: band.height }}>
      <div className="wx-wash" />
      {mood.sky === 'fog' ? <div className="wx-fog" /> : null}
      <canvas ref={canvasRef} className="wx-fx" />
    </div>
  );
}
