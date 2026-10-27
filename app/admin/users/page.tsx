import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import UserManager, { type ManagedUser } from '../../../components/admin/UserManager';
import { requireAdmin } from '../../../lib/admin-auth';

export default async function UsersPage() {
  const { supabase, user, profile } = await requireAdmin();
  const canManage = profile.role === 'super_admin';
  const [{ data: profiles, error }, { data: authors }, { data: work }] = await Promise.all([
    supabase.from('profiles').select('id,email,display_name,role,is_active,phone,avatar_url,created_at').order('created_at', { ascending: true }),
    supabase.from('authors').select('profile_id,title,avatar_url,slug').not('profile_id', 'is', null),
    supabase.from('articles').select('created_by,status').not('created_by', 'is', null).limit(10000),
  ]);
  if (error) throw error;
  const authorBy = new Map((authors || []).map(a => [a.profile_id, a]));
  const counts = new Map<string, { drafts: number; submitted: number; published: number }>();
  for (const row of work || []) {
    const c = counts.get(row.created_by) || { drafts: 0, submitted: 0, published: 0 };
    if (row.status === 'draft') c.drafts += 1; else if (row.status === 'in_review') c.submitted += 1; else if (row.status === 'published') c.published += 1;
    counts.set(row.created_by, c);
  }
  const users: ManagedUser[] = (profiles || []).map(p => {
    const a = authorBy.get(p.id);
    return {
      ...p, title: a?.title || null, avatar_url: a?.avatar_url || p.avatar_url || null, author_slug: a?.slug || null,
      ...(counts.get(p.id) || { drafts: 0, submitted: 0, published: 0 }),
    } as ManagedUser;
  }).sort((a, b) => Number(b.is_active) - Number(a.is_active));

  return <AdminShell active="Users">
    <AdminHeader title="Users & reporters" description="Create logins for reporters and staff, set their name, photo, email and mobile, and control what they can do."/>
    <UserManager users={users} currentUserId={user.id} canManage={canManage}/>
  </AdminShell>;
}
