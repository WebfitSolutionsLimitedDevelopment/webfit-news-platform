import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adAdminContext, refreshAdPages } from '@/lib/ad-admin';

const Input = z.object({
  is_active: z.boolean().optional(),
  priority: z.number().int().min(1).max(1000).optional(),
  device: z.enum(['all', 'desktop', 'mobile']).optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  end_now: z.boolean().optional(),
});

/** Pause, resume, re-weight or end a placement. Ending keeps its statistics. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await adAdminContext();
  if (!c) return NextResponse.json({ error: 'Advertising permission required' }, { status: 403 });
  const { id } = await params;
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid change' }, { status: 422 });
  const { end_now, ...patch } = parsed.data;
  const update = end_now ? { ...patch, is_active: false, ends_at: new Date().toISOString() } : patch;
  const { data, error } = await c.supabase.from('ad_assignments').update(update).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await c.supabase.from('audit_log').insert({ actor_id: c.user.id, action: 'ad_assignment.update', entity_type: 'ad_assignment', entity_id: id, metadata: update });
  refreshAdPages();
  return NextResponse.json({ assignment: data });
}
