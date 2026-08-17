import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase-server';

async function context(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const {data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
  if(!profile?.is_active||profile.role!=='super_admin')return null;
  return {supabase,user};
}

export async function GET(){
  const c=await context();
  if(!c)return NextResponse.json({error:'Super Admin required'},{status:403});
  const tables=['articles','categories','tags','media','pages','article_categories','article_tags','article_inline_media'];
  const counts:any={};
  for(const table of tables){
    const {count}=await c.supabase.from(table).select('*',{count:'exact',head:true});
    counts[table]=count||0;
  }
  const [{count:pending},{count:migrated},{count:skipped},{count:failed},{data:setting}]=await Promise.all([
    c.supabase.from('media').select('*',{count:'exact',head:true}).eq('migration_status','pending'),
    c.supabase.from('media').select('*',{count:'exact',head:true}).eq('migration_status','migrated'),
    c.supabase.from('media').select('*',{count:'exact',head:true}).eq('migration_status','skipped'),
    c.supabase.from('media').select('*',{count:'exact',head:true}).eq('migration_status','failed'),
    c.supabase.from('site_settings').select('value').eq('key','archive_import').maybeSingle(),
  ]);
  return NextResponse.json({
    counts,
    media:{pending:pending||0,migrated:migrated||0,skipped:skipped||0,failed:failed||0},
    archive:setting?.value||{locked:true,completed:true,legacy_videos_optional:true},
  },{headers:{'cache-control':'no-store'}});
}

export async function POST(){
  return NextResponse.json({error:'Historical archive import is permanently read-only in the production CMS.'},{status:410});
}
