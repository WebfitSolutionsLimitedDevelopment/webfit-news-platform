/**
 * Turns a MET Norway forecast reading into the site's "weather mood": the
 * sky (what is falling or hanging in the air), the season for the reader's
 * hemisphere, day or night, and whether it feels hot or cold. The mood only
 * changes colours and a light background effect, never content or layout.
 */
export type Sky = 'clear' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'storm' | 'sleet' | 'snow';
export type Season = 'summer' | 'autumn' | 'winter' | 'spring';
export type Feel = 'hot' | 'mild' | 'cold';
export type WeatherMood = { sky: Sky; season: Season; night: boolean; feel: Feel; wind: number };

export const SKIES: Sky[] = ['clear', 'cloud', 'fog', 'drizzle', 'rain', 'storm', 'sleet', 'snow'];
export const SEASONS: Season[] = ['summer', 'autumn', 'winter', 'spring'];

/** MET symbol codes look like "lightrainshowers_day" or "heavyrainandthunder". */
export function skyFromSymbol(symbol: string): Sky {
  const s = symbol.replace(/_(day|night|polartwilight)$/, '');
  if (s.includes('thunder')) return 'storm';
  if (s.includes('snow')) return 'snow';
  if (s.includes('sleet')) return 'sleet';
  if (s.includes('heavyrain')) return 'storm';
  if (s.includes('lightrain')) return 'drizzle';
  if (s.includes('rain')) return 'rain';
  if (s === 'fog') return 'fog';
  if (s === 'cloudy') return 'cloud';
  return 'clear'; // clearsky, fair, partlycloudy
}

/** Meteorological seasons, flipped for the southern hemisphere. */
export function seasonFor(latitude: number, month: number): Season {
  const north: Season[] = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
  const flip: Record<Season, Season> = { winter: 'summer', summer: 'winter', spring: 'autumn', autumn: 'spring' };
  const season = north[month];
  return latitude < 0 ? flip[season] : season;
}

export function feelFor(temperature: number | null | undefined): Feel {
  if (typeof temperature !== 'number') return 'mild';
  if (temperature >= 24) return 'hot';
  if (temperature <= 7) return 'cold';
  return 'mild';
}
