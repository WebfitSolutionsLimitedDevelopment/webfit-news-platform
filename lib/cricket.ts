/**
 * Live cricket from CricketData.org (CricAPI), for the header strip and /live-cricket.
 *
 * Needs CRICKETDATA_API_KEY in Vercel. Without it, or if the provider fails or
 * answers in a shape we don't recognise, getCricketBoard() returns null and the
 * page falls back to the old embedded widget, so nothing breaks.
 *
 * Every reader is served from our cache, never straight from the provider, so
 * the daily allowance depends only on these two timers (seconds):
 *   CRICKETDATA_LIST_SECONDS       match list        (default 900 = 96 calls a day)
 *   CRICKETDATA_SCORECARD_SECONDS  featured scorecard (default 1800 = 48 a day)
 * The defaults fit the free plan (100 calls a day) with a little room. On a paid
 * plan, set both to 120 for scores about two minutes behind.
 */

const BASE = 'https://api.cricapi.com/v1';

export type CricTeam = { name: string; short: string; img: string | null; score: string | null };
export type CricMatch = {
  id: string; name: string; series: string | null; matchType: string; state: 'live' | 'result' | 'fixture';
  status: string; startsAt: string | null; teams: [CricTeam, CricTeam];
};
export type CricBatter = { name: string; dismissal: string; notOut: boolean; r: number; b: number; fours: number; sixes: number; sr: string };
export type CricBowler = { name: string; o: string; m: number; r: number; w: number; econ: string };
export type CricInnings = { title: string; total: string | null; batting: CricBatter[]; bowling: CricBowler[] };
export type CricScorecard = { venue: string | null; tossNote: string | null; innings: CricInnings[] };
export type CricketBoard = { updatedAt: string; featured: CricMatch | null; scorecard: CricScorecard | null; live: CricMatch[]; results: CricMatch[]; upcoming: CricMatch[] };

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));
const secs = (name: string, fallback: number) => Math.max(60, Number(process.env[name]) || fallback);

async function call(path: string, params: Record<string, string>, revalidate: number) {
  const key = process.env.CRICKETDATA_API_KEY?.trim();
  if (!key) return null;
  const qs = new URLSearchParams({ apikey: key, ...params });
  try {
    const res = await fetch(`${BASE}/${path}?${qs}`, { next: { revalidate, tags: ['cricket'] }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.status !== 'success') { console.error('cricketdata', path, json?.reason || json?.status); return null; }
    return json.data ?? null;
  } catch (e) {
    console.error('cricketdata', path, e);
    return null;
  }
}

/** Short code for a team, e.g. "New Zealand [NZ]" -> NZ. */
function shortName(raw: string) {
  const tag = raw.match(/\[([^\]]+)\]/)?.[1];
  if (tag) return tag.toUpperCase();
  const words = raw.replace(/\[.*?\]/g, '').trim().split(/\s+/);
  return (words.length > 1 ? words.map(w => w[0]).join('') : raw.slice(0, 3)).toUpperCase().slice(0, 4);
}
const titleCase = (t: string) => t.replace(/\b([a-z])/g, c => c.toUpperCase());
const cleanTeam = (raw: string) => raw.replace(/\s*\[[^\]]*\]\s*/g, '').trim();

/** One row of the cricScore list. */
function fromList(row: any): CricMatch | null {
  if (!row?.id || !row?.t1 || !row?.t2) return null;
  const ms = str(row.ms).toLowerCase();
  const state: CricMatch['state'] = ms === 'live' ? 'live' : ms === 'result' ? 'result' : 'fixture';
  const team = (raw: string, score: unknown, img: unknown): CricTeam => ({
    name: cleanTeam(raw), short: shortName(raw), img: str(img) || null, score: str(score) || null,
  });
  return {
    id: str(row.id), name: `${cleanTeam(row.t1)} v ${cleanTeam(row.t2)}`, series: str(row.series) || null,
    matchType: str(row.matchType).toLowerCase(), state, status: str(row.status), startsAt: str(row.dateTimeGMT) ? `${str(row.dateTimeGMT).replace(/Z?$/, 'Z')}` : null,
    teams: [team(row.t1, row.t1s, row.t1img), team(row.t2, row.t2s, row.t2img)],
  };
}

