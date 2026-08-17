import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../../lib/supabase-server';

const Patch = z.object({
  title: z.string().min(5).optional(), subtitle: z.string().nullable().optional(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), excerpt: z.string().nullable().optional(), content_html: z.string().optional(),
  status: z.enum(['draft','in_review','scheduled','published','archived']).optional(), article_type: z.enum(['news','breaking_news','analysis','opinion','editorial','explainer','feature','interview','community','press_release']).optional(),
  author_id: z.string().uuid().nullable().optional(), featured_media_id: z.string().uuid().nullable().optional(), published_at: z.string().datetime().nullable().optional(), scheduled_at: z.string().datetime().nullable().optional(),
  is_breaking: z.boolean().optional(), is_featured: z.boolean().optional(), is_editor_pick: z.boolean().optional(), is_homepage_hero: z.boolean().optional(), seo_title: z.string().nullable().optional(), meta_description: z.string().nullable().optional(), canonical_url: z.string().nullable().optional(), social_title: z.string().nullable().optional(), social_description: z.string().nullable().optional()
});

async function ctx() {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) return null;
  const {data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle(); if(!profile?.is_active) return null;
  return {supabase,user,profile};
}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const c=await ctx();if(!c)return NextResponse.json({error:'Unauthorized'},{status:401});const {id}=await params;const {data,error}=await c.supabase.from('articles').select('*,article_categories(category_id,is_primary),article_tags(tag_id,tags(name,slug))').eq('id',id).single();if(error)return NextResponse.json({error:error.message},{status:404});return NextResponse.json({article:data});}
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){const c=await ctx();if(!c)return NextResponse.json({error:'Unauthorized'},{status:401});const {id}=await params;const p=Patch.safeParse(await req.json());if(!p.success)return NextResponse.json({error:p.error.flatten()},{status:422});if(p.data.status&&['published','scheduled'].includes(p.data.status)&&!['super_admin','editor'].includes(c.profile.role))return NextResponse.json({error:'Publishing permission required'},{status:403});if(p.data.status==='scheduled'&&!p.data.scheduled_at)return NextResponse.json({error:'A schedule date and time is required.'},{status:422});const changes:any={...p.data};if(p.data.status==='published'&&!p.data.published_at)changes.published_at=new Date().toISOString();const {data,error}=await c.supabase.from('articles').update(changes).eq('id',id).select('id,slug,status').single();if(error)return NextResponse.json({error:error.message},{status:400});await c.supabase.from('audit_log').insert({actor_id:c.user.id,action:'article.update',entity_type:'article',entity_id:id,metadata:{fields:Object.keys(changes)}});return NextResponse.json({article:data});}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){const c=await ctx();if(!c)return NextResponse.json({error:'Unauthorized'},{status:401});if(c.profile.role!=='super_admin')return NextResponse.json({error:'Super admin required'},{status:403});const {id}=await params;const {error}=await c.supabase.from('articles').delete().eq('id',id);if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({ok:true});}
