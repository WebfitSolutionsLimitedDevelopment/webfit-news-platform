import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import SettingsForm from '../../../components/admin/SettingsForm';
import { requireAdmin } from '../../../lib/admin-auth';

export default async function Settings(){
  const {supabase}=await requireAdmin();
  const {data}=await supabase.from('site_settings').select('key,value').in('key',['publication','seo','trust']);
  const map:any={}; for(const row of data||[]) map[row.key]=row.value;
  return <AdminShell active="Settings"><AdminHeader title="Settings" description="Publication identity, SEO defaults and newsroom trust configuration."/><SettingsForm initial={{publication:map.publication||{},seo:map.seo||{},trust:map.trust||{}}}/></AdminShell>
}
