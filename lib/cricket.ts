/**
 * Live cricket from CricketData.org (CricAPI), for the header strip and /live-cricket.
 *
 * Needs CRICKETDATA_API_KEY in Vercel. Without it, or if the provider fails or
 * answers in a shape we don't recognise, getCricketBoard() returns null and the
 * page falls back to the old embedded widget, so nothing breaks.
 *
 * Readers are served from our own store (Supabase table cricket_feed), never straight
 * from the provider. One call per interval goes out, whatever the traffic or region,
 * so the daily allowance depends only on these two timers (seconds):
 *   CRICKETDATA_LIST_SECONDS       match list        (default 1200 = 72 calls a day)
 *   CRICKETDATA_SCORECARD_SECONDS  live scorecard    (default 5400 = 16 a day)
 * The defaults fit the free plan (100 calls a day). On a paid plan, set both to 120
 * for scores about two minutes behind. If the provider fails, the last good scores stay.
 */

import { unstable_cache } from 'next/cache';
import { createAdminClient } from './supabase-admin';

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

type Stored = { data: any; okAt: string | null };

/** Straight to the provider, no caching: only called by refresh() below. */
async function fetchProvider(path: string, params: Record<string, string>) {
  const key = process.env.CRICKETDATA_API_KEY?.trim();
  if (!key || key === 'paused') return { data: null, error: 'off' };
  const qs = new URLSearchParams({ apikey: key, ...params });
  try {
    const res = await fetch(`${BASE}/${path}?${qs}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` };
    const json = await res.json();
    if (json?.status !== 'success') return { data: null, error: String(json?.reason || json?.status || 'failed') };
    return { data: json.data ?? null, error: null };
  } catch (e: any) {
    return { data: null, error: String(e?.message || e) };
  }
}

/**
 * The provider's answer for one request, from our own store (Supabase table cricket_feed).
 * At most one call to the provider per `every` seconds, across all regions and visitors,
 * so the free plan's daily limit can't run out. If the provider fails, the last good
 * answer stays. Without the database (e.g. preview builds) this returns nothing and the
 * old widget shows, so test copies never spend the live site's calls.
 */
async function call(path: string, params: Record<string, string>, every: number): Promise<Stored | null> {
  const key = process.env.CRICKETDATA_API_KEY?.trim();
  if (!key || key === 'paused' || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const id = [path, ...Object.values(params)].join(':');
  let db;
  try { db = createAdminClient(); } catch { return null; }
  const read = async (): Promise<Stored | null> => {
    const { data } = await db.from('cricket_feed').select('data, ok_at').eq('key', id).maybeSingle();
    return data?.data != null ? { data: data.data, okAt: data.ok_at } : null;
  };
  let stored = await read();
  const { data: won } = await db.rpc('cricket_feed_claim', { p_key: id, p_seconds: every });
  if (won) {
    const r = await fetchProvider(path, params);
    if (r.data != null) {
      const okAt = new Date().toISOString();
      await db.from('cricket_feed').update({ data: r.data, ok_at: okAt, error: null }).eq('key', id);
      stored = { data: r.data, okAt };
    } else {
      console.error('cricketdata', path, r.error);
      await db.from('cricket_feed').update({ error: r.error }).eq('key', id);
    }
  }
  return stored;
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
  const finished = /\b(match drawn|match tied|won by|won the match|no result|abandoned|cancelled|canceled)\b/i.test(str(row.status));
  let state: CricMatch['state'] = ms === 'result' || finished ? 'result' : ms === 'live' ? 'live' : 'fixture';
  const startsAt = str(row.dateTimeGMT) ? `${str(row.dateTimeGMT).replace(/Z?$/, 'Z')}` : null;
  const status = str(row.status);
  // A match with a score or a "Day 2"/"Stumps"/"innings" status has started, whatever
  // the feed's date says (its date for a Test can be the current day, not day one).
  const started = !!(str(row.t1s) || str(row.t2s)) || /\b(day \d|stumps|innings|session|opt to|elected to|need|trail|lead)\b/i.test(status);
  if (!finished && started) state = 'live';
  else if (state === 'live' && !started) state = 'fixture';
  const team = (raw: string, score: unknown, img: unknown): CricTeam => ({
    name: cleanTeam(raw), short: shortName(raw), img: str(img) || null, score: str(score) || null,
  });
  return {
    id: str(row.id), name: `${cleanTeam(row.t1)} v ${cleanTeam(row.t2)}`, series: str(row.series) || null,
    matchType: str(row.matchType).toLowerCase(), state, status, startsAt,
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

async function buildBoard(): Promise<CricketBoard | null> {
  const listed = await call('cricScore', {}, secs('CRICKETDATA_LIST_SECONDS', 1200));
  const list = listed?.data;
  if (!Array.isArray(list)) return null;
  const matches = list.map(fromList).filter((m): m is CricMatch => !!m);
  if (!matches.length) return null;

  const byInterest = (a: CricMatch, b: CricMatch) => interest(b) - interest(a);
  const live = matches.filter(m => m.state === 'live').sort(byInterest);
  const date = (m: CricMatch) => Date.parse(m.startsAt || '') || 0;
  const results = matches.filter(m => m.state === 'result').sort((a, b) => date(b) - date(a) || byInterest(a, b)).slice(0, 12);
  const upcoming = matches.filter(m => m.state === 'fixture' && (!date(m) || date(m) > Date.now() - 6 * 3600000))
    .sort((a, b) => (date(a) || Infinity) - (date(b) || Infinity) || byInterest(a, b)).slice(0, 12);

  // The headline match: a live game readers care about, else a New Zealand or India game
  // starting within a day, else any live game, else the newest dated result.
  const soon = (m: CricMatch) => date(m) > 0 && date(m) - Date.now() < 86400000;
  const upcomingSoon = upcoming.filter(m => date(m) > Date.now() - 3600000);
  const featured = live.find(m => interest(m) >= 60) ?? upcomingSoon.find(m => interest(m) >= 60 && soon(m))
    ?? live[0] ?? results[0] ?? upcomingSoon[0] ?? null;
  let scorecard: CricScorecard | null = null;
  if (featured && featured.state !== 'fixture') {
    // Results don't change, so their scorecard can be kept a day.
    const ttl = featured.state === 'live' ? secs('CRICKETDATA_SCORECARD_SECONDS', 5400) : 86400 * 7;
    scorecard = fromScorecard((await call('match_scorecard', { id: featured.id }, ttl))?.data);
  }
  return { updatedAt: listed?.okAt || new Date().toISOString(), featured, scorecard, live, results, upcoming };
}

/** One database read a minute at most; the provider timers above decide the API calls. */
export const getCricketBoard = unstable_cache(buildBoard, ['cricket-board-v2'], { revalidate: 60 });
