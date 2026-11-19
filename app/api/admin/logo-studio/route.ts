import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isReviewerRole } from '@/lib/admin-auth';
import { deleteAllForUser, deleteJob } from '@/lib/logo-studio';

export const runtime = 'nodejs';

/** Super admins and editors only. */
async function reviewer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  return profile?.is_active && isReviewerRole(profile.role) ? user : null;
}

/**
 * Newsroom moderation of Add Your Logo uploads.
 *   { action: 'delete', id }               remove one photo
 *   { action: 'block', userId }            block the account and delete everything it made
 *   { action: 'unblock', userId }          let the account use the tool again
 */
export async function POST(req: Request) {
  const me = await reviewer();
  if (!me) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const uuid = /^[0-9a-f-]{36}$/i;
  if (body.action === 'delete' && uuid.test(body.id)) {
    const ok = await deleteJob(body.id);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Already gone.' }, { status: 404 });
  }
  if ((body.action === 'block' || body.action === 'unblock') && uuid.test(body.userId)) {
    if (body.userId === me.id) return NextResponse.json({ error: 'You cannot block your own account.' }, { status: 422 });
    const db = createAdminClient();
    if (body.action === 'unblock') {
      await db.from('logo_studio_blocked').delete().eq('user_id', body.userId);
      return NextResponse.json({ ok: true });
    }
    await db.from('logo_studio_blocked').upsert({ user_id: body.userId, blocked_by: me.id });
    const removed = await deleteAllForUser(body.userId);
    return NextResponse.json({ ok: true, removed });
  }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
