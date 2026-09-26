import { NextResponse } from 'next/server';
import { adAdminContext, refreshAdPages } from '@/lib/ad-admin';

/** Deletes a creative, its placements and their statistics. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await adAdminContext();
  if (!c) return NextResponse.json({ error: 'Advertising permission required' }, { status: 403 });
  const { id } = await params;
  const { error } = await c.supabase.from('ad_creatives').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await c.supabase.from('audit_log').insert({ actor_id: c.user.id, action: 'ad_creative.delete', entity_type: 'ad_creative', entity_id: id, metadata: {} });
  refreshAdPages();
  return NextResponse.json({ ok: true });
}
