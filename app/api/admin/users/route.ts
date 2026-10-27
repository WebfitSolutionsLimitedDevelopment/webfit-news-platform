import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePassword } from '@/lib/supabase-admin';
import { ROLES, audit, freeAuthorSlug, superAdminContext } from '@/lib/user-admin';

const Input = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(30).optional().nullable(),
  role: z.enum(ROLES),
  title: z.string().trim().max(80).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  password: z.string().min(8).max(72).optional().nullable(),
});

/** Create a newsroom login (Super Admin only). Reporters and editors also get their byline. */
export async function POST(req: Request) {
  const c = await superAdminContext(); if ('error' in c) return c.error;
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Check the name (2+ letters), email and role.' }, { status: 422 });
  const input = parsed.data;
  const password = input.password || generatePassword();

  const { data: created, error } = await c.admin.auth.admin.createUser({
    email: input.email, password, email_confirm: true, user_metadata: { display_name: input.name },
  });
  if (error || !created.user) {
    const msg = /already|registered|exists/i.test(error?.message || '') ? 'An account with this email already exists.' : (error?.message || 'Could not create the account.');
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const id = created.user.id;

  // The sign-up trigger makes an inactive "contributor" profile; set it up properly.
  const { error: profileError } = await c.admin.from('profiles').upsert({
    id, email: input.email, display_name: input.name, role: input.role, phone: input.phone || null,
    avatar_url: input.avatar_url || null, is_active: true, updated_at: new Date().toISOString(),
  });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

  if (input.role !== 'ad_manager') {
    const slug = await freeAuthorSlug(c.admin, input.name);
    await c.admin.from('authors').insert({
      profile_id: id, name: input.name, slug, email: input.email, title: input.title || null,
      avatar_url: input.avatar_url || null, is_active: true,
    });
  }

  await audit(c.admin, c.user.id, 'profile.create', id, { email: input.email, role: input.role });
  return NextResponse.json({ id, email: input.email, password }, { status: 201 });
}
