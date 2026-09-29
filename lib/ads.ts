import { cache } from 'react';
import { createPublicClient as createClient } from '@/lib/supabase-public';

export type AdDevice = 'all' | 'desktop' | 'mobile';

export type LiveAd = {
  assignment_id: string;
  slot_key: string;
  priority: number;
  device: AdDevice;
  creative_id: string;
  format: 'image' | 'video';
  headline: string | null;
  destination_url: string;
  alt_text: string | null;
  cta_label: string | null;
  is_election_ad: boolean;
  promoter_statement: string | null;
  advertiser: string | null;
  desktop_image: string | null;
  mobile_image: string | null;
  poster_image: string | null;
  video_url: string | null;
};

/** Screens at or below this width get the mobile artwork and mobile-only positions. */
export const AD_MOBILE_MAX_WIDTH = 720;

/**
 * Every ad that is live right now, grouped by position. One database call per
 * request, shared by every AdSlot on the page.
 */
export const getLiveAds = cache(async (): Promise<Record<string, LiveAd[]>> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_live_ads');
    if (error || !Array.isArray(data)) return {};
    const bySlot: Record<string, LiveAd[]> = {};
    for (const ad of data as LiveAd[]) {
      (bySlot[ad.slot_key] ||= []).push(ad);
    }
    return bySlot;
  } catch {
    return {};
  }
});

/**
 * Split sanitised article HTML into chunks after the given top-level
 * paragraph counts, so ads can sit between paragraphs. Paragraphs inside
 * blockquotes, lists, tables, figures and embeds are not counted, so an ad
 * never lands inside a quote or table.
 */
export function splitArticleHtml(html: string, afterParagraphs: number[]): string[] {
  const targets = [...new Set(afterParagraphs)].filter(n => n > 0).sort((a, b) => a - b);
  if (!targets.length || !html) return [html];

  const containerTag = /<(\/?)(blockquote|table|ul|ol|figure|div|section|aside|iframe)\b[^>]*?(\/?)>|<\/p\s*>/gi;
  const cuts: number[] = [];
  let depth = 0;
  let paragraphs = 0;
  let next = 0;
  let match: RegExpExecArray | null;

  while ((match = containerTag.exec(html)) && next < targets.length) {
    const token = match[0];
    if (/^<\/p/i.test(token)) {
      if (depth === 0) {
        paragraphs += 1;
        if (paragraphs === targets[next]) {
          cuts.push(match.index + token.length);
          next += 1;
        }
      }
      continue;
    }
    const closing = match[1] === '/';
    const selfClosing = match[3] === '/';
    if (selfClosing) continue;
    depth = Math.max(0, depth + (closing ? -1 : 1));
  }

  const chunks: string[] = [];
  let start = 0;
  for (const cut of cuts) {
    chunks.push(html.slice(start, cut));
    start = cut;
  }
  chunks.push(html.slice(start));
  return chunks;
}

/** Count top-level paragraphs, using the same rules as splitArticleHtml. */
export function countTopLevelParagraphs(html: string): number {
  return splitArticleHtml(html, Array.from({ length: 400 }, (_, i) => i + 1)).length - 1;
}
