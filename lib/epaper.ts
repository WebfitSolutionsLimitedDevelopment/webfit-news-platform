import { cache } from 'react';
import { createPublicClient as createClient } from '@/lib/supabase-public';
import { getLiveAds, type LiveAd } from '@/lib/ads';

/**
 * Webfit News e-paper.
 *
 * Editions are built automatically from published stories. There are three a week,
 * each covering two or three days of reporting (New Zealand time):
 *
 *   Monday edition     Mon + Tue
 *   Wednesday edition  Wed + Thu
 *   Friday edition     Fri + Sat + Sun
 *
 * The newest edition is "live": a story published today appears in it within a few
 * minutes. Editions older than EPAPER_WINDOW_DAYS drop off. Nothing is uploaded by
 * hand: the pages, sections and ad pages are laid out from the database every time.
 */

export const EPAPER_TIMEZONE = 'Pacific/Auckland';
export const EPAPER_WINDOW_DAYS = 15;
/** Edition No. 1 (a Monday). Used for the "No." printed on the masthead. */
const EPAPER_LAUNCH = '2026-09-21';

export const EPAPER_FULL_PAGE_SLOT = 'EPAPER_FULL_PAGE';
export const EPAPER_HALF_PAGE_SLOT = 'EPAPER_HALF_PAGE';

/** Stories on a section page before it continues onto another page. */
const STORIES_PER_PAGE = 4;
/** Stories on the front page. */
const FRONT_PAGE_STORIES = 5;
/** A full-page ad after every N story pages. */
const FULL_PAGE_AD_EVERY = 4;

/* ---------------------------------------------------------------- sections */

export type SectionKey =
  | 'nz' | 'politics' | 'immigration' | 'community' | 'business'
  | 'world' | 'lifestyle' | 'sports' | 'opinion' | 'notices';

type SectionDef = { key: SectionKey; title: string; kicker: string; slugs: string[] };

