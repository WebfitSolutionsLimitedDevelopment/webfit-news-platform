import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../lib/supabase-server';

const Slot = z.object({ position: z.number().int().min(1).max(30), article_id: z.string().uuid().nullable() });
const Section = z.object({ id: z.string().uuid(), is_enabled: z.boolean(), max_items: z.number().int().min(1).max(30), slots: z.array(Slot).default([]) });
const Payload = z.object({ sections: z.array(Section) });

async function context(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return null;
  const {data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
  if(!profile?.is_active || !['super_admin','editor'].includes(profile.role)) return null;
  return {supabase,user};
}

export async function PATCH(req:Request){
  const ctx=await context();
  if(!ctx) return NextResponse.json({error:'Editor permission required'},{status:403});
  const parsed=Payload.safeParse(await req.json());
  if(!parsed.success) return NextResponse.json({error:parsed.error.flatten()},{status:422});

  for(const section of parsed.data.sections){
    const {error:sectionError}=await ctx.supabase.from('homepage_sections').update({is_enabled:section.is_enabled,max_items:section.max_items,updated_at:new Date().toISOString()}).eq('id',section.id);
    if(sectionError) return NextResponse.json({error:sectionError.message},{status:400});

    const {error:deleteError}=await ctx.supabase.from('homepage_slots').delete().eq('section_id',section.id);
    if(deleteError) return NextResponse.json({error:deleteError.message},{status:400});
    const rows=section.slots.filter(x=>x.article_id).map(x=>({section_id:section.id,article_id:x.article_id!,position:x.position}));
    if(rows.length){
      const {error:slotError}=await ctx.supabase.from('homepage_slots').insert(rows);
      if(slotError) return NextResponse.json({error:slotError.message},{status:400});
    }
  }

  await ctx.supabase.from('audit_log').insert({actor_id:ctx.user.id,action:'homepage.update',entity_type:'homepage',metadata:{sections:parsed.data.sections.length}});
  return NextResponse.json({ok:true});
}
