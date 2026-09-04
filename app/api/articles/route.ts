import { NextResponse } from 'next/server';
import { getLatestStories } from '../../../lib/news';

// Public, unauthenticated endpoint used by the iOS/Android apps to power a
// native "Saved for offline" reading list. Returns only published stories.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 30;

  try {
    const stories = await getLatestStories(limit);
    const articles = stories.map(s => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      excerpt: s.excerpt,
      published_at: s.published_at,
      article_type: s.article_type,
      image: s.media?.public_url || null,
      image_alt: s.media?.alt_text || null,
    }));
    return NextResponse.json({ articles });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load articles' }, { status: 500 });
  }
}
