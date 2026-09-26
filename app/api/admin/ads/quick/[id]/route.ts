import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adAdminContext, nzEndOfDay, refreshAdPages } from '@/lib/ad-admin';

const Input = z.object({
  paused: z.boolean().optional(),
  expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/** Pause, resume or change the expiry of a whole ad (campaign + all its placements). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await adAdminContext();
  if (!c) return NextResponse.json({ error: 'Advertising permission required' }, { status: 403 });
  const { id } = await params;
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid change' }, { status: 422 });
  const { paused, expires_on } = parsed.data;

  const campaignPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (paused !== undefined) campaignPatch.status = paused ? 'paused' : 'active';
  let endsAt: string | undefined;
  if (expires_on) {
    endsAt = nzEndOfDay(expires_on);
    campaignPatch.ends_at = endsAt;
    if (paused === undefined && new Date(endsAt).getTime() > Date.now()) campaignPatch.status = 'active';
  }
  const { error } = await c.supabase.from('ad_campaigns').update(campaignPatch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (endsAt) {
    const { data: creatives } = await c.supabase.from('ad_creatives').select('id').eq('campaign_id', id);
    const ids = (creatives || []).map(x => x.id);
    if (ids.length) await c.supabase.from('ad_assignments').update({ ends_at: endsAt, is_active: true }).in('creative_id', ids);
  }

  await c.supabase.from('audit_log').insert({ actor_id: c.user.id, action: 'ad_quick.update', entity_type: 'ad_campaign', entity_id: id, metadata: parsed.data });
  refreshAdPages();
  return NextResponse.json({ ok: true });
}

/** Remove the ad completely, including its figures. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await adAdminContext();
  if (!c) return NextResponse.json({ error: 'Advertising permission required' }, { status: 403 });
  const { id } = await params;
  const { error } = await c.supabase.from('ad_campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await c.supabase.from('audit_log').insert({ actor_id: c.user.id, action: 'ad_quick.delete', entity_type: 'ad_campaign', entity_id: id, metadata: {} });
  refreshAdPages();
  return NextResponse.json({ ok: true });
}
