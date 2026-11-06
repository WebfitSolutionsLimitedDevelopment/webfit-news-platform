import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePassword } from '@/lib/supabase-admin';
import { ROLES, audit, freeAuthorSlug, superAdminContext } from '@/lib/user-admin';

const Input = z.object({
  name: z.string().trim().min(2).max(80),
  byline_name: z.string().trim().max(80).optional(),
  existing_author_id: z.string().uuid().optional(),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(30).optional().nullable(),
  role: z.enum(ROLES),
  title: z.string().trim().max(80).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  password: z.string().min(8).max(72).refine(value => Buffer.byteLength(value, 'utf8') <= 72).optional().nullable(),
});

/** Create a newsroom login (Super Admin only). Reporters and editors also get their byline. */
export async function POST(req: Request) {
  const c = await superAdminContext(); if ('error' in c) return c.error;
  const { admin } = c;
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Check the name, email, access and password. Use at least 8 characters for a custom password.' }, { status: 422 });
  const input = parsed.data;
  const password = input.password || generatePassword();

  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email, password, email_confirm: true, user_metadata: { display_name: input.name },
  });
  if (error || !created.user) {
    const msg = /already|registered|exists/i.test(error?.message || '') ? 'An account with this email already exists.' : (error?.message || 'Could not create the account.');
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const id = created.user.id;

  let authorId: string | undefined;
  let linkedExisting = false;
  async function cleanup() {
    if (authorId) {
      if (linkedExisting) await admin.from('authors').update({ profile_id: null }).eq('id', authorId).eq('profile_id', id);
      else await admin.from('authors').delete().eq('id', authorId);
    }
    const { error: cleanupError } = await admin.auth.admin.deleteUser(id);
    if (cleanupError) console.error('[newsroom] Could not roll back inactive account creation', { id });
  }

  // The signup trigger creates an inactive profile. Link the byline before enabling the login.
  if (input.role !== 'ad_manager') {
    const name = input.byline_name || input.name;
    linkedExisting = input.role === 'volunteer' && !!input.existing_author_id;
    const result = linkedExisting
      ? await admin.from('authors').update({ profile_id: id }).eq('id', input.existing_author_id!)
        .is('profile_id', null).eq('is_active', true).select('id').maybeSingle()
      : await admin.from('authors').insert({
        profile_id: id, name, slug: await freeAuthorSlug(admin, name), email: input.email,
        title: input.title || (input.role === 'volunteer' ? 'Media Volunteer' : null),
        avatar_url: input.avatar_url || null, is_active: true,
      }).select('id').single();
    authorId = result.data?.id;
    if (result.error || !authorId) {
      await cleanup();
      return NextResponse.json({ error: linkedExisting ? 'That author is unavailable or already has a login.' : 'Could not create the byline. Try again.' }, { status: 400 });
    }
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id, email: input.email, display_name: input.name, role: input.role, phone: input.phone || null,
    avatar_url: input.avatar_url || null, is_active: true, updated_at: new Date().toISOString(),
  });
  if (profileError) {
    await cleanup();
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  await audit(admin, c.user.id, 'profile.create', id, { email: input.email, role: input.role });
  return NextResponse.json({ id, email: input.email, password }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
