import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import CategoryManager from '../../../components/admin/CategoryManager';
import { getCategoriesAdmin } from '../../../lib/admin-data';
export default async function Categories(){const categories=await getCategoriesAdmin();return <AdminShell active="Categories"><AdminHeader title="Categories" description="Manage the publication taxonomy used by stories and homepage sections."/><CategoryManager categories={categories as any}/></AdminShell>}
