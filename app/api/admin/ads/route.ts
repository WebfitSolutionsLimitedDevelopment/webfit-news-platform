import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../lib/supabase-server';

const Input = z.object({
  advertiser_name: z.string().trim().min(2),
  campaign_name: z.string().trim().min(2),
  status: z.enum(['draft','active','paused','ended']).default('draft'),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

async function context(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const {data:p}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
  if(!p?.is_active||!['super_admin','editor','ad_manager'].includes(p.role))return null;
  return {supabase,user};
}

export async function POST(req:Request){
  const c=await context();
  if(!c)return NextResponse.json({error:'Advertising permission required'},{status:403});
  const parsed=Input.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:422});
  const {data,error}=await c.supabase.from('ad_campaigns').insert(parsed.data).select('*').single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  await c.supabase.from('audit_log').insert({actor_id:c.user.id,action:'ad_campaign.create',entity_type:'ad_campaign',entity_id:data.id,metadata:{campaign_name:data.campaign_name}});
  return NextResponse.json({campaign:data},{status:201});
}
