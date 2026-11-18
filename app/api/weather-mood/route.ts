import { NextResponse } from 'next/server';
import { feelFor, seasonFor, skyFromSymbol, type Sky, type WeatherMood } from '@/lib/weather-mood';

/**
 * The reader's local weather mood. Location comes from Vercel's IP lookup
 * (city level, never stored), rounded to 0.1° (about 10 km) so neighbours
 * share one cached forecast. Forecasts come from MET Norway's free
 * Locationforecast API (CC BY 4.0, credited in the footer) and are cached for
 * 15 minutes per rounded location. Falls back to Auckland when there is no
 * location, and to a calm "clear" mood if MET is unreachable.
 */
const AUCKLAND = { lat: -36.8, lon: 174.8 };
const UA = 'WebfitNews/1.0 https://webfitnews.com (weather-tinted site theme)';

function coord(value: string | null, max: number) {
  const n = Number(value);
  return value && Number.isFinite(n) && Math.abs(n) <= max ? Math.round(n * 10) / 10 : null;
}

/**
 * MET's one-word symbol for the hour can say "partly cloudy" while its own
 * numbers have rain falling (showery days in Auckland do this a lot). So the
 * rain amount and rain chance can upgrade the sky, and heavy cloud cover turns
 * a "fair" hour grey instead of sunny.
 */
function skyFrom(symbol: string, hour: Record<string, number>, now: Record<string, number>): Sky {
  let sky = skyFromSymbol(symbol);
  const mm = hour.precipitation_amount ?? 0;
  const chance = hour.probability_of_precipitation ?? 0;
  const wet = sky === 'drizzle' || sky === 'rain' || sky === 'storm' || sky === 'sleet' || sky === 'snow';
  if (!wet) {
    if (mm >= 1.5) sky = 'rain';
    else if (mm >= 0.1 || chance >= 45) sky = 'drizzle';
  }
  if (sky === 'drizzle' && mm >= 1) sky = 'rain';
  if (sky === 'clear' && (now.cloud_area_fraction ?? 0) >= 70) sky = 'cloud';
  return sky;
}

export async function GET(req: Request) {
  // ?lat=&lon= checks another place (for testing); otherwise the reader's IP location.
  const q = new URL(req.url).searchParams;
  const lat = coord(q.get('lat') ?? req.headers.get('x-vercel-ip-latitude'), 90);
  const lon = coord(q.get('lon') ?? req.headers.get('x-vercel-ip-longitude'), 180);
  const where = lat !== null && lon !== null ? { lat, lon } : AUCKLAND;
  const month = new Date().getUTCMonth();
  let source: Record<string, unknown> | null = null;
  let mood: WeatherMood = { sky: 'clear', season: seasonFor(where.lat, month), night: false, feel: 'mild', wind: 0 };

  try {
    const res = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${where.lat}&lon=${where.lon}`,
      { headers: { 'User-Agent': UA }, next: { revalidate: 900 }, signal: AbortSignal.timeout(4000) },
    );
    if (res.ok) {
      const data = await res.json();
      const now = Date.now();
      const steps: any[] = data?.properties?.timeseries ?? [];
      // The latest step that has started (the first is usually the current hour).
      const step = steps.filter(s => Date.parse(s.time) <= now).pop() ?? steps[0];
      const details = step?.data?.instant?.details ?? {};
      const hour = step?.data?.next_1_hours ?? step?.data?.next_6_hours ?? {};
      const symbol: string = hour?.summary?.symbol_code ?? 'clearsky_day';
      mood = {
        sky: skyFrom(symbol, hour?.details ?? {}, details),
        season: mood.season,
        night: symbol.endsWith('_night') || symbol.endsWith('_polartwilight'),
        feel: feelFor(details.air_temperature),
        wind: typeof details.wind_speed === 'number' ? Math.min(30, details.wind_speed) : 0,
      };
      source = { symbol, rain_mm: hour?.details?.precipitation_amount ?? null, rain_chance: hour?.details?.probability_of_precipitation ?? null, cloud: details.cloud_area_fraction ?? null };
    }
  } catch {
    // Keep the calm fallback.
  }

  // The extra fields let anyone open /api/weather-mood and see why the site looks the way it does.
  // City comes from the reader's own IP lookup and is returned only to them.
  const city = q.get('lat') ? null : req.headers.get('x-vercel-ip-city');
  return NextResponse.json({ ...mood, place: { city: city ? decodeURIComponent(city) : null, lat: where.lat, lon: where.lon, fallback: lat === null }, forecast: source }, {
    // Each reader's answer depends on their own IP location, so the CDN must not share it.
    headers: { 'Cache-Control': 'private, max-age=600' },
  });
}
