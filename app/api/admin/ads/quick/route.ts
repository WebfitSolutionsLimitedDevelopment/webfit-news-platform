import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adAdminContext, nzEndOfDay, nzStartOfDay, refreshAdPages } from '@/lib/ad-admin';

const Input = z.object({
  name: z.string().trim().min(2, 'Give the ad a name.').max(120),
  format: z.enum(['image', 'video']),
  media_id: z.string().uuid().nullable().optional(),
  video_media_id: z.string().uuid().nullable().optional(),
  destination_url: z.string().trim().max(500).optional().transform(v => v || ''),
  expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose an expiry date.'),
  // Optional first day: book ahead. Empty or today = live straight away.
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).transform(v => v || null),
  // Optional button under the poster in the e-paper, e.g. "Book now".
  cta_label: z.string().trim().max(30).optional().transform(v => v || null),
  placements: z.array(z.object({ key: z.string(), device: z.enum(['all', 'desktop', 'mobile']) })).min(1, 'Choose at least one place for the ad.'),
  is_election_ad: z.boolean().default(false),
  promoter_statement: z.string().trim().max(300).optional().transform(v => v || null),
}).superRefine((v, ctx) => {
  if (v.destination_url && !/^https?:\/\/\S+\.\S+/i.test(v.destination_url)) ctx.addIssue({ code: 'custom', message: 'The link must be a full web address starting with https://' });
  if (v.format === 'image' && !v.media_id) ctx.addIssue({ code: 'custom', message: 'Upload the image first.' });
  if (v.format === 'video' && !v.video_media_id) ctx.addIssue({ code: 'custom', message: 'Upload the video first.' });
  if (v.is_election_ad && !v.promoter_statement) ctx.addIssue({ code: 'custom', message: 'Election ads need a promoter statement.' });
  if (v.starts_on && v.starts_on > v.expires_on) ctx.addIssue({ code: 'custom', message: 'The first day must be on or before the last day.' });
});

/**
 * One-step ad: creates the campaign, creative and placements together, all
 * ending at midnight NZ time on the expiry date.
 */
export async function POST(req: Request) {
  const c = await adAdminContext();
  if (!c) return NextResponse.json({ error: 'Advertising permission required' }, { status: 403 });
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Check the ad details.' }, { status: 422 });
  const v = parsed.data;
  const endsAt = nzEndOfDay(v.expires_on);
  if (new Date(endsAt).getTime() <= Date.now()) return NextResponse.json({ error: 'The expiry date has already passed. Pick a later date.' }, { status: 422 });
  const startsAt = v.starts_on ? nzStartOfDay(v.starts_on) : null;
  const scheduled = Boolean(startsAt && new Date(startsAt).getTime() > Date.now());

  const { data: slots, error: slotError } = await c.supabase.from('ad_slots').select('id,key').in('key', v.placements.map(p => p.key)).eq('is_active', true);
  if (slotError || !slots?.length) return NextResponse.json({ error: 'Those positions are not available.' }, { status: 422 });

  const { data: campaign, error: campError } = await c.supabase.from('ad_campaigns')
    .insert({ advertiser_name: v.name, campaign_name: v.name, status: 'active', starts_at: scheduled ? startsAt : null, ends_at: endsAt, notes: 'Created with Quick ad' })
    .select('id').single();
  if (campError) return NextResponse.json({ error: campError.message }, { status: 400 });

  const { data: creative, error: crError } = await c.supabase.from('ad_creatives').insert({
    campaign_id: campaign.id, format: v.format, media_id: v.media_id ?? null, video_media_id: v.video_media_id ?? null,
    headline: v.name, destination_url: v.destination_url, alt_text: v.name, cta_label: v.cta_label, is_election_ad: v.is_election_ad, promoter_statement: v.promoter_statement,
  }).select('id').single();
  if (crError) {
    await c.supabase.from('ad_campaigns').delete().eq('id', campaign.id);
    return NextResponse.json({ error: crError.message }, { status: 400 });
  }

  const byKey = new Map(slots.map(s => [s.key, s.id]));
  const rows = v.placements.filter(p => byKey.has(p.key)).map(p => ({ slot_id: byKey.get(p.key)!, creative_id: creative.id, device: p.device, starts_at: scheduled ? startsAt : null, ends_at: endsAt, priority: 100, is_active: true }));
  const { error: asError } = await c.supabase.from('ad_assignments').insert(rows);
  if (asError) {
    await c.supabase.from('ad_campaigns').delete().eq('id', campaign.id);
    return NextResponse.json({ error: asError.message }, { status: 400 });
  }

  await c.supabase.from('audit_log').insert({ actor_id: c.user.id, action: 'ad_quick.create', entity_type: 'ad_campaign', entity_id: campaign.id, metadata: { name: v.name, starts_on: v.starts_on, expires_on: v.expires_on, placements: v.placements } });
  refreshAdPages();
  return NextResponse.json({ campaign_id: campaign.id }, { status: 201 });
}
