/**
 * Scores from CricTimes' public feed: the same data the old CricTimes widget showed
 * (from 1 Nov, including the NZ v India T20s). No key and no daily limit.
 *
 * The widget itself always opens on its RECENT tab, and readers can't change tabs in
 * our header, so a live Test sat hidden under LIVE. Reading the feed ourselves lets
 * the ribbon put the live match first.
 */
import type { CricketBoard, CricMatch, CricTeam } from './cricket';

const FEED = 'https://crictimes.org/data/v1/scores.json';

const NAMES: Record<string, string> = {
  NZ: 'New Zealand', IND: 'India', AUS: 'Australia', ENG: 'England', PAK: 'Pakistan',
  SA: 'South Africa', RSA: 'South Africa', SL: 'Sri Lanka', BAN: 'Bangladesh', WI: 'West Indies',
  AFG: 'Afghanistan', ZIM: 'Zimbabwe', IRE: 'Ireland', SCO: 'Scotland', NED: 'Netherlands',
  NEP: 'Nepal', UAE: 'United Arab Emirates', USA: 'United States', NAM: 'Namibia', OMA: 'Oman',
  NZW: 'New Zealand Women', INDW: 'India Women', AUSW: 'Australia Women', ENGW: 'England Women',
};

/** Team badges (the same images the CricketData scoreboard used). Others get a text badge. */
const BADGE = 'https://g.cricapi.com/iapi/';
const BADGES: Record<string, string> = {
  NZ: '57-637877076980737903', IND: '31-637877061080567215', AUS: '6-637877070670541994',
  ENG: '23-637877072894080569', PAK: '67-637877074931980375', SA: '82-637877071839088912',
  RSA: '82-637877071839088912', BAN: '9-637877074109248302', WI: '100-637877077978319234',
};

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));

/** "356/10(116.3)" -> "356/10 (116.3)"; empty or "0/0(0)" for a match not begun -> null. */
function scoreText(raw: string) {
  const t = s(raw).replace(/\s*\(/g, ' (');
  return !t || /^0\/0 \(0\)$/.test(t) ? null : t;
}

/** "26 Nov, 2026, Thu 10:00 PM GMT" -> ISO time. */
function when(dt: string) {
  const m = s(dt).match(/^(\d{1,2}) (\w{3}), (\d{4}), \w{3} (\d{1,2}):(\d{2}) (AM|PM)/i);
  if (!m) return null;
  let h = Number(m[4]) % 12;
  if (/pm/i.test(m[6])) h += 12;
  const d = new Date(`${m[1]} ${m[2]} ${m[3]} ${String(h).padStart(2, '0')}:${m[5]}:00 GMT`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function team(code: string, score: string): CricTeam {
  const short = s(code).toUpperCase();
  return { name: NAMES[short] || s(code), short, img: BADGES[short] ? `${BADGE}${BADGES[short]}.webp?w=48` : null, score: scoreText(score) };
}

function toMatch(row: any, state: CricMatch['state']): CricMatch | null {
  if (!row?.id || !row?.t_one || !row?.t_two) return null;
  const spec = s(row.spec), series = s(row.series);
  const teams: [CricTeam, CricTeam] = [team(row.t_one, row.t_one_s), team(row.t_two, row.t_two_s)];
  return {
    id: `ct-${row.id}`, name: `${teams[0].name} v ${teams[1].name}`,
    series: [spec, series].filter(Boolean).join(', ') || null,
    matchType: /test/i.test(spec) ? 'test' : /odi/i.test(spec) ? 'odi' : /t20/i.test(spec) ? 't20' : '',
    state, status: state === 'fixture' ? '' : s(row.m_status), startsAt: when(row.dt), teams,
  };
}

/** New Zealand first, then India, then other Test nations. */
function interest(m: CricMatch) {
  const names = m.teams.map(t => t.name.toLowerCase()).join(' ');
  let n = 0;
  if (/new zealand/.test(names)) n += 100;
  if (/\bindia\b/.test(names)) n += 60;
  if (/australia|england|pakistan|south africa|sri lanka|west indies|bangladesh/.test(names)) n += 20;
  if (/women/.test(names)) n -= 2;
  return n;
}

export async function getCricTimesBoard(): Promise<CricketBoard | null> {
  try {
    const res = await fetch(FEED, { next: { revalidate: 60, tags: ['cricket'] }, signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'Mozilla/5.0 (WebfitNews score ribbon)' } });
    if (!res.ok) return null;
    const json = await res.json();
    const list = (key: string) => (Array.isArray(json?.[key]) ? json[key] : []);
    const live = list('live').map((r: any) => toMatch(r, 'live')).filter(Boolean) as CricMatch[];
    const liveIds = new Set(live.map(m => m.id));
    const results = list('completed').map((r: any) => toMatch(r, 'result')).filter(Boolean) as CricMatch[];
    const upcoming = (list('upcoming').map((r: any) => toMatch(r, 'fixture')).filter(Boolean) as CricMatch[])
      .filter(m => !liveIds.has(m.id));
    if (!live.length && !results.length && !upcoming.length) return null;
    const byInterest = (a: CricMatch, b: CricMatch) => interest(b) - interest(a);
    live.sort(byInterest);
    const featured = live[0] ?? results[0] ?? upcoming[0] ?? null;
    return { updatedAt: new Date().toISOString(), featured, scorecard: null, live, results, upcoming };
  } catch (e) {
    console.error('crictimes feed', e);
    return null;
  }
}
