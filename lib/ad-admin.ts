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
    revalidatePath('/[slug]', 'page');
    revalidatePath('/epaper');
    revalidatePath('/epaper/[edition]', 'page');
  } catch {}
}

/** "2026-11-30" -> midnight at the start of that day in New Zealand, as an ISO timestamp. */
export function nzStartOfDay(date: string): string {
  return new Date(new Date(nzEndOfDay(date)).getTime() - (24 * 3600 - 1) * 1000).toISOString();
}

/** "2026-11-30" -> the last second of that day in New Zealand, as an ISO timestamp. */
export function nzEndOfDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));
  const offsetLabel = new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', timeZoneName: 'longOffset' })
    .formatToParts(guess).find(p => p.type === 'timeZoneName')?.value || 'GMT+12:00';
  const match = offsetLabel.match(/GMT([+-])(\d{2}):(\d{2})/);
  const minutes = match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 720;
  return new Date(guess.getTime() - minutes * 60_000).toISOString();
}