/** Reading order of the paper. "nz" also catches anything not mapped elsewhere. */
export const EPAPER_SECTIONS: SectionDef[] = [
  { key: 'nz', title: 'New Zealand', kicker: 'Aotearoa', slugs: ['new-zealand', 'auckland', 'south-insland', 'weather', 'games', 'crime-courts', 'news', 'uncategorized'] },
  { key: 'politics', title: 'Politics & Election', kicker: 'Decision 2026', slugs: ['politics', 'election', 'election-2026'] },
  { key: 'immigration', title: 'Immigration', kicker: 'Visas & residency', slugs: ['immigration'] },
  { key: 'community', title: 'India & Community', kicker: 'Our people', slugs: ['india', 'india-hi', 'news-hi', 'kiwi-indian', 'communities', 'diwali', 'people-profiles', 'personality', 'student-life', 'faith-temples', 'pacific', 'associations-clubs'] },
  { key: 'business', title: 'Business & Money', kicker: 'Economy', slugs: ['business', 'local-business', 'economy', 'startups-tech', 'money-jobs', 'property'] },
  { key: 'world', title: 'World & Australia', kicker: 'Beyond our shores', slugs: ['world', 'australia', 'sydney', 'melbourne', 'perth', 'adelaide', 'brisbane'] },
  { key: 'lifestyle', title: 'Lifestyle & Beauty', kicker: 'Living well', slugs: ['fashion', 'lifestyle', 'lifestyle-culture', 'health', 'travel', 'food-recipes', 'arts-culture', 'entertainment', 'customs', 'photo-stories', 'videos', 'motivation', 'stories', 'features'] },
  { key: 'sports', title: 'Sports', kicker: 'Game day', slugs: ['sports', 'cricket', 'football', 'community-sports'] },
  { key: 'opinion', title: 'Opinion', kicker: 'Views', slugs: ['editorials', 'editorial', 'opinion', 'letters'] },
  { key: 'notices', title: 'Notices & Classifieds', kicker: 'Community board', slugs: ['advertisement', 'community-notices', 'events-offers', 'business-ads', 'jobs-services', 'presenting'] },
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
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
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

/** Start date of the edition a calendar date belongs to (a Monday, Wednesday or Friday). */
export function editionStartFor(ymd: string): string {
  const back: Record<number, number> = { 1: 0, 2: 1, 3: 0, 4: 1, 5: 0, 6: 1, 0: 2 };
  return addDays(ymd, -back[weekday(ymd)]);
}

/** The edition after the one starting on `start`. */
function nextEditionStart(start: string): string {
  const day = weekday(start);
  return addDays(start, day === 5 ? 3 : 2);
}

function previousEditionStart(start: string): string {
  return editionStartFor(addDays(start, -1));
}

function editionNumber(start: string): number {
  let n = 1;
  let cursor = EPAPER_LAUNCH;
  if (start < cursor) return 0;
  while (cursor < start && n < 10_000) { cursor = nextEditionStart(cursor); n += 1; }
  return n;
}

const longDate = (ymd: string) => new Intl.DateTimeFormat('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  .format(new Date(`${ymd}T00:00:00Z`));
const shortDate = (ymd: string) => new Intl.DateTimeFormat('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  .format(new Date(`${ymd}T00:00:00Z`));

export type EditionInfo = {
  /** Start date, YYYY-MM-DD. Also the URL: /epaper/<key>. */
  key: string;
  /** Last calendar day covered (inclusive). */
  lastDay: string;
  title: string;
  coverage: string;
  number: number;
  isLive: boolean;
  from: Date;
  to: Date;
};

function editionInfo(start: string, today: string): EditionInfo {
  const next = nextEditionStart(start);
  const lastDay = addDays(next, -1);
  return {
    key: start,
    lastDay,
    title: `${longDate(start)} edition`,
    coverage: `${shortDate(start)} – ${shortDate(lastDay)}`,
    number: editionNumber(start),
    isLive: start <= today && today < next,
    from: nzMidnight(start),
    to: nzMidnight(next),
  };
}

/** Every edition in the reading window, newest first (LIFO). */
export function listEditions(now = new Date()): EditionInfo[] {
  const today = nzDate(now);
  const oldestDay = addDays(today, -(EPAPER_WINDOW_DAYS - 1));
  const out: EditionInfo[] = [];
  let start = editionStartFor(today);
  while (true) {
    const info = editionInfo(start, today);
    if (info.lastDay < oldestDay) break;
    out.push(info);
    start = previousEditionStart(start);
  }
  return out;
}

export function isEditionKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && editionStartFor(value) === value;
}

/* ---------------------------------------------------------------- stories */

export type EpaperStory = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  image: string | null;
  imageAlt: string;
  section: SectionKey;
  categoryName: string | null;
  score: number;
};

type CategoryRow = { id: string; slug: string; name: string; parent_id: string | null };

function cleanText(value: string | null | undefined) {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;|&#8217;|&rsquo;/gi, '’').replace(/&hellip;|&#8230;/gi, '…')
    .replace(/\[(?:…|\s*\.\.\.\s*)\]\s*$/, '')
    .replace(/^(?:by webfit news\s*\|\s*)?(?:updated\s+)?\d{1,2}\s+\w+\s+\d{4}\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Some imported excerpts repeat the headline word for word; drop that part. */
function dedupeExcerpt(title: string, excerpt: string) {
  if (title && excerpt.toLowerCase().startsWith(title.toLowerCase())) return excerpt.slice(title.length).replace(/^[\s.:–—-]+/, '');
  return excerpt;
}

function sectionFor(cats: Array<{ category_id: string; is_primary: boolean }>, byId: Map<string, CategoryRow>): { key: SectionKey; name: string | null } {
  const ordered = [...cats].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  // The story's own categories first (primary before others), then their parents.
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

/** Every published story in the reading window, newest first. One query, cached per request. */
const getWindowStories = cache(async (fromIso: string, toIso: string): Promise<EpaperStory[]> => {
  const supabase = await createClient();
  const [{ data: cats }, { data, error }] = await Promise.all([
    supabase.from('categories').select('id,slug,name,parent_id'),
    supabase.from('articles')
      .select('id,title,slug,excerpt,published_at,view_count,is_homepage_hero,is_featured,is_editor_pick,is_breaking,media:media!articles_featured_media_id_fkey(public_url,alt_text),article_categories(category_id,is_primary)')
      .eq('status', 'published')
      .gte('published_at', fromIso)
      .lt('published_at', toIso)
      .order('published_at', { ascending: false })
      .limit(400),
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
      excerpt: dedupeExcerpt(cleanText(row.title), cleanText(row.excerpt)),
      published_at: row.published_at,
      image: row.media?.public_url || null,
      imageAlt: row.media?.alt_text || cleanText(row.title),
      section: key,
      categoryName: name,
      score,
    } satisfies EpaperStory;
  });
});

/* ---------------------------------------------------------------- pages */

export type EpaperAd = {
  assignmentId: string;
  href: string;
  image: string;
  alt: string;
  advertiser: string | null;
  isElectionAd: boolean;
  promoterStatement: string | null;
};

export type EpaperPage =
  | { kind: 'front'; label: string; lead: EpaperStory | null; stories: EpaperStory[]; contents: Array<{ title: string; page: number }> }
  | { kind: 'section'; label: string; section: SectionDef; continued: boolean; stories: EpaperStory[]; halfAd: EpaperAd | null; houseHalf: boolean }
  | { kind: 'ad'; label: string; ad: EpaperAd | null }
  | { kind: 'back'; label: string; latest: EditionInfo[] };

export type Edition = EditionInfo & {
  pages: EpaperPage[];
  stories: EpaperStory[];
  coverImage: string | null;
};

function toEpaperAd(ad: LiveAd): EpaperAd | null {
  const image = ad.desktop_image || ad.poster_image || ad.mobile_image;
  if (!image || ad.format === 'video' && !ad.poster_image && !ad.desktop_image) return null;
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

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function layoutEdition(info: EditionInfo, stories: EpaperStory[], ads: Record<string, LiveAd[]>, all: EditionInfo[]): EpaperPage[] {
  const fullAds = rotate((ads[EPAPER_FULL_PAGE_SLOT] || []).map(toEpaperAd).filter(Boolean) as EpaperAd[], info.key);
  const halfAds = rotate((ads[EPAPER_HALF_PAGE_SLOT] || []).map(toEpaperAd).filter(Boolean) as EpaperAd[], info.key);

  // Front page: the most important stories, newest first among equals.
  const ranked = [...stories].sort((a, b) => b.score - a.score || b.published_at.localeCompare(a.published_at));
  const front = ranked.slice(0, FRONT_PAGE_STORIES);
  const frontIds = new Set(front.map(s => s.id));
  const rest = stories.filter(s => !frontIds.has(s.id));

  const storyPages: EpaperPage[] = [];
  let halfIndex = 0;
  let houseHalfUsed = false;
  for (const section of EPAPER_SECTIONS) {
    const inSection = rest.filter(s => s.section === section.key);
    if (!inSection.length) continue;
    // Lead of each section page: its strongest story, rest newest first.
    const ordered = [...inSection].sort((a, b) => b.score - a.score || b.published_at.localeCompare(a.published_at));
    chunk(ordered, STORIES_PER_PAGE).forEach((group, i) => {
      const previous = storyPages[storyPages.length - 1];
      const previousHadHalf = previous?.kind === 'section' && Boolean(previous.halfAd || previous.houseHalf);
      const roomForAd = group.length <= 2 && !previousHadHalf;
      const halfAd = roomForAd && halfAds.length ? halfAds[halfIndex++ % halfAds.length] : null;
      const houseHalf = roomForAd && !halfAd && !houseHalfUsed;
      if (houseHalf) houseHalfUsed = true;
      storyPages.push({ kind: 'section', label: i ? `${section.title} (cont.)` : section.title, section, continued: i > 0, stories: group, halfAd, houseHalf });
    });
  }

  // Full-page ads between story pages. Without bookings, one "advertise here" page.
  const pages: EpaperPage[] = [];
  let fullIndex = 0;
  let housePageUsed = false;
  storyPages.forEach((page, i) => {
    pages.push(page);
    const isBreak = (i + 1) % FULL_PAGE_AD_EVERY === 2 && i < storyPages.length - 1;
    if (!isBreak) return;
    if (fullAds.length && fullIndex < fullAds.length) {
      pages.push({ kind: 'ad', label: 'Advertisement', ad: fullAds[fullIndex++] });
    } else if (!housePageUsed) {
      housePageUsed = true;
      pages.push({ kind: 'ad', label: 'Advertise with us', ad: null });
    }
  });

  // Front page contents: which page each section starts on (front page is 1).
  const contents: Array<{ title: string; page: number }> = [];
  pages.forEach((p, i) => {
    if (p.kind === 'section' && !p.continued) contents.push({ title: p.section.title, page: i + 2 });
  });

  return [
    { kind: 'front', label: 'Front page', lead: front[0] || null, stories: front.slice(1), contents },
    ...pages,
    { kind: 'back', label: 'Back page', latest: all.filter(e => e.key !== info.key).slice(0, 4) },
  ];
}

/** One edition with its pages, or null if it is outside the reading window. */
export const getEdition = cache(async (key?: string): Promise<Edition | null> => {
  const editions = listEditions();
  if (!editions.length) return null;
  const info = key ? editions.find(e => e.key === key) : editions[0];
  if (!info) return null;
  const windowFrom = editions[editions.length - 1].from.toISOString();
  const windowTo = editions[0].to.toISOString();
  const [all, ads] = await Promise.all([getWindowStories(windowFrom, windowTo), getLiveAds()]);
  const stories = all.filter(s => {
    const t = new Date(s.published_at).getTime();
    return t >= info.from.getTime() && t < info.to.getTime();
  });
  const pages = layoutEdition(info, stories, ads, editions);
  const front = pages[0].kind === 'front' ? pages[0] : null;
  return { ...info, pages, stories, coverImage: front?.lead?.image || stories.find(s => s.image)?.image || null };
});

export type EditionSummary = EditionInfo & { storyCount: number; coverImage: string | null; headline: string | null };

/** Shelf of editions in the window, newest first, with a cover photo and headline each. */
export const getEditionShelf = cache(async (): Promise<EditionSummary[]> => {
  const editions = listEditions();
  if (!editions.length) return [];
  const all = await getWindowStories(editions[editions.length - 1].from.toISOString(), editions[0].to.toISOString());
  return editions.map(info => {
    const stories = all.filter(s => {
      const t = new Date(s.published_at).getTime();
      return t >= info.from.getTime() && t < info.to.getTime();
    });
    const top = [...stories].sort((a, b) => b.score - a.score || b.published_at.localeCompare(a.published_at))[0];
    return { ...info, storyCount: stories.length, coverImage: top?.image || null, headline: top?.title || null };
  });
});