/** Internationals first, then teams New Zealand readers follow most. */
function interest(m: CricMatch) {
  const names = m.teams.map(t => t.name.toLowerCase()).join(' ');
  let score = 0;
  if (/new zealand|white ferns/.test(names)) score += 100;
  if (/\bindia\b/.test(names)) score += 60;
  if (/australia|england|pakistan|south africa|sri lanka|fiji/.test(names)) score += 20;
  if (/test|odi|t20/.test(m.matchType) && !/\b(a|u19|xi)\b/i.test(names)) score += 15;
  if (/women/.test(names) || /women/i.test(m.series || '')) score -= 2;
  return score;
}

function fromScorecard(data: any): CricScorecard | null {
  if (!data || !Array.isArray(data.scorecard)) return null;
  const totals: any[] = Array.isArray(data.score) ? data.score : [];
  const innings: CricInnings[] = data.scorecard.map((inn: any, i: number) => {
    const t = totals[i];
    return {
      title: str(inn.inning) || `Innings ${i + 1}`,
      total: t ? `${num(t.r)}/${num(t.w)} (${str(t.o)} ov)` : null,
      batting: (Array.isArray(inn.batting) ? inn.batting : []).map((b: any) => {
        const dismissal = str(b['dismissal-text'] ?? b.dismissal);
        return {
          name: str(b.batsman?.name ?? b.batsman), dismissal,
          notOut: !dismissal || /not out|batting/i.test(dismissal),
          r: num(b.r), b: num(b.b), fours: num(b['4s']), sixes: num(b['6s']), sr: str(b.sr) || '-',
        };
      }).filter((b: CricBatter) => b.name),
      bowling: (Array.isArray(inn.bowling) ? inn.bowling : []).map((w: any) => ({
        name: str(w.bowler?.name ?? w.bowler), o: str(w.o), m: num(w.m), r: num(w.r), w: num(w.w), econ: str(w.eco ?? w.econ) || '-',
      })).filter((w: CricBowler) => w.name),
    };
  });
  return { venue: str(data.venue) || null, tossNote: data.tossWinner ? `${titleCase(cleanTeam(str(data.tossWinner)))} won the toss and chose to ${str(data.tossChoice) || 'play'}` : null, innings };
}

export async function getCricketBoard(): Promise<CricketBoard | null> {
  const list = await call('cricScore', {}, secs('CRICKETDATA_LIST_SECONDS', 900));
  if (!Array.isArray(list)) return null;
  const matches = list.map(fromList).filter((m): m is CricMatch => !!m);
  if (!matches.length) return null;

  const byInterest = (a: CricMatch, b: CricMatch) => interest(b) - interest(a);
  const live = matches.filter(m => m.state === 'live').sort(byInterest);
  const results = matches.filter(m => m.state === 'result').sort(byInterest).slice(0, 12);
  const upcoming = matches.filter(m => m.state === 'fixture')
    .sort((a, b) => interest(b) - interest(a) || Date.parse(a.startsAt || '') - Date.parse(b.startsAt || '')).slice(0, 12);

  // The headline match: a live game readers care about, else the most relevant recent result.
  const featured = live.find(m => interest(m) >= 60) ?? live[0] ?? results.find(m => interest(m) >= 60) ?? results[0] ?? upcoming[0] ?? null;
  let scorecard: CricScorecard | null = null;
  if (featured && featured.state !== 'fixture') {
    // Results don't change, so their scorecard can be kept a day.
    const ttl = featured.state === 'live' ? secs('CRICKETDATA_SCORECARD_SECONDS', 1800) : 86400;
    scorecard = fromScorecard(await call('match_scorecard', { id: featured.id }, ttl));
  }
  return { updatedAt: new Date().toISOString(), featured, scorecard, live, results, upcoming };
}
