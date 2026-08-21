import { redirect } from 'next/navigation';
import { createClient } from './supabase-server';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,email,display_name,role,is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_active) redirect('/admin/login?error=not-authorized');
  return { supabase, user, profile };
}

export async function requirePublisher() {
  const session = await requireAdmin();
  if (!['super_admin','editor'].includes(session.profile.role)) {
    throw new Error('You do not have publishing permission.');
  }
  return session;
}
