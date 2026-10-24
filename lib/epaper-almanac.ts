import * as Astro from 'astronomy-engine';
import { createPublicClient } from '@/lib/supabase-public';

/*
 * The e-paper's "Stars & Week Ahead" page, built automatically for the week
 * readers have the edition in their hands: release Thursday to the Wednesday after.
 *
 *   - Weekly rashifal for all 12 rashis (Vedic, sidereal, Lahiri ayanamsa), worked out
 *     from where the Sun, Moon and planets actually are that week (astronomy-engine),
 *     at noon New Zealand time. Each reading is built from the houses the planets
 *     occupy counted from that rashi, plus the days the Moon favours it (chandrabala)
 *     and the Moon's 8th-house days to take care (chandrashtama).
 *   - What's on: local NZ community events from the epaper_events table (add a row in Supabase:
 *     start_date, end_date, title, place, time_text, note), New Zealand public holidays (worked out
 *     by rule) and the main community festivals (FESTIVALS: India dates, checked against Drik Panchang listings).
 *   - This week in history: Wikipedia's "On this day" feed, preferring New Zealand
 *     and India, cached for a week. If Wikipedia can't be reached the section is left out.
 */

/** born: the birthdays whose Sun sits in this sign (Vedic dates, e.g. "13 Feb – 13 Mar"), so readers can find their sign. */
export type RashiReading = { key: string; name: string; english: string; symbol: string; born: string; text: string; goodDays: string; careDays: string };
/** local: an NZ community event from epaper_events (shown first, with place and time). */
export type AlmanacEvent = { date: string; label: string; title: string; note?: string; local?: boolean };
export type HistoryItem = { date: string; label: string; year: number; text: string };
export type Almanac = { from: string; to: string; range: string; moon: string[]; rashis: RashiReading[]; events: AlmanacEvent[]; history: HistoryItem[]; births: HistoryItem[] };

const RASHIS = [
  ['mesha', 'Mesha', 'Aries', '♈'], ['vrishabha', 'Vrishabha', 'Taurus', '♉'], ['mithuna', 'Mithuna', 'Gemini', '♊'],
  ['karka', 'Karka', 'Cancer', '♋'], ['simha', 'Simha', 'Leo', '♌'], ['kanya', 'Kanya', 'Virgo', '♍'],
  ['tula', 'Tula', 'Libra', '♎'], ['vrischika', 'Vrischika', 'Scorpio', '♏'], ['dhanu', 'Dhanu', 'Sagittarius', '♐'],
  ['makara', 'Makara', 'Capricorn', '♑'], ['kumbha', 'Kumbha', 'Aquarius', '♒'], ['meena', 'Meena', 'Pisces', '♓'],
] as const;

/* --------------------------------------------------------------- dates (New Zealand) */

