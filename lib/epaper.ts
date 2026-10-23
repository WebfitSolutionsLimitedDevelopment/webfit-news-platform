import { cache } from 'react';
import { createPublicClient as createClient } from '@/lib/supabase-public';
import { getLiveAds, type LiveAd } from '@/lib/ads';
import { htmlToBlocks, type TextBlock } from '@/lib/epaper-text';

/**
 * Webfit News e-paper.
 *
 * Built automatically from published stories, with every story printed in full.
 *
 *   Weekly edition    Thursday–Wednesday (New Zealand time), released the
 *                     following Thursday at RELEASE_HOUR, complete, like a printed weekly.
 *   (Before WEEKLY_FROM there were two a week: Midweek Mon–Wed and Weekend Thu–Sun.
 *   Those editions keep their dates, numbers and URLs.)
 *
 * /epaper and the shelf show released editions only. The edition still being
 * filled can be previewed at /epaper/<its Thursday> but isn't listed. In the
 * changeover week, when the newest released edition is still a twice-weekly one,
 * /epaper keeps showing the first weekly edition as it fills, as before.
 * The shelf shows editions from the last EPAPER_WINDOW_DAYS days; every edition since launch stays readable at /epaper/<date> and is listed at /epaper/archive.
 * Each edition is a 20-page paper: the front-page story, then desk pages
 * per desk (DESKS) carrying that desk's strongest stories, trimmed to fit, each
 * ending with a link to the full story. Stories that don't make the paper are
 * listed on the back page.
 *
 * The server sends the stories (text, photo, section) and the booked ads. The reader's
 * browser lays the text out into fixed-size newspaper pages (see EpaperBook), because
 * only the browser can measure exactly how much text fits on a page.
 */

export const EPAPER_TIMEZONE = 'Pacific/Auckland';
export const EPAPER_WINDOW_DAYS = 29;
/** First weekly edition (a Thursday). Editions starting earlier are the old twice-weekly ones. */
export const WEEKLY_FROM = '2026-10-22';
/** A weekly edition is released at this hour, NZ time, on the Thursday after it ends. */
const RELEASE_HOUR = 6;
/** Words printed per desk page, and per story. Tuned so each desk fills about one page. */
const PAGE_WORDS = 400;
/** Story pages to aim for (with the front, back and advertising pages: 20, see TOTAL_PAGES in EpaperBook). */
const STORY_PAGES = 17;
const LEAD_WORDS = 260;
const STORY_WORDS = 130;
const MIN_STORY_WORDS = 60;
/** The front-page story is printed up to this length, so it fits on the front page. */
const FRONT_WORDS = 280;

/** The paper's pages: each desk gathers several sections and gets one page. */
export const DESKS: Array<{ title: string; kicker: string; keys: SectionKey[] }> = [
  { title: 'Aotearoa Today', kicker: 'New Zealand news', keys: ['nz'] },
  { title: 'Power & Politics', kicker: 'Election 2026 & opinion', keys: ['politics', 'opinion'] },
  { title: 'Desi Diaries', kicker: 'India, community & visas', keys: ['community', 'immigration', 'notices'] },
  { title: 'Money & World', kicker: 'Business, world & Australia', keys: ['business', 'world'] },
  { title: 'Style & Sports', kicker: 'Lifestyle, beauty, health & sport', keys: ['lifestyle', 'sports'] },
];

/** Monday of edition No. 1. Used for the "No." printed on the masthead. */
const EPAPER_LAUNCH = '2026-09-21';

export const EPAPER_FULL_PAGE_SLOT = 'EPAPER_FULL_PAGE';
export const EPAPER_HALF_PAGE_SLOT = 'EPAPER_HALF_PAGE';
/** Two posters side by side on one page. */
export const EPAPER_SHARED_PAGE_SLOT = 'EPAPER_SHARED_PAGE';

/* ---------------------------------------------------------------- sections */

export type SectionKey =
  | 'nz' | 'politics' | 'immigration' | 'community' | 'business'
  | 'world' | 'lifestyle' | 'sports' | 'opinion' | 'notices';

