import { NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase-server';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.redirect(new URL('/admin/login',req.url));
  const {data:p}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
  if(!p?.is_active||p.role!=='super_admin')return NextResponse.json({error:'Super Admin permission required'},{status:403});
  const {id}=await params; const form=await req.formData(); const action=String(form.get('action')||'');
  const is_active=action==='enable';
  const {error}=await supabase.from('redirects').update({is_active}).eq('id',id);
  if(error)return NextResponse.json({error:error.message},{status:400});
  await supabase.from('audit_log').insert({actor_id:user.id,action:`redirect.${is_active?'enable':'disable'}`,entity_type:'redirect',entity_id:id});
  return NextResponse.redirect(new URL('/admin/redirects',req.url),303);
}
