import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../lib/supabase-server';

const Input = z.object({
  edition_key: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lead_article_id: z.string().uuid().nullable(),
  teaser_article_ids: z.array(z.string().uuid()).max(3),
  editor_note: z.string().trim().max(1200).nullable(),
  note_author: z.string().trim().max(80).nullable(),
});

/** Save the editor's choices for one weekly edition (editors and super admins; RLS checks can_publish too). */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  const { data: p } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (!p?.is_active || !['super_admin', 'editor'].includes(p.role)) return NextResponse.json({ error: 'Editor permission required' }, { status: 403 });
  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Please check the form.' }, { status: 422 });
  const v = parsed.data;
  const row = { ...v, editor_note: v.editor_note || null, note_author: v.note_author || null, updated_by: user.id, updated_at: new Date().toISOString() };
  const { error } = await supabase.from('epaper_front').upsert(row, { onConflict: 'edition_key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.from('audit_log').insert({ actor_id: user.id, action: 'epaper_front.save', entity_type: 'epaper_front', entity_id: null, metadata: { edition_key: v.edition_key } });
  return NextResponse.json({ ok: true });
}
