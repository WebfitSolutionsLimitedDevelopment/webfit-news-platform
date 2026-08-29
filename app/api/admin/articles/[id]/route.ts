import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../../lib/supabase-server';
import { revalidateEditorialContent } from '../../../../../lib/editorial-revalidate';
import { sanitizeArticleHtml } from '../../../../../lib/article-html';
import { sendPushToAllDevices } from '../../../../../lib/push-notifications';
import { getSiteUrl } from '../../../../../lib/env';

const Patch = z.object({
  title:z.string().min(5).optional(),
  subtitle:z.string().nullable().optional(),
  slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt:z.string().nullable().optional(),
  content_html:z.string().optional(),
  status:z.enum(['draft','in_review','scheduled','published','archived']).optional(),
  article_type:z.enum(['news','breaking_news','analysis','opinion','editorial','explainer','feature','interview','community','press_release']).optional(),
  author_id:z.string().uuid().nullable().optional(),
  featured_media_id:z.string().uuid().nullable().optional(),
  published_at:z.string().datetime().nullable().optional(),
  scheduled_at:z.string().datetime().nullable().optional(),
  is_breaking:z.boolean().optional(),
  is_featured:z.boolean().optional(),
  is_editor_pick:z.boolean().optional(),
  is_homepage_hero:z.boolean().optional(),
  seo_title:z.string().nullable().optional(),
  meta_description:z.string().nullable().optional(),
  canonical_url:z.string().nullable().optional(),
  social_title:z.string().nullable().optional(),
  social_description:z.string().nullable().optional(),
  category_ids:z.array(z.string().uuid()).optional(),
  primary_category_id:z.string().uuid().nullable().optional(),
  tag_names:z.array(z.string().trim().min(1)).optional()
});

async function ctx(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const {data:profile}=await supabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();
  if(!profile?.is_active)return null;
  return{supabase,user,profile};
}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const c=await ctx();
  if(!c)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {id}=await params;
  const {data,error}=await c.supabase.from('articles').select('*,media:media!articles_featured_media_id_fkey(id,public_url,alt_text,filename,width,height),article_categories(category_id,is_primary),article_tags(tag_id,tags(name,slug))').eq('id',id).single();
  if(error)return NextResponse.json({error:error.message},{status:404});
  return NextResponse.json({article:data});
}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const c=await ctx();
  if(!c)return NextResponse.json({error:'Unauthorized'},{status:401});
  const {id}=await params;
  const p=Patch.safeParse(await req.json());
  if(!p.success)return NextResponse.json({error:p.error.flatten()},{status:422});
  if(p.data.status&&['published','scheduled'].includes(p.data.status)&&!['super_admin','editor'].includes(c.profile.role))return NextResponse.json({error:'Publishing permission required'},{status:403});
  if(p.data.status==='scheduled'&&!p.data.scheduled_at)return NextResponse.json({error:'A schedule date and time is required.'},{status:422});

  const {data:before}=await c.supabase.from('articles').select('slug,status').eq('id',id).maybeSingle();

  const {category_ids,primary_category_id,tag_names,...articleChanges}=p.data;
  const changes:any={...articleChanges};
  if(typeof articleChanges.content_html==='string') changes.content_html=sanitizeArticleHtml(articleChanges.content_html);
  if(p.data.status==='published'&&!p.data.published_at)changes.published_at=new Date().toISOString();

  const {data,error}=await c.supabase.from('articles').update(changes).eq('id',id).select('id,slug,status').single();
  if(error)return NextResponse.json({error:error.message},{status:400});

  if(category_ids!==undefined||primary_category_id!==undefined){
    const cats=Array.from(new Set([...(category_ids||[]),...(primary_category_id?[primary_category_id]:[])]));
    const {error:clearError}=await c.supabase.from('article_categories').delete().eq('article_id',id);
    if(clearError)return NextResponse.json({error:clearError.message},{status:400});
    if(cats.length){
      const {error:catError}=await c.supabase.from('article_categories').insert(cats.map(category_id=>({article_id:id,category_id,is_primary:category_id===primary_category_id})));
      if(catError)return NextResponse.json({error:catError.message},{status:400});
    }
  }

  if(tag_names!==undefined){
    const {error:clearTagError}=await c.supabase.from('article_tags').delete().eq('article_id',id);
    if(clearTagError)return NextResponse.json({error:clearTagError.message},{status:400});
    for(const raw of tag_names){
      const name=raw.trim();
      if(!name)continue;
      const tagSlug=name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      if(!tagSlug)continue;
      const {data:tag,error:tagError}=await c.supabase.from('tags').upsert({name,slug:tagSlug},{onConflict:'slug'}).select('id').single();
      if(tagError)return NextResponse.json({error:tagError.message},{status:400});
      if(tag){
        const {error:linkError}=await c.supabase.from('article_tags').upsert({article_id:id,tag_id:tag.id},{onConflict:'article_id,tag_id'});
        if(linkError)return NextResponse.json({error:linkError.message},{status:400});
      }
    }
  }

  await c.supabase.from('audit_log').insert({actor_id:c.user.id,action:'article.update',entity_type:'article',entity_id:id,metadata:{fields:Object.keys(p.data)}});

  // Purge the public ISR cache immediately so changed featured images and
  // story metadata are visible on every device as soon as the CMS save ends.
  revalidateEditorialContent(before?.slug,data.slug);

  // Only notify phones the moment an article newly goes live, not on every
  // later edit to an already-published story.
  if(data.status==='published'&&before?.status!=='published'){
    const {data:full}=await c.supabase.from('articles').select('title,excerpt').eq('id',id).maybeSingle();
    if(full?.title) void sendPushToAllDevices(full.title, full.excerpt||'Read the full story on Webfit News.', `${getSiteUrl()}/${data.slug}`);
  }

  return NextResponse.json({article:data});
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  const c=await ctx();
  if(!c)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(c.profile.role!=='super_admin')return NextResponse.json({error:'Super admin required'},{status:403});
  const {id}=await params;
  const {error}=await c.supabase.from('articles').delete().eq('id',id);
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true});
}
