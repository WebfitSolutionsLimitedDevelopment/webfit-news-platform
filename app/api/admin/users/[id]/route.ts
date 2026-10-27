import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { ROLES, audit, freeAuthorSlug, superAdminContext } from '@/lib/user-admin';

const Patch = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  role: z.enum(ROLES).optional(),
  is_active: z.boolean().optional(),
  title: z.string().trim().max(80).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});

/**
 * Change an account's details (Super Admin only). Name, photo, email and mobile
 * are set here by the newsroom; reporters cannot change them themselves.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await superAdminContext(); if ('error' in c) return c.error;
  const { id } = await params;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Check the details and try again.' }, { status: 422 });
  const input = parsed.data;

  const { data: target } = await c.admin.from('profiles').select('id,role,is_active,email,display_name').eq('id', id).maybeSingle();
  if (!target) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

  const role = input.role ?? target.role;
  const active = input.is_active ?? target.is_active;
  if (id === c.user.id && (!active || role !== 'super_admin')) {
    return NextResponse.json({ error: 'You cannot disable or demote your own Super Admin account.' }, { status: 400 });
  }
  if (target.role === 'super_admin' && target.is_active && (role !== 'super_admin' || !active)) {
    const { count } = await c.admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'super_admin').eq('is_active', true);
    if ((count || 0) <= 1) return NextResponse.json({ error: 'At least one active Super Admin must remain.' }, { status: 400 });
  }

  if (input.email && input.email !== target.email) {
    const { error } = await c.admin.auth.admin.updateUserById(id, { email: input.email, email_confirm: true });
    if (error) return NextResponse.json({ error: /already|exists/i.test(error.message) ? 'Another account already uses that email.' : error.message }, { status: 400 });
  }
  // A disabled account is signed out everywhere and cannot sign back in.
  if (input.is_active === false) await c.admin.auth.admin.updateUserById(id, { ban_duration: '876000h' });
  if (input.is_active === true) await c.admin.auth.admin.updateUserById(id, { ban_duration: 'none' });

  const profileChanges: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name) profileChanges.display_name = input.name;
  if (input.email) profileChanges.email = input.email;
  if (input.phone !== undefined) profileChanges.phone = input.phone || null;
  if (input.role) profileChanges.role = input.role;
  if (input.is_active !== undefined) profileChanges.is_active = input.is_active;
  if (input.avatar_url !== undefined) profileChanges.avatar_url = input.avatar_url;
  const { error: profileError } = await c.admin.from('profiles').update(profileChanges).eq('id', id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

  // Keep their byline in step.
  const authorChanges: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name) authorChanges.name = input.name;
  if (input.email) authorChanges.email = input.email;
  if (input.title !== undefined) authorChanges.title = input.title || null;
  if (input.avatar_url !== undefined) authorChanges.avatar_url = input.avatar_url;
  if (input.is_active !== undefined) authorChanges.is_active = input.is_active;
  const { data: author } = await c.admin.from('authors').select('id').eq('profile_id', id).maybeSingle();
  if (author) {
    await c.admin.from('authors').update(authorChanges).eq('id', author.id);
  } else if (role !== 'ad_manager') {
    const name = input.name || target.display_name || target.email || 'Reporter';
    await c.admin.from('authors').insert({ ...authorChanges, profile_id: id, name, slug: await freeAuthorSlug(c.admin, name), email: input.email || target.email, is_active: active });
  }

  await audit(c.admin, c.user.id, 'profile.update', id, { ...input, avatar_url: input.avatar_url ? 'changed' : input.avatar_url });
  revalidatePath('/[slug]', 'page');
  revalidatePath('/author/[slug]', 'page');
  return NextResponse.json({ ok: true });
}
