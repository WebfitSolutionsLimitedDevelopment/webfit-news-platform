import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adAdminContext } from '@/lib/ad-admin';

const optionalId = z.string().uuid().nullable().optional();
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional().transform(v => v || null);

const Input = z.object({
  campaign_id: z.string().uuid(),
  format: z.enum(['image', 'video']).default('image'),
  media_id: optionalId,
  mobile_media_id: optionalId,
  video_media_id: optionalId,
  poster_media_id: optionalId,
  headline: optionalText(160),
  destination_url: z.string().trim().url().refine(v => /^https?:\/\//i.test(v), 'Use a full web address starting with https://'),
  alt_text: optionalText(240),
  cta_label: optionalText(40),
  is_election_ad: z.boolean().default(false),
  promoter_statement: optionalText(300),
  authorisation_reference: optionalText(300),
}).superRefine((v, ctx) => {
  if (v.format === 'image' && !v.media_id) ctx.addIssue({ code: 'custom', path: ['media_id'], message: 'Upload the desktop artwork.' });
  if (v.format === 'video' && !v.video_media_id) ctx.addIssue({ code: 'custom', path: ['video_media_id'], message: 'Upload the MP4 video.' });
  if (v.is_election_ad && !v.promoter_statement) ctx.addIssue({ code: 'custom', path: ['promoter_statement'], message: 'Election ads need a promoter statement.' });
});

export async function POST(req: Request) {
  const c = await adAdminContext();
  if (!c) return NextResponse.json({ error: 'Advertising permission required' }, { status: 403 });
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || 'Check the creative details.';
    return NextResponse.json({ error: first, details: parsed.error.flatten() }, { status: 422 });
  }
  const { data, error } = await c.supabase.from('ad_creatives').insert(parsed.data).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await c.supabase.from('audit_log').insert({ actor_id: c.user.id, action: 'ad_creative.create', entity_type: 'ad_creative', entity_id: data.id, metadata: { campaign_id: data.campaign_id, format: data.format } });
  return NextResponse.json({ creative: data }, { status: 201 });
}
