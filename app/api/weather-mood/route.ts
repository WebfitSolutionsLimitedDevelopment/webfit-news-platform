import { NextResponse } from 'next/server';
import { feelFor, seasonFor, skyFromSymbol, type WeatherMood } from '@/lib/weather-mood';

/**
 * The reader's local weather mood. Location comes from Vercel's IP lookup
 * (city level, never stored), rounded to 0.1° (about 10 km) so neighbours
 * share one cached forecast. Forecasts come from MET Norway's free
 * Locationforecast API (CC BY 4.0, credited in the footer) and are cached for
 * 30 minutes per rounded location. Falls back to Auckland when there is no
 * location, and to a calm "clear" mood if MET is unreachable.
 */
const AUCKLAND = { lat: -36.8, lon: 174.8 };
const UA = 'WebfitNews/1.0 https://webfitnews.com (weather-tinted site theme)';

function coord(value: string | null, max: number) {
  const n = Number(value);
  return value && Number.isFinite(n) && Math.abs(n) <= max ? Math.round(n * 10) / 10 : null;
}

export async function GET(req: Request) {
  const lat = coord(req.headers.get('x-vercel-ip-latitude'), 90);
  const lon = coord(req.headers.get('x-vercel-ip-longitude'), 180);
  const where = lat !== null && lon !== null ? { lat, lon } : AUCKLAND;
  const month = new Date().getUTCMonth();
  let mood: WeatherMood = { sky: 'clear', season: seasonFor(where.lat, month), night: false, feel: 'mild', wind: 0 };

  try {
    const res = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${where.lat}&lon=${where.lon}`,
      { headers: { 'User-Agent': UA }, next: { revalidate: 1800 }, signal: AbortSignal.timeout(4000) },
    );
    if (res.ok) {
      const data = await res.json();
      const now = Date.now();
      const steps: any[] = data?.properties?.timeseries ?? [];
      // The latest step that has started (the first is usually the current hour).
      const step = steps.filter(s => Date.parse(s.time) <= now).pop() ?? steps[0];
      const details = step?.data?.instant?.details ?? {};
      const symbol: string = step?.data?.next_1_hours?.summary?.symbol_code ?? step?.data?.next_6_hours?.summary?.symbol_code ?? 'clearsky_day';
      mood = {
        sky: skyFromSymbol(symbol),
        season: mood.season,
        night: symbol.endsWith('_night') || symbol.endsWith('_polartwilight'),
        feel: feelFor(details.air_temperature),
        wind: typeof details.wind_speed === 'number' ? Math.min(30, details.wind_speed) : 0,
      };
    }
  } catch {
    // Keep the calm fallback.
  }

  return NextResponse.json(mood, {
    // Each reader's answer depends on their own IP location, so the CDN must not share it.
    headers: { 'Cache-Control': 'private, max-age=900' },
  });
}
