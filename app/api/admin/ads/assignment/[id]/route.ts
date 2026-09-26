import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../../../lib/supabase-server';

const Input=z.object({
  is_active:z.boolean().optional(),
  starts_at:z.string().datetime({offset:true}).nullable().optional(),
  ends_at:z.string().datetime({offset:true}).nullable().optional(),
  priority:z.number().int().min(0).max(1000).optional()
});
async function context(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const {data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
  if(!profile?.is_active||!['super_admin','editor','ad_manager'].includes(profile.role))return null;
  return {supabase,user};
}
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const c=await context();
  if(!c)return NextResponse.json({error:'Advertising permission required'},{status:403});
  const {id}=await params;
  const parsed=Input.safeParse(await req.json().catch(()=>null));
  if(!parsed.success||!Object.keys(parsed.data||{}).length)return NextResponse.json({error:'Invalid placement update.'},{status:422});
  if(parsed.data.starts_at&&parsed.data.ends_at&&new Date(parsed.data.ends_at)<=new Date(parsed.data.starts_at)){
    return NextResponse.json({error:'The placement end time must be later than its start time.'},{status:422});
  }
  const {data,error}=await c.supabase.from('ad_assignments').update(parsed.data).eq('id',id).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  await c.supabase.from('audit_log').insert({actor_id:c.user.id,action:'ad_assignment.update',entity_type:'ad_assignment',entity_id:id,metadata:parsed.data});
  return NextResponse.json({assignment:data});
}
