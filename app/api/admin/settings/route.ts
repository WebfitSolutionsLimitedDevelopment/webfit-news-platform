import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../lib/supabase-server';

const Schema=z.object({
  publication:z.object({site_name:z.string().min(1),primary_domain:z.string().url(),tagline:z.string().max(220),contact_email:z.union([z.string().email(),z.literal('')])}),
  seo:z.object({default_meta_title:z.string().max(120),default_social_description:z.string().max(400),google_analytics_id:z.string().max(40)}),
  trust:z.object({display_media_council:z.boolean(),corrections_slug:z.string().min(1).max(80),editorial_policy_slug:z.string().min(1).max(80)}),
  social:z.object({facebook:z.union([z.string().url(),z.literal('')]),instagram:z.union([z.string().url(),z.literal('')]),youtube:z.union([z.string().url(),z.literal('')]),linkedin:z.union([z.string().url(),z.literal('')]),x:z.union([z.string().url(),z.literal('')]),tiktok:z.union([z.string().url(),z.literal('')])})
});

export async function POST(req:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:'Authentication required'},{status:401});
  const {data:p}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
  if(!p?.is_active||p.role!=='super_admin')return NextResponse.json({error:'Super Admin permission required'},{status:403});
  const parsed=Schema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:'Invalid settings',details:parsed.error.flatten()},{status:422});

  const {publication,seo,trust,social}=parsed.data;
  const now=new Date().toISOString();
  const rows=[
    {key:'publication',value:publication,updated_at:now,updated_by:user.id},
    {key:'seo',value:seo,updated_at:now,updated_by:user.id},
    {key:'trust',value:trust,updated_at:now,updated_by:user.id},
    // Public-safe mirrors consumed by the publication shell.
    {key:'site_identity',value:{name:publication.site_name,domain:new URL(publication.primary_domain).hostname,tagline:publication.tagline},updated_at:now,updated_by:user.id},
    {key:'seo_defaults',value:{site_name:publication.site_name,default_locale:'en_NZ',default_title_suffix:` | ${publication.site_name}`},updated_at:now,updated_by:user.id},
    {key:'footer',value:{copyright_name:publication.site_name,media_council_member:trust.display_media_council},updated_at:now,updated_by:user.id},
    {key:'social_links',value:social,updated_at:now,updated_by:user.id},
  ];
  const {error}=await supabase.from('site_settings').upsert(rows,{onConflict:'key'});
  if(error)return NextResponse.json({error:error.message},{status:400});
  await supabase.from('audit_log').insert({actor_id:user.id,action:'settings.update',entity_type:'site_settings',metadata:{keys:rows.map(r=>r.key)}});
  return NextResponse.json({ok:true});
}
