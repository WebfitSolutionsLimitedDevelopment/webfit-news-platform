import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import AuthorManager from '../../../components/admin/AuthorManager';
import { getAuthorsAdmin } from '../../../lib/admin-data';
import Link from 'next/link';
import { requireAdmin } from '../../../lib/admin-auth';

export default async function AuthorsPage() {
  const { user, profile } = await requireAdmin();
  const authors = await getAuthorsAdmin();
  return <AdminShell active="Authors">
    <AdminHeader title="Authors" description="Bylines, bios and photos for Webfit News reporters. Named bylines with a bio help readers and Google trust a story." actions={profile.role === 'super_admin' ? <Link className="admin-primary" href="/admin/users?new=volunteer">Set up volunteer login</Link> : undefined} />
    <AuthorManager authors={authors as any[]} currentUserId={user?.id || ''} />
  </AdminShell>;
}
