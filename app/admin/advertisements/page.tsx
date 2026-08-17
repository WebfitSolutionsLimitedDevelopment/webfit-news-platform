import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import AdManager from '../../../components/admin/AdManager';
import { getAdsAdmin } from '../../../lib/admin-data';
export default async function Ads(){const d=await getAdsAdmin();return <AdminShell active="Advertisements"><AdminHeader title="Advertisements" description="Create campaigns and control Webfit News advertising inventory."/><AdManager campaigns={d.campaigns} slots={d.slots}/></AdminShell>}
