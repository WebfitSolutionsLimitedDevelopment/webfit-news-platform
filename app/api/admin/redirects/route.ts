import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase-server';

function normalizePath(value:string){
  const v=value.trim();
  if(!v)return '';
  try { const u=new URL(v); return u.pathname + u.search; } catch {}
  return v.startsWith('/')?v:`/${v}`;
}

export async function POST(req:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.redirect(new URL('/admin/login',req.url));
  const {data:p}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
  if(!p?.is_active||!['super_admin','editor'].includes(p.role))return NextResponse.json({error:'Editor permission required'},{status:403});
  const form=await req.formData();
  const source_path=normalizePath(String(form.get('source_path')||''));
  const destination_path=normalizePath(String(form.get('destination_path')||''));
  const status_code=Number(form.get('status_code')||301);
  if(!source_path||!destination_path||source_path===destination_path)return NextResponse.json({error:'Invalid redirect paths'},{status:422});
  if(![301,302,307,308].includes(status_code))return NextResponse.json({error:'Invalid status code'},{status:422});
  const {data,error}=await supabase.from('redirects').upsert({source_path,destination_path,status_code,source:'cms',is_active:true},{onConflict:'source_path'}).select('id').single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  await supabase.from('audit_log').insert({actor_id:user.id,action:'redirect.upsert',entity_type:'redirect',entity_id:data.id,metadata:{source_path,destination_path,status_code}});
  return NextResponse.redirect(new URL('/admin/redirects?created=1',req.url),303);
}
