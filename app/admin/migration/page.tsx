import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import MigrationManager from '../../../components/admin/MigrationManager';

export default function Migration(){
  return <AdminShell active="Archive Audit">
    <AdminHeader title="Archive Audit" description="Read-only verification of the completed historical archive transfer."/>
    <MigrationManager/>
  </AdminShell>
}
