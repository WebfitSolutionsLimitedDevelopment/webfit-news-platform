import { XMLParser } from 'fast-xml-parser';

// Public channel handle. Set YOUTUBE_CHANNEL_ID (UC...) in Vercel to skip the handle lookup.
export const YOUTUBE_HANDLE = 'webfitnews';
const FEED_REVALIDATE = 600; // seconds: new uploads appear within ~10 minutes

export type YoutubeFeedVideo = {
  youtube_id: string;
  title: string;
  published_at: string;
  video_url: string;
  is_short: boolean;
};

async function resolveChannelId(): Promise<string | null> {
  const fromEnv = process.env.YOUTUBE_CHANNEL_ID?.trim();
  if (fromEnv) return fromEnv;
  try {
    const res = await fetch(`https://www.youtube.com/@${YOUTUBE_HANDLE}`, {
      headers: { 'accept-language': 'en', 'user-agent': 'Mozilla/5.0 (compatible; WebfitNewsBot/1.0)' },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) ||
      html.match(/"externalId":"(UC[\w-]{22})"/) ||
      html.match(/"channelId":"(UC[\w-]{22})"/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

// YouTube's public RSS feed: latest 15 uploads, no API key or quota needed.
export async function getChannelFeed(): Promise<YoutubeFeedVideo[]> {
  const channelId = await resolveChannelId();
  if (!channelId) return [];
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      next: { revalidate: FEED_REVALIDATE, tags: ['youtube-feed'] },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' }).parse(xml);
    const raw = parsed?.feed?.entry;
    const entries: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return entries
      .map((e) => {
        const id = String(e['yt:videoId'] || '');
        const link = Array.isArray(e.link) ? e.link[0]?.href : e.link?.href;
        const href = String(link || `https://www.youtube.com/watch?v=${id}`);
        return {
          youtube_id: id,
          title: String(e.title || '').trim(),
          published_at: String(e.published || ''),
          video_url: href,
          is_short: href.includes('/shorts/'),
        };
      })
      .filter((v) => v.youtube_id && v.title);
  } catch {
    return [];
  }
}
