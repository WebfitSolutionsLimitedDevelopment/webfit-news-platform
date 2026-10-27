import { NextResponse } from 'next/server';
import { createClient } from './supabase-server';
import { createAdminClient } from './supabase-admin';

export const ROLES = ['super_admin', 'editor', 'contributor', 'journalist', 'ad_manager'] as const;

/** Only an active Super Admin may create or change newsroom accounts. */
export async function superAdminContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }) };
  const { data: actor } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (!actor?.is_active || actor.role !== 'super_admin') return { error: NextResponse.json({ error: 'Only a Super Admin can manage accounts.' }, { status: 403 }) };
  let admin;
  try { admin = createAdminClient(); } catch (e: any) { return { error: NextResponse.json({ error: e.message }, { status: 500 }) }; }
  return { supabase, admin, user };
}

export function slugify(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'reporter';
}

/** A free author slug: geet-g, geet-g-2, geet-g-3 ... */
export async function freeAuthorSlug(admin: ReturnType<typeof createAdminClient>, name: string, exceptId?: string) {
  const base = slugify(name);
  for (let i = 1; i < 50; i += 1) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const { data } = await admin.from('authors').select('id').eq('slug', slug).maybeSingle();
    if (!data || data.id === exceptId) return slug;
  }
  return `${base}-${Date.now()}`;
}

export async function audit(admin: ReturnType<typeof createAdminClient>, actorId: string, action: string, entityId: string, metadata: Record<string, unknown>) {
  await admin.from('audit_log').insert({ actor_id: actorId, action, entity_type: 'profile', entity_id: entityId, metadata });
}
