import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adAdminContext, refreshAdPages } from '@/lib/ad-admin';

const Input = z.object({
  slot_ids: z.array(z.string().uuid()).min(1, 'Choose at least one position.').optional(),
  slot_id: z.string().uuid().optional(),
  creative_id: z.string().uuid(),
  device: z.enum(['all', 'desktop', 'mobile']).default('all'),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  priority: z.number().int().min(1).max(1000).default(100),
  is_active: z.boolean().default(true),
}).refine(v => v.slot_ids?.length || v.slot_id, { message: 'Choose at least one position.' });

export async function POST(req: Request) {
  const c = await adAdminContext();
  if (!c) return NextResponse.json({ error: 'Advertising permission required' }, { status: 403 });
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid placement' }, { status: 422 });
  const { slot_ids, slot_id, ...rest } = parsed.data;
  const slots = slot_ids?.length ? slot_ids : [slot_id!];
  if (rest.starts_at && rest.ends_at && new Date(rest.ends_at) <= new Date(rest.starts_at)) {
    return NextResponse.json({ error: 'The end date must be after the start date.' }, { status: 422 });
  }
  const rows = slots.map(id => ({ ...rest, slot_id: id }));
  const { data, error } = await c.supabase.from('ad_assignments').insert(rows).select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await c.supabase.from('audit_log').insert((data || []).map(a => ({ actor_id: c.user.id, action: 'ad_assignment.create', entity_type: 'ad_assignment', entity_id: a.id, metadata: { slot_id: a.slot_id, creative_id: a.creative_id, device: a.device } })));
  refreshAdPages();
  return NextResponse.json({ assignments: data }, { status: 201 });
}
