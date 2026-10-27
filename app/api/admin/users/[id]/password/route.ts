import { NextResponse } from 'next/server';
import { generatePassword } from '@/lib/supabase-admin';
import { audit, superAdminContext } from '@/lib/user-admin';

/** Give an account a new password (Super Admin only). The new password is shown once to share. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const c = await superAdminContext(); if ('error' in c) return c.error;
  const { id } = await params;
  const password = generatePassword();
  const { error } = await c.admin.auth.admin.updateUserById(id, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await audit(c.admin, c.user.id, 'profile.reset_password', id, {});
  return NextResponse.json({ password });
}
