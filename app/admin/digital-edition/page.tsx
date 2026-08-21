import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import IssueManager from '../../../components/admin/IssueManager';
import { getIssuesAdmin } from '../../../lib/admin-data';
export default async function DigitalEdition(){const issues=await getIssuesAdmin();return <AdminShell active="Digital Edition"><AdminHeader title="Digital Edition" description="Manage the current newspaper issue and archive."/><IssueManager issues={issues}/></AdminShell>}
