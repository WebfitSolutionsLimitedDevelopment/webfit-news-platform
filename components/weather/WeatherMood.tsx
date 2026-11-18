'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SEASONS, SKIES, type Feel, type Season, type Sky, type WeatherMood as Mood } from '../../lib/weather-mood';
import { startWeatherFx, type FxKind } from './weather-fx';

/** No weather effects in the newsroom, sign-in, ad reports or the e-paper (it copies a printed page). */
const SKIP = /^\/(admin|login|epaper|ad-report)(\/|$)/;
const CACHE_KEY = 'wf-wx-mood';
const CACHE_MS = 20 * 60 * 1000;

/** Browser bar colour on phones, per sky. */
const BAR: Record<Sky, string> = {
  clear: '#0b1117', cloud: '#3b4652', fog: '#8a949c', drizzle: '#3d4e5e',
  rain: '#2f4152', storm: '#1f2a36', sleet: '#5b6b7a', snow: '#6f8396',
};

function fxFor(mood: Mood): FxKind | null {
  if (mood.sky === 'drizzle' || mood.sky === 'rain' || mood.sky === 'storm' || mood.sky === 'sleet' || mood.sky === 'snow') return mood.sky;
  if (mood.night || mood.sky === 'fog') return null;
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

/**
 * Tints the public site to match the reader's local weather and season, with
 * a light effect (rain, snow, mist, sun glow, leaves or petals) on top. No
 * content, sections or layout change. Colours are set as attributes on <html>
 * and handled in app/weather-mood.css.
 */
export function WeatherMood() {
  const pathname = usePathname() || '';
  const skip = SKIP.test(pathname);
  const [mood, setMood] = useState<Mood | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    if (skip || !mood || !canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const kind = fxFor(mood);
    if (!kind) return;
    return startWeatherFx(canvas, kind, mood.wind);
  }, [skip, mood]);

  if (skip || !mood) return null;
  return (
    <div className="wx-layer" aria-hidden="true">
      <div className="wx-wash" />
      {mood.sky === 'fog' ? <div className="wx-fog" /> : null}
      <canvas ref={canvasRef} className="wx-fx" />
    </div>
  );
}
