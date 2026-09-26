import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';

const Input = z.object({
  a: z.string().uuid(),
  e: z.enum(['impression', 'video_start', 'video_complete']),
  d: z.enum(['desktop', 'mobile']).optional(),
});

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit/i;

export async function POST(req: Request) {
  if (BOT.test(req.headers.get('user-agent') || '')) return new NextResponse(null, { status: 204 });
  let body: unknown;
  try { body = JSON.parse(await req.text()); } catch { return new NextResponse(null, { status: 400 }); }
  const parsed = Input.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const supabase = await createClient();
  await supabase.rpc('record_ad_event', { p_assignment: parsed.data.a, p_event: parsed.data.e, p_device: parsed.data.d ?? null });
  return new NextResponse(null, { status: 204 });
}
