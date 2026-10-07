import { cache } from 'react';
import { createPublicClient as createClient } from '@/lib/supabase-public';
import { getLiveAds, type LiveAd } from '@/lib/ads';
import { htmlToBlocks, type TextBlock } from '@/lib/epaper-text';

/**
 * Webfit News e-paper.
 *
 * Built automatically from published stories, with every story printed in full.
 *
 *   This week   always the last 7 days (New Zealand time), updated as we publish.
 *   Past weeks  one edition per Monday–Sunday week, kept while it falls inside the
 *               last EPAPER_WINDOW_DAYS days.
 *
 * The server sends the stories (text, photo, section) and the booked ads. The reader's
 * browser lays the text out into fixed-size newspaper pages (see EpaperBook), because
 * only the browser can measure exactly how much text fits on a page.
 */

export const EPAPER_TIMEZONE = 'Pacific/Auckland';
export const EPAPER_WINDOW_DAYS = 15;
export const EDITION_DAYS = 7;
/** Monday of week No. 1. Used for the "No." printed on the masthead. */
const EPAPER_LAUNCH = '2026-09-21';

export const EPAPER_FULL_PAGE_SLOT = 'EPAPER_FULL_PAGE';
export const EPAPER_HALF_PAGE_SLOT = 'EPAPER_HALF_PAGE';

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

function weekNumber(ymd: string): number {
  const days = Math.round((Date.parse(`${mondayOf(ymd)}T00:00:00Z`) - Date.parse(`${EPAPER_LAUNCH}T00:00:00Z`)) / 86_400_000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => (ymd: string) =>
  new Intl.DateTimeFormat('en-NZ', { ...opts, timeZone: 'UTC' }).format(new Date(`${ymd}T00:00:00Z`));
const longDate = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = fmt({ day: 'numeric', month: 'short' });

export type EditionInfo = {
  /** "latest" for this week's live edition, otherwise the Monday it starts (URL: /epaper/<key>). */
  key: string;
  href: string;
  title: string;
  dateline: string;
  coverage: string;
  number: number;
  isLive: boolean;
  firstDay: string;
  lastDay: string;
  fromIso: string;
  toIso: string;
};

function makeEdition(firstDay: string, lastDay: string, isLive: boolean): EditionInfo {
  const coverage = `${shortDate(firstDay)} – ${shortDate(lastDay)}`;
  return {
    key: isLive ? 'latest' : firstDay,
    href: isLive ? '/epaper' : `/epaper/${firstDay}`,
    title: isLive ? 'This week’s edition' : `Week of ${coverage}`,
    dateline: longDate(lastDay),
    coverage,
    number: weekNumber(lastDay),
    isLive,
    firstDay,
    lastDay,
    fromIso: nzMidnight(firstDay).toISOString(),
    toIso: nzMidnight(addDays(lastDay, 1)).toISOString(),
  };
}

/** The live edition first, then past Monday–Sunday weeks inside the window (newest first). */
export function listEditions(now = new Date()): EditionInfo[] {
  const today = nzDate(now);
  const oldestDay = addDays(today, -(EPAPER_WINDOW_DAYS - 1));
  const out = [makeEdition(addDays(today, -(EDITION_DAYS - 1)), today, true)];
  let monday = addDays(mondayOf(today), -7);
  while (addDays(monday, 6) >= oldestDay) {
    out.push(makeEdition(monday, addDays(monday, 6), false));
    monday = addDays(monday, -7);
  }
  return out;
}

export function isEditionKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && weekday(value) === 1;
}

/* ---------------------------------------------------------------- stories */

export type EpaperStory = {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  image: string | null;
  imageAlt: string;
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
      .select('id,title,slug,published_at,view_count,is_homepage_hero,is_featured,is_editor_pick,is_breaking,media:media!articles_featured_media_id_fkey(public_url,alt_text),article_categories(category_id,is_primary)')
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
      section: key,
      categoryName: name,
      score,
    } satisfies EpaperStory;
  });
});

/* ---------------------------------------------------------------- editions */

export type EpaperAd = {
  assignmentId: string;
  href: string;
  image: string;
  alt: string;
  advertiser: string | null;
  isElectionAd: boolean;
  promoterStatement: string | null;
};

export type EditionSection = { key: SectionKey; title: string; kicker: string; stories: EpaperFullStory[] };

export type Edition = EditionInfo & {
  /** Front page lead first, then each section in reading order. */
  sections: EditionSection[];
  storyCount: number;
  coverImage: string | null;
  fullPageAds: EpaperAd[];
  halfPageAds: EpaperAd[];
};

function toEpaperAd(ad: LiveAd): EpaperAd | null {
  const image = ad.desktop_image || ad.poster_image || ad.mobile_image;
  if (!image) return null;
  return {
    assignmentId: ad.assignment_id,
    href: `/api/ads/click?a=${encodeURIComponent(ad.assignment_id)}`,
    image,
    alt: ad.alt_text || ad.headline || ad.advertiser || 'Advertisement',
    advertiser: ad.advertiser,
    isElectionAd: ad.is_election_ad,
    promoterStatement: ad.promoter_statement,
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

/** One edition with every story's full text, or null if it is outside the window. */
export const getEdition = cache(async (key = 'latest'): Promise<Edition | null> => {
  const editions = listEditions();
  const info = editions.find(e => e.key === key);
  if (!info) return null;

  const [headlines, ads] = await Promise.all([getWindowStories(info.fromIso, info.toIso), getLiveAds()]);
  const stories = headlines.filter(inEdition(info));

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
  const sections: EditionSection[] = [];
  if (lead) sections.push({ key: lead.section, title: 'Top Story', kicker: 'Front page', stories: [full(lead)] });
  for (const def of EPAPER_SECTIONS) {
    const list = ranked.filter(s => s.section === def.key && s.id !== lead?.id);
    if (list.length) sections.push({ key: def.key, title: def.title, kicker: def.kicker, stories: list.map(full) });
  }

  return {
    ...info,
    sections,
    storyCount: stories.length,
    coverImage: lead?.image || stories.find(s => s.image)?.image || null,
    fullPageAds: rotate((ads[EPAPER_FULL_PAGE_SLOT] || []).map(toEpaperAd).filter(Boolean) as EpaperAd[], info.key + info.lastDay),
    halfPageAds: rotate((ads[EPAPER_HALF_PAGE_SLOT] || []).map(toEpaperAd).filter(Boolean) as EpaperAd[], info.lastDay + info.key),
  };
});

export type EditionSummary = EditionInfo & { storyCount: number; coverImage: string | null; headline: string | null };

/** Shelf of editions in the window, newest first, with a cover photo and headline each. */
export const getEditionShelf = cache(async (): Promise<EditionSummary[]> => {
  const editions = listEditions();
  const from = editions.reduce((min, e) => (e.fromIso < min ? e.fromIso : min), editions[0].fromIso);
  const all = await getWindowStories(from, editions[0].toIso);
  return editions.map(info => {
    const stories = all.filter(inEdition(info));
    const top = [...stories].sort(byImportance)[0];
    return { ...info, storyCount: stories.length, coverImage: top?.image || null, headline: top?.title || null };
  });
});
