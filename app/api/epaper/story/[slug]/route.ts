import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase-public';
import { htmlToBlocks } from '@/lib/epaper-text';

/**
 * One published story, as plain blocks, for the e-paper's story view (StoryReader).
 * Public data only, cached at the edge for 5 minutes.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,200}$/i.test(slug)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const supabase = await createPublicClient();
  const { data, error } = await supabase.from('articles')
    .select('title,slug,published_at,content_html,author:author_id(name),media:media!articles_featured_media_id_fkey(public_url,alt_text,width,height)')
    .eq('status', 'published').eq('slug', slug).maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const row = data as any;
  const body = {
    title: row.title as string,
    slug: row.slug as string,
    publishedAt: row.published_at as string,
    author: row.author?.name || null,
    image: row.media?.public_url || null,
    imageAlt: row.media?.alt_text || row.title,
    imageRatio: row.media?.width && row.media?.height ? row.media.width / row.media.height : null,
    blocks: htmlToBlocks(row.content_html, row.title),
  };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
}
