import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit/i;

/**
 * Counts the click, then sends the reader to the advertiser. The destination
 * comes from the database, never from the query string, so this cannot be
 * used as an open redirect.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const assignment = url.searchParams.get('a') || '';
  const home = new URL('/', url.origin);
  if (!UUID.test(assignment)) return NextResponse.redirect(home, 302);

  const ua = req.headers.get('user-agent') || '';
  const device = /mobile|iphone|android/i.test(ua) ? 'mobile' : 'desktop';
  const supabase = await createClient();
  let destination: string | null = null;

  if (BOT.test(ua)) {
    const { data } = await supabase.rpc('get_live_ads');
    destination = Array.isArray(data) ? (data as any[]).find(ad => ad.assignment_id === assignment)?.destination_url ?? null : null;
  } else {
    const { data } = await supabase.rpc('record_ad_event', { p_assignment: assignment, p_event: 'click', p_device: device });
    destination = typeof data === 'string' ? data : null;
  }

  if (!destination || !/^https?:\/\//i.test(destination)) return NextResponse.redirect(home, 302);
  const res = NextResponse.redirect(destination, 302);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
