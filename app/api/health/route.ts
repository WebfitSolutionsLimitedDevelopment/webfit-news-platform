import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      service: 'webfit-news',
      database: 'reachable',
      published_articles: count ?? 0,
      response_ms: Date.now() - started,
    }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      service: 'webfit-news',
      database: 'unavailable',
      response_ms: Date.now() - started,
    }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
