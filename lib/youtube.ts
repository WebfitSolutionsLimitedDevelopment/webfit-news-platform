import { XMLParser } from 'fast-xml-parser';

// webfitNews channel. Override with YOUTUBE_CHANNEL_ID if the channel ever changes.
const DEFAULT_CHANNEL_ID = 'UCE-frNq8CFHJZezgMueooCQ';
const REVALIDATE = 600; // seconds: new uploads appear within ~10 minutes

export type YoutubeFeedVideo = {
  youtube_id: string;
  title: string;
  published_at: string;
  video_url: string;
  is_short: boolean;
};

const channelId = () => process.env.YOUTUBE_CHANNEL_ID?.trim() || DEFAULT_CHANNEL_ID;

function isoDurationSeconds(iso: string | undefined) {
  const m = iso?.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  return (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0));
}

// Primary source: YouTube Data API v3. Needs YOUTUBE_API_KEY.
// Cost: 2 quota units per refresh (~290/day at a 10-minute refresh) against a free 10,000/day.
async function fromDataApi(key: string): Promise<YoutubeFeedVideo[]> {
  const uploads = 'UU' + channelId().slice(2); // every channel's uploads playlist
  const listRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=30&playlistId=${uploads}&key=${key}`,
    { next: { revalidate: REVALIDATE, tags: ['youtube-feed'] } },
  );
  if (!listRes.ok) throw new Error(`playlistItems ${listRes.status}: ${(await listRes.text()).slice(0, 200)}`);
  const list = await listRes.json() as { items?: { contentDetails?: { videoId?: string } }[] };
  const ids = (list.items || []).map((i) => i.contentDetails?.videoId).filter(Boolean) as string[];
  if (!ids.length) return [];

  const vidRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${ids.join(',')}&key=${key}`,
    { next: { revalidate: REVALIDATE, tags: ['youtube-feed'] } },
  );
  if (!vidRes.ok) throw new Error(`videos ${vidRes.status}: ${(await vidRes.text()).slice(0, 200)}`);
  const vids = await vidRes.json() as { items?: any[] };

  return (vids.items || [])
    .filter((v) => v.status?.privacyStatus === 'public' && v.snippet?.liveBroadcastContent !== 'upcoming')
    .map((v) => {
      const text = `${v.snippet?.title || ''} ${v.snippet?.description || ''}`.toLowerCase();
      const seconds = isoDurationSeconds(v.contentDetails?.duration);
      const live = v.snippet?.liveBroadcastContent === 'live';
      return {
        youtube_id: String(v.id),
        title: String(v.snippet?.title || '').trim(),
        published_at: String(v.snippet?.publishedAt || ''),
        video_url: `https://www.youtube.com/watch?v=${v.id}`,
        // Shorts can't be flagged directly by the API; very short clips or #shorts tags are treated as Shorts.
        is_short: !live && ((seconds > 0 && seconds <= 60) || text.includes('#shorts')),
      };
    })
    .filter((v) => v.youtube_id && v.title);
}

// Fallback: public RSS feed. No key, but YouTube often returns 404/500 to server IPs.
async function fromRss(): Promise<YoutubeFeedVideo[]> {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId()}`, {
    next: { revalidate: REVALIDATE, tags: ['youtube-feed'] },
  });
  if (!res.ok) throw new Error(`rss ${res.status}`);
  const parsed = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', parseTagValue: false }).parse(await res.text());
  const raw = parsed?.feed?.entry;
  const entries: any[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return entries
    .map((e) => {
      const id = String(e['yt:videoId'] || '');
      const link = Array.isArray(e.link) ? e.link[0]?.href : e.link?.href;
      const href = String(link || `https://www.youtube.com/watch?v=${id}`);
      return { youtube_id: id, title: String(e.title || '').trim(), published_at: String(e.published || ''), video_url: href, is_short: href.includes('/shorts/') };
    })
    .filter((v) => v.youtube_id && v.title);
}

export async function getChannelFeed(): Promise<YoutubeFeedVideo[]> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (key) {
    try {
      const videos = await fromDataApi(key);
      if (videos.length) return videos;
      console.warn('[youtube] Data API returned no videos, trying RSS');
    } catch (err) {
      console.warn('[youtube] Data API failed, trying RSS:', (err as Error).message);
    }
  } else {
    console.warn('[youtube] YOUTUBE_API_KEY not set, using RSS only');
  }
  try {
    const videos = await fromRss();
    if (!videos.length) console.warn('[youtube] RSS returned no videos, homepage falls back to CMS');
    return videos;
  } catch (err) {
    console.warn('[youtube] RSS failed, homepage falls back to CMS:', (err as Error).message);
    return [];
  }
}
