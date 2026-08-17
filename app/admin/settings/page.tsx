import { AdminHeader,AdminShell } from '../../../components/admin/AdminShell';
import SettingsForm from '../../../components/admin/SettingsForm';
import { requireAdmin } from '../../../lib/admin-auth';

export default async function Settings(){
  const {supabase}=await requireAdmin();
  const {data}=await supabase.from('site_settings').select('key,value').in('key',['publication','seo','trust','social_links']);
  const map:any={};for(const row of data||[])map[row.key]=row.value;
  return <AdminShell active="Settings"><AdminHeader title="Settings" description="Control publication identity, social channels, SEO and editorial trust."/><SettingsForm initial={{publication:map.publication||{},seo:map.seo||{},trust:map.trust||{},social:map.social_links||{}}}/></AdminShell>;
}