export type SectionDef = { key: SectionKey; title: string; kicker: string; slugs: string[] };

/** Reading order of the paper. "nz" also catches anything not mapped elsewhere. */
export const EPAPER_SECTIONS: SectionDef[] = [
  { key: 'nz', title: 'Aotearoa Today', kicker: 'New Zealand news', slugs: ['new-zealand', 'auckland', 'south-insland', 'weather', 'games', 'crime-courts', 'news', 'uncategorized'] },
  { key: 'politics', title: 'Power & Politics', kicker: 'Election 2026', slugs: ['politics', 'election', 'election-2026'] },
  { key: 'immigration', title: 'Visa Desk', kicker: 'Immigration & residency', slugs: ['immigration'] },
  { key: 'community', title: 'Desi Diaries', kicker: 'India & our community', slugs: ['india', 'india-hi', 'news-hi', 'kiwi-indian', 'communities', 'diwali', 'people-profiles', 'personality', 'student-life', 'faith-temples', 'pacific', 'associations-clubs'] },
  { key: 'business', title: 'Money Matters', kicker: 'Business & economy', slugs: ['business', 'local-business', 'economy', 'startups-tech', 'money-jobs', 'property'] },
  { key: 'world', title: 'World Window', kicker: 'World & Australia', slugs: ['world', 'australia', 'sydney', 'melbourne', 'perth', 'adelaide', 'brisbane'] },
  { key: 'lifestyle', title: 'Style & Living', kicker: 'Lifestyle, beauty & health', slugs: ['fashion', 'lifestyle', 'lifestyle-culture', 'health', 'travel', 'food-recipes', 'arts-culture', 'entertainment', 'customs', 'photo-stories', 'videos', 'motivation', 'stories', 'features'] },
  { key: 'sports', title: 'Sports Arena', kicker: 'Cricket, rugby & more', slugs: ['sports', 'cricket', 'football', 'community-sports'] },
  { key: 'opinion', title: 'Point of View', kicker: 'Opinion & editorials', slugs: ['editorials', 'editorial', 'opinion', 'letters'] },
  { key: 'notices', title: 'Community Board', kicker: 'Notices & classifieds', slugs: ['advertisement', 'community-notices', 'events-offers', 'business-ads', 'jobs-services', 'presenting'] },
];

const SECTION_BY_SLUG = new Map<string, SectionKey>();
for (const s of EPAPER_SECTIONS) for (const slug of s.slugs) SECTION_BY_SLUG.set(slug, s.key);

/* ---------------------------------------------------------------- dates */

/** YYYY-MM-DD of an instant, in New Zealand. */
export function nzDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: EPAPER_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday, for a calendar date. */
function weekday(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Minutes NZ is ahead of UTC at a given instant (+780 in summer, +720 in winter). */
function nzOffsetMinutes(instant: Date): number {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: EPAPER_TIMEZONE, timeZoneName: 'longOffset' })
    .formatToParts(instant).find(p => p.type === 'timeZoneName')?.value || 'GMT+12:00';
  const match = part.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!match) return 720;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] || 0));
}

/** The UTC instant of midnight at the start of a New Zealand calendar date. */
export function nzMidnight(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let t = guess - nzOffsetMinutes(new Date(guess)) * 60_000;
  t = guess - nzOffsetMinutes(new Date(t)) * 60_000; // settle across a DST change
  return new Date(t);
}

function mondayOf(ymd: string): string {
  return addDays(ymd, -((weekday(ymd) + 6) % 7));
}

const isWeekly = (start: string) => start >= WEEKLY_FROM;

/** Weekly: the Thursday on or before the date. Before WEEKLY_FROM: Monday for Mon–Wed, Thursday for Thu–Sun. */
function editionStart(ymd: string): string {
  if (ymd >= WEEKLY_FROM) return addDays(ymd, -((weekday(ymd) + 3) % 7));
  const monday = mondayOf(ymd);
  return (weekday(ymd) + 6) % 7 <= 2 ? monday : addDays(monday, 3);
}

