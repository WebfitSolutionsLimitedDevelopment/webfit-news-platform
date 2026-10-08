/**
 * Topic hubs: standing pages that gather every story on a running theme
 * (the election, immigration, cost of living, festivals). Stories are matched
 * by headline and category, so editors don't have to tag anything, and every
 * matching story links back to its hub.
 */
import { cache } from 'react';
import { createPublicClient as createClient } from './supabase-public';
import type { Story } from './news';

export type TopicSection = { title: string; match: RegExp };
export type TopicLink = { label: string; href: string; external?: boolean };
export type Topic = {
  slug: string;
  name: string;
  kicker: string;
  description: string;
  intro: string[];
  /** Headline must match this... */
  match: RegExp;
  /** ...and must not match this. */
  exclude?: RegExp;
  /** Stories in these categories always belong to the hub. */
  categories?: string[];
  /** Only stories published on or after this date. */
  since?: string;
  sections?: TopicSection[];
  links: TopicLink[];
  /** Short line shown on matching articles. */
  articleNote: string;
};

export const TOPICS: Topic[] = [
  {
    slug: 'nz-election-2026',
    name: 'NZ Election 2026',
    kicker: 'Election 2026',
    description: 'All Webfit News coverage of the 2026 New Zealand general election on 7 November: polls, party policies, candidates, electorates and how to enrol and vote.',
    intro: [
      'New Zealand votes in the general election on Saturday 7 November 2026. This page brings together all of our election reporting in one place, from the latest polls and leaders’ debates to party policies, local candidates and what the result could mean for your household.',
      'Make sure you are enrolled before election day. Official information on enrolling, advance voting and where to vote is on vote.nz.',
    ],
    match: /\b(election|elections|polls?|voters?|voting|vote|candidates?|electorates?|party vote|ballot|enrolment|electoral)\b/i,
    exclude: /\b(bihar|tamil nadu|west bengal|kanak|paris|india fta|kiwibank|local board|local elections?|mayor|australia'?s compulsory|by-election|mata)\b/i,
    categories: ['election', 'election-2026'],
    since: '2026-01-01',
    sections: [
      { title: 'Polls and debates', match: /\b(polls?|debate|survey|surveyed|audience backing)\b/i },
      { title: 'Enrolling and voting', match: /\b(enrol|enrolment|rolls?|writ|deadline|how to vote|kids voting|voter access|deepfakes?)\b/i },
      { title: 'Candidates and electorates', match: /\b(candidates?|electorates?|list|selection|seat|fundraiser)\b/i },
      { title: 'Parties and policies', match: /\b(polic(y|ies)|pledges?|plan|promises?|platform|tax|campaign|agenda|scorecard|labour|national|act|greens?|nz first|te pāti|māori party)\b/i },
    ],
    links: [
      { label: 'Enrol or check your enrolment (vote.nz)', href: 'https://vote.nz', external: true },
      { label: 'Politics news', href: '/category/politics' },
    ],
    articleNote: 'Polls, policies, candidates and how to vote, all in one place.',
  },
  {
    slug: 'immigration-visas',
    name: 'NZ immigration and visa news',
    kicker: 'Immigration',
    description: 'New Zealand immigration and visa news from Webfit News: changes to work, student, resident and parent visas, citizenship rules, migrant worker exploitation cases and immigration fraud.',
    intro: [
      'Changes to visa rules affect thousands of families, students and workers in New Zealand. This page collects our reporting on immigration policy, residence and citizenship, and the cases where employers were penalised for exploiting migrant workers.',
      'Rules change often. Always check current requirements with Immigration New Zealand before you apply, and use a licensed adviser if you need help.',
    ],
    match: /(visas?\b|immigra|\bresidence\b|\bresidency\b|migrants?\b|migration|citizenship|work permit|\bINZ\b|deport|overstayer)/i,
    exclude: /\b(spain|ceuta|canada)\b/i,
    categories: ['immigration'],
    sections: [
      { title: 'Migrant worker exploitation', match: /(exploit|fined|ordered to pay|penalis|banned from hiring|demanding)/i },
      { title: 'Fraud and enforcement', match: /(fraud|deport|overstayer|unlicensed|convicted|tribunal|investigation)/i },
      { title: 'Visa and citizenship rules', match: /(visas?\b|resident|citizenship|INZ|immigration (nz|new zealand)|changes|rules|overhaul|policy|platform)/i },
    ],
    links: [
      { label: 'NZ visa and immigration guide', href: '/immigration' },
      { label: 'Visitor visa NZ', href: '/visitor-visa-nz' },
      { label: 'NZ citizenship guide', href: '/nz-citizenship' },
      { label: 'Jobs in New Zealand', href: '/jobs-in-new-zealand' },
      { label: 'Immigration New Zealand', href: 'https://www.immigration.govt.nz', external: true },
    ],
    articleNote: 'Visa changes, residence and citizenship rules, and migrant worker cases.',
  },
  {
    slug: 'cost-of-living',
    name: 'Cost of living in New Zealand',
    kicker: 'Cost of living',
    description: 'Cost of living news for New Zealand households: interest rates and the OCR, mortgages, grocery and supermarket prices, petrol and power bills, rates and rent.',
    intro: [
      'From mortgage rates to the price of petrol and groceries, this page follows the costs that matter most to New Zealand households, and what the Reserve Bank, the Government and the parties are doing about them.',
      'Use our free calculators to see how changes in pay, tax and KiwiSaver affect your own budget.',
    ],
    match: /(cost of living|cost-of-living|grocer|supermarkets?|foodstuffs|woolworths|\brents?\b|renters|mortgage|petrol|fuel price|inflation|\bOCR\b|interest rates?|power bills?|electricity prices?|rates cap|council rates|food prices|affordab)/i,
    exclude: /\b(australians?)\b/i,
    sections: [
      { title: 'Interest rates and mortgages', match: /(\bOCR\b|interest rates?|mortgage|reserve bank|property)/i },
      { title: 'Groceries and supermarkets', match: /(grocer|supermarkets?|foodstuffs|woolworths|kiwimart|food prices)/i },
      { title: 'Fuel, power and rates', match: /(petrol|fuel|power|electricity|rates cap|council rates)/i },
    ],
    links: [
      { label: 'NZ PAYE calculator', href: '/nz-paye-calculator' },
      { label: 'Minimum wage NZ', href: '/minimum-wage' },
      { label: 'KiwiSaver calculator', href: '/nz-kiwisaver-calculator' },
      { label: 'Rates rebate calculator', href: '/nz-rates-rebate-calculator' },
      { label: 'Tenancy and rent guide', href: '/nz-tenancy-rent-guide' },
    ],
    articleNote: 'Interest rates, groceries, fuel and power: what is happening to household costs.',
  },
  {
    slug: 'festivals',
    name: 'Festivals and celebrations in New Zealand',
    kicker: 'Festivals',
    description: 'Festival and celebration news and event listings from communities across New Zealand: Diwali, Navratri and Garba, Durga Puja, Chhath, Holi, Eid, Matariki, Lunar New Year and more.',
    intro: [
      'New Zealand’s communities mark dozens of festivals through the year, from Matariki and Lunar New Year to Diwali, Eid and Holi. This page gathers our coverage of the celebrations, community events and the people who organise them.',
      'Organising an event? Contact the newsroom to have it listed.',
    ],
    match: /(diwali|deepavali|navratri|garba|durga puja|\bholi\b|chhath|ganesh|\beid\b|lunar new year|matariki|onam|pongal|vaisakhi|baisakhi|bathukamma|dasara|dussehra|janmashtami|raksha bandhan|annakut)/i,
    exclude: /(petrol|coroner|shah rukh|rail network)/i,
    links: [
      { label: 'Public holidays NZ', href: '/public-holidays' },
      { label: 'School holidays NZ', href: '/school-holidays-nz' },
      { label: 'Community news', href: '/category/communities' },
      { label: 'Contact the newsroom', href: '/contact' },
    ],
    articleNote: 'Celebrations and community events from across New Zealand.',
  },
];

export function getTopic(slug: string) {
  return TOPICS.find(t => t.slug === slug) || null;
}

type MatchInput = { title: string; published_at?: string | null; categorySlugs?: string[] };

export function storyMatchesTopic(topic: Topic, story: MatchInput) {
  if (topic.since && story.published_at && story.published_at < topic.since) return false;
  if (topic.categories?.some(c => story.categorySlugs?.includes(c))) return true;
  if (!topic.match.test(story.title)) return false;
  return !(topic.exclude && topic.exclude.test(story.title));
}

/** The hub an article belongs to (first match wins), for the link shown on the story. */
export function topicForStory(story: MatchInput) {
  return TOPICS.find(t => storyMatchesTopic(t, story)) || null;
}

export type TopicStory = Story & { categorySlugs: string[] };

const topicStoryFields = 'id,title,slug,excerpt,published_at,featured_media_id,article_type,is_homepage_hero,is_featured,is_editor_pick,robots_index,media:media!articles_featured_media_id_fkey(public_url,alt_text),article_categories(category:category_id(slug))';

/** Every indexable published story, newest first (read in pages: Supabase caps a request at 1,000 rows). */
const getAllStories = cache(async (): Promise<TopicStory[]> => {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const out: TopicStory[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await supabase.from('articles').select(topicStoryFields).eq('status', 'published').not('published_at', 'is', null).lte('published_at', now).order('published_at', { ascending: false }).order('id', { ascending: true }).range(from, from + 999);
    if (error) { console.error('Topic stories failed:', error.message); break; }
    for (const row of (data || []) as any[]) {
      if (!row.slug || row.robots_index === false) continue;
      out.push({ ...row, categorySlugs: (row.article_categories || []).map((x: any) => x.category?.slug).filter(Boolean) });
    }
    if (!data || data.length < 1000) break;
  }
  return out;
});

export async function getTopicStories(topic: Topic) {
  const all = await getAllStories();
  return all.filter(s => storyMatchesTopic(topic, s));
}

/** Splits a hub's stories into its sections (first matching section wins); the rest go last. */
export function groupTopicStories(topic: Topic, stories: TopicStory[]) {
  const sections = (topic.sections || []).map(s => ({ title: s.title, stories: [] as TopicStory[] }));
  const rest: TopicStory[] = [];
  for (const story of stories) {
    const index = (topic.sections || []).findIndex(s => s.match.test(story.title));
    if (index >= 0) sections[index].stories.push(story); else rest.push(story);
  }
  return { sections: sections.filter(s => s.stories.length), rest };
}
