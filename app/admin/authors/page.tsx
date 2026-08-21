import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import AuthorManager from '../../../components/admin/AuthorManager';
import { getAuthorsAdmin } from '../../../lib/admin-data';

export default async function AuthorsPage() {
  const authors = await getAuthorsAdmin();
  return <AdminShell active="Authors">
    <AdminHeader title="Authors" description="Manage bylines, bios and newsroom contributor profiles used across Webfit News." />
    <AuthorManager authors={authors as any[]} />
  </AdminShell>;
}