function editionEnd(start: string): string {
  if (isWeekly(start)) return addDays(start, 6);
  return addDays(start, weekday(start) === 1 ? 2 : 3);
}

function editionNumber(start: string): number {
  const daysFrom = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);
  const twiceWeekly = (d: string) => Math.max(1, Math.floor(daysFrom(d, EPAPER_LAUNCH) / 7) * 2 + (weekday(d) === 4 ? 1 : 0) + 1);
  if (!isWeekly(start)) return twiceWeekly(start);
  return twiceWeekly(WEEKLY_FROM) + daysFrom(start, WEEKLY_FROM) / 7;
}

/** When an edition goes out: weekly ones the Thursday after they end, at RELEASE_HOUR; old ones on their first day. */
function releaseAt(firstDay: string, lastDay: string): Date {
  if (!isWeekly(firstDay)) return nzMidnight(firstDay);
  return new Date(nzMidnight(addDays(lastDay, 1)).getTime() + RELEASE_HOUR * 3_600_000);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => (ymd: string) =>
  new Intl.DateTimeFormat('en-NZ', { ...opts, timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`));
const longDate = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = fmt({ day: 'numeric', month: 'short' });

export type EditionInfo = {
  /** The day it starts (URL: /epaper/<key>): a Thursday for weekly editions, Monday or Thursday before WEEKLY_FROM. */
  key: string;
  href: string;
  title: string;
  dateline: string;
  coverage: string;
  number: number;
  /** Still being filled (stories published now go into it). */
  isLive: boolean;
  /** Out: listed on the shelf and in the archive, and emailed. */
  released: boolean;
  /** NZ date it is (or will be) released. */
  releaseDay: string;
  firstDay: string;
  lastDay: string;
  fromIso: string;
  toIso: string;
};

function makeEdition(firstDay: string, isLive: boolean, today: string, now: Date): EditionInfo {
  const lastDay = editionEnd(firstDay);
  const coverage = `${shortDate(firstDay)} – ${shortDate(lastDay)}`;
  const weekly = isWeekly(firstDay);
  const releaseDay = weekly ? addDays(lastDay, 1) : firstDay;
  return {
    key: firstDay,
    href: `/epaper/${firstDay}`,
    title: weekly ? 'Weekly edition' : `${weekday(firstDay) === 1 ? 'Midweek' : 'Weekend'} edition`,
    // A weekly edition is dated the day it comes out, like a printed weekly.
    dateline: longDate(weekly ? releaseDay : isLive ? today : lastDay),
    coverage,
    number: editionNumber(firstDay),
    isLive,
    released: now.getTime() >= releaseAt(firstDay, lastDay).getTime(),
    releaseDay,
    firstDay,
    lastDay,
    fromIso: nzMidnight(firstDay).toISOString(),
    toIso: nzMidnight(addDays(lastDay, 1)).toISOString(),
  };
}

/** The current (live) edition first, then earlier editions inside the window, newest first. */
export function listEditions(now = new Date()): EditionInfo[] {
  const today = nzDate(now);
  const oldestDay = addDays(today, -(EPAPER_WINDOW_DAYS - 1));
  const out: EditionInfo[] = [];
  let start = editionStart(today);
  while (editionEnd(start) >= oldestDay) {
    out.push(makeEdition(start, out.length === 0, today, now));
    start = editionStart(addDays(start, -1));
  }
  return out;
}

/** Every edition since the e-paper started, newest first (the archive). Editions never expire. */
export function listAllEditions(now = new Date()): EditionInfo[] {
  const today = nzDate(now);
  const out: EditionInfo[] = [];
  let start = editionStart(today);
  while (start >= EPAPER_LAUNCH) {
    out.push(makeEdition(start, out.length === 0, today, now));
    start = editionStart(addDays(start, -1));
  }
  return out;
}

/** Any edition by its key, however old, or null if it isn't one (or hasn't started yet). */
export function editionInfo(key: string, now = new Date()): EditionInfo | null {
  if (!isEditionKey(key) || key < EPAPER_LAUNCH) return null;
  const today = nzDate(now);
  const current = editionStart(today);
  if (key > current) return null;
  return makeEdition(key, key === current, today, now);
}

/**
 * The edition /epaper opens: the newest released one. In the changeover week the newest
 * released edition is still a twice-weekly one, so the first weekly edition shows as it fills.
 */
export function pickFeatured<T extends EditionInfo>(editions: T[]): T | null {
  const released = editions.find(e => e.released) ?? null;
  if (released && isWeekly(released.key)) return released;
  // Changeover: show the first weekly edition (the oldest weekly one listed) until it is released.
  const weekly = editions.filter(e => isWeekly(e.key));
  return weekly[weekly.length - 1] ?? released ?? editions[0] ?? null;
}

export function isEditionKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return isWeekly(value) ? weekday(value) === 4 : [1, 4].includes(weekday(value));
}

/* ---------------------------------------------------------------- stories */

export type EpaperStory = {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  image: string | null;
  imageAlt: string;
  /** Width ÷ height of the photo as uploaded (null when unknown). */
  imageRatio: number | null;
  section: SectionKey;
  categoryName: string | null;
  score: number;
};

export type EpaperFullStory = EpaperStory & { author: string | null; blocks: TextBlock[] };

type CategoryRow = { id: string; slug: string; name: string; parent_id: string | null };

function cleanText(value: string | null | undefined) {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;|&#8217;|&rsquo;/gi, '’').replace(/&hellip;|&#8230;/gi, '…')
    .replace(/\s+/g, ' ')
    .trim();
}

function sectionFor(cats: Array<{ category_id: string; is_primary: boolean }>, byId: Map<string, CategoryRow>): { key: SectionKey; name: string | null } {
  const ordered = [...cats].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  for (const pass of [0, 1, 2]) {
    for (const c of ordered) {
      let cat = byId.get(c.category_id);
      for (let i = 0; i < pass && cat?.parent_id; i += 1) cat = byId.get(cat.parent_id);
      if (!cat) continue;
      const key = SECTION_BY_SLUG.get(cat.slug);
      if (key) return { key, name: byId.get(c.category_id)?.name || cat.name };
    }
  }
  return { key: 'nz', name: ordered[0] ? byId.get(ordered[0].category_id)?.name || null : null };
}

const byImportance = (a: EpaperStory, b: EpaperStory) => b.score - a.score || b.published_at.localeCompare(a.published_at);

/** Every published story in the window (headline data only), newest first. */
const getWindowStories = cache(async (fromIso: string, toIso: string): Promise<EpaperStory[]> => {
  const supabase = await createClient();
  const [{ data: cats }, { data, error }] = await Promise.all([
    supabase.from('categories').select('id,slug,name,parent_id'),
    supabase.from('articles')
      .select('id,title,slug,published_at,view_count,is_homepage_hero,is_featured,is_editor_pick,is_breaking,media:media!articles_featured_media_id_fkey(public_url,alt_text,width,height),article_categories(category_id,is_primary)')
      .eq('status', 'published')
      .gte('published_at', fromIso)
      .lt('published_at', toIso)
      .order('published_at', { ascending: false })
      .limit(500),
  ]);
  if (error) throw error;
  const byId = new Map<string, CategoryRow>((cats || []).map((c: any) => [c.id, c as CategoryRow]));
  return (data || []).map((row: any) => {
    const { key, name } = sectionFor(row.article_categories || [], byId);
    const views = Number(row.view_count || 0);
    const score = (row.is_homepage_hero ? 1000 : 0) + (row.is_breaking ? 400 : 0) + (row.is_featured ? 300 : 0) + (row.is_editor_pick ? 200 : 0) + Math.min(views, 5000) / 10;
    return {
      id: row.id,
      title: cleanText(row.title),
      slug: row.slug,
      published_at: row.published_at,
      image: row.media?.public_url || null,
      imageAlt: row.media?.alt_text || cleanText(row.title),
      imageRatio: row.media?.width > 0 && row.media?.height > 0 ? Number(row.media.width) / Number(row.media.height) : null,
      section: key,
      categoryName: name,
      score,
    } satisfies EpaperStory;
  });
});

/* ---------------------------------------------------------------- editions */

export type EpaperAd = {
  assignmentId: string;
  /** Null when the advertiser has no web page: the poster is shown without a link. */
  href: string | null;
  image: string;
  alt: string;
  advertiser: string | null;
  isElectionAd: boolean;
  promoterStatement: string | null;
  /** Button text under a shared-page poster, e.g. "Book online". */
  cta: string | null;
};

export type EditionSection = { key: SectionKey; title: string; kicker: string; stories: EpaperFullStory[] };

export type Edition = EditionInfo & {
  /** Front page lead first, then each section in reading order. */
  sections: EditionSection[];
  storyCount: number;
  /** Stories in this edition's dates that didn't fit the paper (listed on the back page). */
  moreStories: Array<{ title: string; slug: string }>;
  coverImage: string | null;
  fullPageAds: EpaperAd[];
  /** Highest priority first; paired two to a page. */
  sharedPageAds: EpaperAd[];
  halfPageAds: EpaperAd[];
};

function toEpaperAd(ad: LiveAd): EpaperAd | null {
  const image = ad.desktop_image || ad.poster_image || ad.mobile_image;
  if (!image) return null;
  return {
    assignmentId: ad.assignment_id,
    href: ad.destination_url ? `/api/ads/click?a=${encodeURIComponent(ad.assignment_id)}` : null,
    image,
    alt: ad.alt_text || ad.headline || ad.advertiser || 'Advertisement',
    advertiser: ad.advertiser,
    isElectionAd: ad.is_election_ad,
    promoterStatement: ad.promoter_statement,
    cta: ad.cta_label || null,
  };
}

/** Repeatable order (so an edition looks the same on every visit), still spread fairly. */
function rotate<T>(items: T[], seed: string): T[] {
  if (items.length < 2) return items;
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const k = h % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

function inEdition(info: EditionInfo) {
  const from = Date.parse(info.fromIso);
  const to = Date.parse(info.toIso);
  return (s: EpaperStory) => { const t = Date.parse(s.published_at); return t >= from && t < to; };
}

/** One edition with every story's full text (any edition since launch), or null if the key isn't one. */
export const getEdition = cache(async (key?: string): Promise<Edition | null> => {
  // A key can be any edition since launch (the archive, or a preview of the one being filled); no key means the one /epaper opens.
  const info: EditionInfo | null = key ? editionInfo(key) : pickFeatured(listEditions());
  if (!info) return null;
  const [inWindow, ads] = await Promise.all([getWindowStories(info.fromIso, info.toIso), getLiveAds()]);
  const stories = inWindow.filter(inEdition(info));

  // Full text for this edition's stories only.
  const bodies = new Map<string, { html: string | null; author: string | null }>();
  if (stories.length) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('articles').select('id,content_html,author:author_id(name)').in('id', stories.map(s => s.id));
    if (error) throw error;
    for (const row of data || []) bodies.set((row as any).id, { html: (row as any).content_html, author: (row as any).author?.name || null });
  }
  const full = (s: EpaperStory): EpaperFullStory => ({ ...s, author: bodies.get(s.id)?.author || null, blocks: htmlToBlocks(bodies.get(s.id)?.html, s.title) });

  const ranked = [...stories].sort(byImportance);
  const lead = ranked[0];

  // Trim a story to a word limit, ending on a whole paragraph where possible, plus a link.
  const words = (t: string) => t.split(' ').filter(Boolean).length;
  const trim = (s: EpaperStory, limit: number): EpaperFullStory => {
    const story = full(s);
    const total = story.blocks.reduce((n, b) => n + words(b.t), 0);
    if (total <= limit * 1.15) return story;
    const kept: TextBlock[] = [];
    let count = 0;
    for (const b of story.blocks) {
      if (count >= limit) break;
      if (b.k === 'h' && count > limit * 0.6) break; // don't end on a subheading
      const room = limit - count;
      if (words(b.t) > room + 25 && b.k === 'p') {
        const cut = b.t.split(' ').slice(0, Math.max(room, 25)).join(' ');
        const sentence = cut.match(/^[\s\S]*[.!?]["”’]?(?=\s|$)/)?.[0];
        kept.push({ ...b, t: sentence && words(sentence) > 15 ? sentence : `${cut}…` });
        count = limit;
        break;
      }
      kept.push(b);
      count += words(b.t);
    }
    kept.push({ k: 'p', t: `Read the full story at webfitnews.com/${s.slug}` });
    return { ...story, blocks: kept };
  };

  const sections: EditionSection[] = [];
  const printedIds = new Set<string>();
  if (lead) { sections.push({ key: lead.section, title: 'Top Story', kicker: 'Front page', stories: [trim(lead, FRONT_WORDS)] }); printedIds.add(lead.id); }
  // Share the story pages between the desks that have stories (one to two pages each).
  const activeDesks = DESKS.filter(d => ranked.some(s => d.keys.includes(s.section) && s.id !== lead?.id));
  // Generous: the browser fills each desk's page quota and drops what doesn't fit.
  const candidates = ranked.length - 1 || 1;
  const deskWordsFor = (n: number) => Math.max(PAGE_WORDS * 2, Math.round((STORY_PAGES * PAGE_WORDS * 1.6 * n) / candidates));
  for (const desk of activeDesks) {
    const list = ranked.filter(s => desk.keys.includes(s.section) && s.id !== lead?.id);
    const chosen: EpaperFullStory[] = [];
    let budget = deskWordsFor(list.length);
    for (const s of list) {
      const limit = Math.min(chosen.length ? STORY_WORDS : LEAD_WORDS, budget);
      if (limit < MIN_STORY_WORDS) break;
      const story = trim(s, limit);
      chosen.push(story);
      printedIds.add(s.id);
      budget -= story.blocks.reduce((n, b) => n + words(b.t), 0) + 60; // headline, byline, photo
    }
    sections.push({ key: desk.keys[0], title: desk.title, kicker: desk.kicker, stories: chosen });
  }
  const moreStories = ranked.filter(s => !printedIds.has(s.id)).map(s => ({ title: s.title, slug: s.slug }));

  return {
    ...info,
    sections,
    storyCount: stories.length,
    moreStories,
    coverImage: lead?.image || stories.find(s => s.image)?.image || null,
    // Highest priority first: it gets page 2, the next one page 6.
    fullPageAds: [...(ads[EPAPER_FULL_PAGE_SLOT] || [])].sort((x, y) => (y.priority || 0) - (x.priority || 0)).map(toEpaperAd).filter(Boolean) as EpaperAd[],
    sharedPageAds: [...(ads[EPAPER_SHARED_PAGE_SLOT] || [])].sort((x, y) => (y.priority || 0) - (x.priority || 0)).map(toEpaperAd).filter(Boolean) as EpaperAd[],
    halfPageAds: rotate((ads[EPAPER_HALF_PAGE_SLOT] || []).map(toEpaperAd).filter(Boolean) as EpaperAd[], info.lastDay + info.key),
  };
});

export type EditionSummary = EditionInfo & { storyCount: number; coverImage: string | null; headline: string | null };

/** The edition /epaper opens (see pickFeatured). */
export function featuredEdition(shelf: EditionSummary[]): EditionSummary | null {
  return pickFeatured(shelf);
}

/** Shelf of editions in the window, newest first, with a cover photo and headline each. */
export const getEditionShelf = cache(async (): Promise<EditionSummary[]> => {
  const editions = listEditions();
  const from = editions.reduce((min, e) => (e.fromIso < min ? e.fromIso : min), editions[0].fromIso);
  const all = await getWindowStories(from, editions[0].toIso);
  // Only editions that are out, plus the featured one (in the changeover week it is still filling).
  const featured = pickFeatured(editions);
  return editions.filter(info => info.released || info.key === featured?.key).map(info => {
    const stories = all.filter(inEdition(info));
    const top = [...stories].sort(byImportance)[0];
    return { ...info, storyCount: stories.length, coverImage: top?.image || null, headline: top?.title || null };
  });
});
