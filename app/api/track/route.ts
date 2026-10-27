import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';

/**
 * First-party readership analytics (see components/ReadTracker.tsx).
 * POST {k:'view', ...} records a page view and returns its id;
 * POST {k:'time', ...} adds reading time and scroll depth to that view.
 * Nothing personal is stored: no IP address, only a random browser ID.
 */
const View = z.object({
  k: z.literal('view'),
  p: z.string().max(300),
  v: z.string().uuid(),
  r: z.boolean(),
  ref: z.string().max(200).optional(),
  utm: z.string().max(60).optional(),
  d: z.enum(['mobile', 'tablet', 'desktop']),
});
const Time = z.object({
  k: z.literal('time'),
  id: z.string().uuid(),
  v: z.string().uuid(),
  t: z.number().int().min(0).max(36000),
  s: z.number().int().min(0).max(100),
});

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp\/|curl|wget|python|monitor|pingdom/i;

function host(ref?: string) {
  if (!ref) return null;
  try { return new URL(ref).hostname.replace(/^www\./, ''); } catch { return null; }
}

export async function POST(req: Request) {
  if (BOT.test(req.headers.get('user-agent') || '')) return new NextResponse(null, { status: 204 });
  let body: unknown;
  try { body = JSON.parse(await req.text()); } catch { return new NextResponse(null, { status: 400 }); }
  const supabase = await createClient();

  const time = Time.safeParse(body);
  if (time.success) {
    await supabase.rpc('update_page_view', { p_id: time.data.id, p_visitor: time.data.v, p_seconds: time.data.t, p_scroll: time.data.s });
    return new NextResponse(null, { status: 204 });
  }

  const view = View.safeParse(body);
  if (!view.success) return new NextResponse(null, { status: 400 });
  const { data } = await supabase.rpc('record_page_view', {
    p_path: view.data.p,
    p_visitor: view.data.v,
    p_returning: view.data.r,
    p_referrer_host: host(view.data.ref),
    p_utm: view.data.utm || null,
    p_device: view.data.d,
    p_country: req.headers.get('x-vercel-ip-country'),
  });
  return NextResponse.json({ id: data ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}
