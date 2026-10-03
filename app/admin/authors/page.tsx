import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import AuthorManager from '../../../components/admin/AuthorManager';
import { getAuthorsAdmin } from '../../../lib/admin-data';
import { createClient } from '../../../lib/supabase-server';

export default async function AuthorsPage() {
  const supabase = await createClient();
  const [authors, { data: { user } }] = await Promise.all([getAuthorsAdmin(), supabase.auth.getUser()]);
  return <AdminShell active="Authors">
    <AdminHeader title="Authors" description="Bylines, bios and photos for Webfit News reporters. Named bylines with a bio help readers and Google trust a story." />
    <AuthorManager authors={authors as any[]} currentUserId={user?.id || ''} />
  </AdminShell>;
}
