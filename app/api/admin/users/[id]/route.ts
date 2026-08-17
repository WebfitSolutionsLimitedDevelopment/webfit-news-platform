import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase-server';

const roles=['super_admin','editor','journalist','contributor','ad_manager'];

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.redirect(new URL('/admin/login',req.url));

  const {data:actor}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
  if(!actor?.is_active||actor.role!=='super_admin')return NextResponse.json({error:'Super Admin permission required'},{status:403});

  const {id}=await params;
  const form=await req.formData();
  const role=String(form.get('role')||'');
  const is_active=String(form.get('is_active'))==='true';
  if(!roles.includes(role))return NextResponse.json({error:'Invalid role'},{status:422});

  const {data:target}=await supabase.from('profiles').select('role,is_active').eq('id',id).maybeSingle();
  if(!target)return NextResponse.json({error:'User profile not found'},{status:404});

  if(id===user.id && (!is_active || role!=='super_admin')) {
    return NextResponse.json({error:'You cannot disable or demote your own Super Admin account.'},{status:400});
  }

  const removingActiveSuperAdmin = target.is_active && target.role==='super_admin' && (!is_active || role!=='super_admin');
  if(removingActiveSuperAdmin){
    const {count}=await supabase.from('profiles').select('*',{count:'exact',head:true}).eq('role','super_admin').eq('is_active',true);
    if((count||0)<=1){
      return NextResponse.json({error:'At least one active Super Admin must remain.'},{status:400});
    }
  }

  const {error}=await supabase.from('profiles').update({role,is_active,updated_at:new Date().toISOString()}).eq('id',id);
  if(error)return NextResponse.json({error:error.message},{status:400});

  await supabase.from('audit_log').insert({actor_id:user.id,action:'profile.update_role',entity_type:'profile',entity_id:id,metadata:{role,is_active}});
  return NextResponse.redirect(new URL('/admin/users?updated=1',req.url),303);
}