const addDays = (ymd: string, n: number) => new Date(Date.parse(`${ymd}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const weekday = (ymd: string) => new Date(`${ymd}T12:00:00Z`).getUTCDay();
const fmt = (ymd: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-NZ', { ...o, timeZone: 'UTC' }).format(new Date(`${ymd}T12:00:00Z`));
const dayLabel = (ymd: string) => fmt(ymd, { weekday: 'short', day: 'numeric', month: 'short' });
const shortDay = (ymd: string) => fmt(ymd, { weekday: 'short' });

/** The instant it is hh:00 on a NZ date (NZST/NZDT worked out by Intl). */
function nzTime(ymd: string, hh: number): Date {
  const guess = new Date(Date.parse(`${ymd}T${String(hh).padStart(2, '0')}:00:00Z`) - 12 * 3_600_000);
  const nzHour = Number(new Intl.DateTimeFormat('en-NZ', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Pacific/Auckland' }).format(guess));
  return new Date(guess.getTime() + (hh - nzHour) * 3_600_000);
}
const nzClock = (d: Date) => new Intl.DateTimeFormat('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Pacific/Auckland' }).format(d).replace(/\s?([ap])\.?m\.?/i, '$1m');

/* --------------------------------------------------------------- planets (sidereal) */

const J2000 = Date.UTC(2000, 0, 1, 12);
const ayanamsa = (d: Date) => 23.853 + 0.01397 * ((d.getTime() - J2000) / (365.25 * 86_400_000));
const norm = (x: number) => ((x % 360) + 360) % 360;
type Planet = 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Rahu';
function tropical(p: Planet, d: Date): number {
  if (p === 'Sun') return Astro.SunPosition(d).elon;
  if (p === 'Moon') return Astro.EclipticGeoMoon(d).lon;
  if (p === 'Rahu') { const T = (d.getTime() - J2000) / (36525 * 86_400_000); return 125.04452 - 1934.136261 * T; } // mean lunar node
  return Astro.Ecliptic(Astro.GeoVector(Astro.Body[p], d, true)).elon;
}
const signOf = (p: Planet, d: Date) => Math.floor(norm(tropical(p, d) - ayanamsa(d)) / 30);

/* --------------------------------------------------------------- readings */

// What each planet brings to each house (1–12), counted from the reader's rashi. Short, plain lines.
const SUN = [
  'The spotlight is on you: a good week to put yourself forward, but watch your temper and your health.',
  'Money and family matters need attention. Check your spending and speak gently at home.',
  'Courage is high. Short trips, calls and bold first steps go well.',
  'Home asks for more of your time. Small worries settle if you slow down.',
  'Children, study and creative plans take centre stage. Avoid risky bets.',
  'A winning week against problems: work piles up, but you get through it and others notice.',
  'Partnerships need patience. Listen before you decide, at work and at home.',
  'Keep things low-key. Look after your health and double-check paperwork.',
  'Elders, teachers and long-distance links bring guidance. Respect pays off.',
  'Work and status rise. A good week to ask, apply or lead.',
  'Gains and good news through friends and networks. Goals move forward.',
  'Expenses and tiredness. Rest, give, and plan quietly for what comes next.',
];
const JUPITER = [
  'Jupiter gives you a steady, hopeful base.', 'Jupiter supports savings and family harmony.', 'Effort is needed; luck comes through your own work.',
  'Comfort at home improves slowly.', 'Jupiter blesses learning, children and good advice.', 'Avoid lending money; keep promises small.',
  'Jupiter favours marriage, deals and agreements.', 'Be careful with commitments and debts.', 'Fortune and faith are on your side.',
  'Changes at work ask for patience.', 'Jupiter brings gains and helpful contacts.', 'Spending on travel or good causes is likely.',
];
const SATURN = [
  'Saturn asks for discipline; pace yourself.', 'Saturn tests your budget; plan before you buy.', 'Saturn rewards steady hard work.',
  'Saturn weighs on home matters; stay calm.', 'Saturn slows creative plans; keep at them.', 'Saturn helps you beat obstacles and rivals.',
  'Saturn asks for patience with a partner.', 'Saturn says go slow on health and risks.', 'Saturn tests faith; keep your word.',
  'Saturn brings hard but useful work.', 'Saturn brings slow but solid gains.', 'Saturn asks you to cut waste and rest.',
];
const VENUS = [
  'Charm is high; relationships feel easy.', 'A good week for money and family meals.', 'Creative hobbies and short outings bring joy.',
  'Home comforts and family time feel good.', 'Romance and fun are favoured.', 'Avoid overindulgence; keep relationships simple.',
  'Love and partnerships are warm.', 'Keep money and secrets private.', 'A pleasant trip or kind gesture lifts you.',
  'Good taste helps at work.', 'Friends bring happy news and gifts.', 'Pleasure and spending may run ahead of the budget.',
];
const MARS = [
  'Energy is high; act, but avoid rushing.', 'Watch harsh words over money.', 'Bold moves and sport go well.',
  'Avoid arguments at home.', 'Keep a cool head with children.', 'You beat competition and clear old problems.',
  'Avoid quarrels with your partner.', 'Drive and cook carefully.', 'Stand up for your beliefs, politely.',
  'Drive at work brings results.', 'Effort turns into gains.', 'Avoid hidden costs and late nights.',
];
// Moon from the rashi: 1, 3, 6, 7, 10, 11 are good days (chandrabala); 8 is a day to take care (chandrashtama).
const GOOD_MOON = new Set([1, 3, 6, 7, 10, 11]);
const house = (planetSign: number, rashi: number) => ((planetSign - rashi + 12) % 12) + 1;

/**
 * Which birthdays fall in each sign (Vedic, sidereal Sun sign), worked out from the Sun's real
 * entry into each sign that year. About three weeks later than Western star-sign dates.
 */
function bornRanges(year: number): string[] {
  const out: string[] = Array(12).fill('');
  const label = (d: string) => fmt(d, { day: 'numeric', month: 'short' });
  let start = `${year - 1}-12-01`;
  let cur = signOf('Sun', nzTime(start, 12));
  const starts: Array<[number, string]> = [];
  for (let d = addDays(start, 1); d <= `${year + 1}-01-31`; d = addDays(d, 1)) {
    const s = signOf('Sun', nzTime(d, 12));
    if (s !== cur) { starts.push([s, d]); cur = s; }
  }
  starts.forEach(([s, d], i) => {
    const next = starts[i + 1];
    // Later entries win, so every range comes from the same run of dates and none overlap.
    if (next) out[s] = `${label(d)} – ${label(addDays(next[1], -1))}`;
  });
  return out;
}

function readings(from: string): { rashis: RashiReading[]; moon: string[] } {
  const mid = nzTime(addDays(from, 3), 12);
  const at = Object.fromEntries((['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu'] as Planet[]).map(p => [p, signOf(p, mid)])) as Record<Planet, number>;
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  const moonByDay = days.map(d => signOf('Moon', nzTime(d, 12)));

  const born = bornRanges(Number(from.slice(0, 4)));
  const rashis = RASHIS.map(([key, name, english, symbol], r) => {
    const h = (p: Planet) => house(at[p], r);
    const jup = h('Jupiter'), sat = h('Saturn');
    // The stronger of Jupiter's help or Saturn's pressure this week gets the second line.
    const second = [2, 5, 7, 9, 11].includes(jup) ? JUPITER[jup - 1] : [12, 1, 2, 8, 4].includes(sat) ? SATURN[sat - 1] : JUPITER[jup - 1];
    const third = [3, 6, 11].includes(h('Mars')) ? MARS[h('Mars') - 1] : VENUS[h('Venus') - 1];
    const good = days.filter((_, i) => GOOD_MOON.has(house(moonByDay[i], r))).map(shortDay);
    const care = days.filter((_, i) => house(moonByDay[i], r) === 8).map(shortDay);
    return { key, name, english, symbol, born: born[r], text: `${SUN[h('Sun') - 1]} ${second} ${third}`, goodDays: good.join(', ') || 'none this week', careDays: care.join(', ') };
  });

  // When the Moon changes rashi during the week (checked every hour).
  const moon: string[] = [];
  let t = nzTime(from, 0).getTime();
  const end = nzTime(addDays(from, 7), 0).getTime();
  let prev = signOf('Moon', new Date(t));
  moon.push(`Moon in ${RASHIS[prev][1]} as the week opens`);
  for (t += 3_600_000; t <= end; t += 3_600_000) {
    const s = signOf('Moon', new Date(t));
    if (s !== prev) { moon.push(`enters ${RASHIS[s][1]} ${nzClock(new Date(t))}`); prev = s; }
  }
  return { rashis, moon };
}

/* --------------------------------------------------------------- what's on */

// Main community festivals, India dates (Drik Panchang-based listings, checked Oct 2026). Add new years here.
const FESTIVALS: Array<[string, string]> = [
  ['2026-11-06', 'Dhanteras'], ['2026-11-07', 'Choti Diwali (Naraka Chaturdashi)'], ['2026-11-08', 'Diwali (Lakshmi Puja)'],
  ['2026-11-10', 'Govardhan Puja'], ['2026-11-11', 'Bhai Dooj'], ['2026-11-15', 'Chhath Puja'], ['2026-11-24', 'Guru Nanak Jayanti (Gurpurab) and Kartik Purnima'],
  ['2027-01-13', 'Lohri'], ['2027-01-15', 'Makar Sankranti and Pongal'], ['2027-02-11', 'Vasant Panchami'], ['2027-03-06', 'Maha Shivaratri'],
  ['2027-03-21', 'Holika Dahan'], ['2027-03-22', 'Holi'], ['2027-04-07', 'Chaitra Navratri begins'], ['2027-04-14', 'Vaisakhi'],
  ['2027-04-15', 'Ram Navami'], ['2027-04-20', 'Hanuman Jayanti'], ['2027-08-17', 'Raksha Bandhan'], ['2027-08-25', 'Krishna Janmashtami'],
  ['2027-09-30', 'Sharad Navratri begins'], ['2027-10-09', 'Dussehra (Vijaya Dashami)'], ['2027-10-18', 'Karwa Chauth'], ['2027-10-29', 'Diwali'], ['2027-10-31', 'Bhai Dooj'],
];
const FIXED: Array<[string, string]> = [ // MM-DD
  ['01-26', 'India’s Republic Day'], ['02-14', 'Valentine’s Day'], ['08-15', 'India’s Independence Day'], ['10-02', 'Gandhi Jayanti'],
  ['10-31', 'Halloween'], ['11-05', 'Guy Fawkes Night (fireworks)'], ['12-24', 'Christmas Eve'], ['12-31', 'New Year’s Eve'],
];
const MATARIKI: Record<number, string> = { 2026: '2026-07-10', 2027: '2027-06-25', 2028: '2028-07-14', 2029: '2029-07-06', 2030: '2030-06-21' };

function easter(y: number): string { // Anonymous Gregorian algorithm
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
const nthMonday = (y: number, m: number, n: number) => { const first = `${y}-${String(m).padStart(2, '0')}-01`; const off = (8 - weekday(first)) % 7; return addDays(first, off + 7 * (n - 1)); };
/** Waitangi and ANZAC Day move to Monday when they fall on a weekend. */
const mondayised = (ymd: string) => (weekday(ymd) === 6 ? addDays(ymd, 2) : weekday(ymd) === 0 ? addDays(ymd, 1) : ymd);

function nzHolidays(y: number): Array<[string, string]> {
  const e = easter(y);
  const out: Array<[string, string]> = [
    [`${y}-01-01`, 'New Year’s Day (public holiday)'], [`${y}-01-02`, 'Day after New Year’s Day (public holiday)'],
    [mondayised(`${y}-02-06`), 'Waitangi Day (public holiday)'], [addDays(e, -2), 'Good Friday (public holiday)'], [addDays(e, 1), 'Easter Monday (public holiday)'],
    [mondayised(`${y}-04-25`), 'ANZAC Day (public holiday)'], [nthMonday(y, 6, 1), 'King’s Birthday (public holiday)'], [nthMonday(y, 10, 4), 'Labour Day (public holiday)'],
    [`${y}-12-25`, 'Christmas Day (public holiday)'], [`${y}-12-26`, 'Boxing Day (public holiday)'],
  ];
  if (MATARIKI[y]) out.push([MATARIKI[y], 'Matariki (public holiday)']);
  // Auckland Anniversary: the Monday closest to 29 January.
  const j29 = `${y}-01-29`; const back = (weekday(j29) + 6) % 7;
  out.push([back <= 3 ? addDays(j29, -back) : addDays(j29, 7 - back), 'Auckland Anniversary Day (Auckland public holiday)']);
  return out;
}

function events(from: string, to: string): AlmanacEvent[] {
  const years = [Number(from.slice(0, 4)), Number(to.slice(0, 4))];
  const all: Array<[string, string, string?]> = [
    ...years.flatMap(nzHolidays).map(([d, t]) => [d, t] as [string, string]),
    ...FESTIVALS.map(([d, t]) => [d, t, 'India date; NZ celebrations may differ'] as [string, string, string]),
    ...years.flatMap(y => FIXED.map(([md, t]) => [`${y}-${md}`, t] as [string, string])),
  ];
  const seen = new Set<string>();
  return all.filter(([d]) => d >= from && d <= to).sort((a, b) => a[0].localeCompare(b[0])).filter(([d, t]) => !seen.has(d + t) && seen.add(d + t))
    .map(([date, title, note]) => ({ date, label: dayLabel(date), title, note }));
}

/** Local NZ community events (epaper_events) that overlap the week. */
async function localEvents(from: string, to: string): Promise<AlmanacEvent[]> {
  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase.from('epaper_events').select('start_date,end_date,title,place,time_text,note')
      .eq('is_published', true).lte('start_date', to).gte('end_date', from).order('start_date').limit(8);
    if (error) return [];
    return (data || []).map((e: any) => ({
      date: e.start_date,
      label: e.end_date && e.end_date !== e.start_date ? `${dayLabel(e.start_date)} – ${dayLabel(e.end_date)}` : dayLabel(e.start_date),
      title: e.title,
      note: [e.place, e.time_text, e.note].filter(Boolean).join(' · ') || undefined,
      local: true,
    }));
  } catch { return []; }
}

/** Festivals coming up in the fortnight after this week, so the page always has something to look forward to. */
function comingSoon(to: string): AlmanacEvent[] {
  return events(addDays(to, 1), addDays(to, 21)).slice(0, 4);
}

/* --------------------------------------------------------------- this week in history (Wikipedia) */

const LOCAL = /New Zealand|Aotearoa|Auckland|Wellington|Christchurch|Māori|Maori|All Blacks|Waitangi/i;
const INDIA = /India|Indian|Mumbai|Delhi|Bombay|Calcutta|Kolkata|Gandhi|Punjab|Bengal|Pakistan|Sri Lanka|Nepal|Fiji|Bollywood/i;
type WikiItem = { text: string; year: number };
async function wiki(kind: 'selected' | 'births', mm: string, dd: string): Promise<WikiItem[]> {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/${kind}/${mm}/${dd}`, {
      headers: { 'User-Agent': 'WebfitNews-epaper/1.0 (https://webfitnews.com)', accept: 'application/json' },
      next: { revalidate: 7 * 86_400 }, signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return ((json?.[kind] || []) as any[]).filter(x => typeof x?.text === 'string' && typeof x?.year === 'number').map(x => ({ text: x.text as string, year: x.year as number }));
  } catch { return []; }
}
const pick = (items: WikiItem[]) => items.find(i => LOCAL.test(i.text)) || items.find(i => INDIA.test(i.text)) || items[0] || null;
const clip = (t: string, n = 150) => (t.length <= n ? t : `${t.slice(0, t.lastIndexOf(' ', n))}…`);

async function history(from: string): Promise<{ history: HistoryItem[]; births: HistoryItem[] }> {
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  const got = await Promise.all(days.map(async d => {
    const [mm, dd] = [d.slice(5, 7), d.slice(8, 10)];
    const [ev, br] = await Promise.all([wiki('selected', mm, dd), wiki('births', mm, dd)]);
    return { d, ev: pick(ev), br: br.find(i => LOCAL.test(i.text)) || br.find(i => INDIA.test(i.text)) || null };
  }));
  const label = (d: string) => fmt(d, { day: 'numeric', month: 'short' });
  return {
    history: got.filter(g => g.ev).map(g => ({ date: g.d, label: label(g.d), year: g.ev!.year, text: clip(g.ev!.text) })),
    births: got.filter(g => g.br).slice(0, 4).map(g => ({ date: g.d, label: label(g.d), year: g.br!.year, text: clip(g.br!.text, 90) })),
  };
}

/* --------------------------------------------------------------- the page */

/** Everything for the week starting `from` (a NZ date, the edition's release day). */
export async function buildAlmanac(from: string): Promise<Almanac> {
  const to = addDays(from, 6);
  const { rashis, moon } = readings(from);
  const [local, { history: past, births }] = await Promise.all([localEvents(from, to), history(from)]);
  // Local NZ events first (they're what readers can go to), then holidays and festivals by date.
  const thisWeek = [...local, ...events(from, to)];
  return {
    from, to,
    range: `${fmt(from, { weekday: 'long', day: 'numeric', month: 'long' })} to ${fmt(to, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
    moon, rashis,
    events: thisWeek.length >= 3 ? thisWeek : [...thisWeek, ...comingSoon(to).map(e => ({ ...e, note: e.note ? `Coming up · ${e.note}` : 'Coming up' }))],
    history: past, births,
  };
}
