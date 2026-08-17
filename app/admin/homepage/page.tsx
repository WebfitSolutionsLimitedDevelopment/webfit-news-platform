import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import HomepageManager from '../../../components/admin/HomepageManager';
import { createClient } from '../../../lib/supabase-server';

export default async function Homepage(){
 const supabase=await createClient();
 const [{data:sections,error},{data:articles}]=await Promise.all([
   supabase.from('homepage_sections').select('id,key,title,section_type,is_enabled,sort_order,max_items,category:category_id(name,slug),slots:homepage_slots(id,position,article:article_id(id,title,slug,published_at))').order('sort_order'),
   supabase.from('articles').select('id,title,slug,published_at').eq('status','published').order('published_at',{ascending:false}).limit(250)
 ]);
 if(error) throw error;
 return <AdminShell active="Homepage"><AdminHeader title="Homepage" description="Control the front page hierarchy without changing code."/><HomepageManager initialSections={(sections||[]) as any} articles={(articles||[]) as any}/></AdminShell>
}
