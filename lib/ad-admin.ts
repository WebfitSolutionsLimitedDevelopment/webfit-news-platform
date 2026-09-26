import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';

/** Signed-in staff who may manage advertising, or null. */
export async function adAdminContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (!p?.is_active || !['super_admin', 'editor', 'ad_manager'].includes(p.role)) return null;
  return { supabase, user };
}

/** Cached public pages pick up ad changes straight away instead of after their 60 second cache. */
export function refreshAdPages() {
  try {
    revalidatePath('/');
    revalidatePath('/category/[slug]', 'page');
  } catch {}
}
