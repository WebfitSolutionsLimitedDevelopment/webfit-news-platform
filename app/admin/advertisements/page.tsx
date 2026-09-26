import { AdminHeader,AdminShell } from '../../../components/admin/AdminShell';
import AdManager from '../../../components/admin/AdManager';
import { getAdsAdmin } from '../../../lib/admin-data';
export default async function Ads(){const d=await getAdsAdmin();return <AdminShell active="Advertisements"><AdminHeader title="Advertising" description="Upload an ad, name it, set the last day. It goes live straight away and comes down by itself."/><AdManager {...d}/></AdminShell>;}
