import { AdminHeader,AdminShell } from '../../../components/admin/AdminShell';
import AdManager from '../../../components/admin/AdManager';
import { getAdsAdmin } from '../../../lib/admin-data';
export default async function Ads(){const d=await getAdsAdmin();return <AdminShell active="Advertisements"><AdminHeader title="Advertising" description="Create campaigns, choose creative artwork and place ads across Webfit News."/><AdManager {...d}/></AdminShell>;}
