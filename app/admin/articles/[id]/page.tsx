import { notFound } from 'next/navigation';
import ArticleWorkspace, { type ReviewEvent } from '../../../../components/admin/ArticleWorkspace';
import { createClient } from '../../../../lib/supabase-server';
import { createAdminClient } from '../../../../lib/supabase-admin';
import { isWriterRole } from '../../../../lib/admin-auth';

export default async function EditArticle({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();
  const [{data:article},{data:categories},{data:authors},{data:revisions},{data:reviews},{data:{user}}]=await Promise.all([
    supabase.from('articles').select('*,media:media!articles_featured_media_id_fkey(id,public_url,alt_text,caption,filename,width,height),article_categories(category_id,is_primary),article_tags(tag_id,tags(name,slug))').eq('id',id).maybeSingle(),
    supabase.from('categories').select('id,name').eq('is_active',true).order('name'),
    supabase.from('authors').select('id,name,title,avatar_url,profile_id').eq('is_active',true).order('name'),
    supabase.from('article_revisions').select('id,title,created_at').eq('article_id',id).order('created_at',{ascending:false}).limit(20),
    supabase.from('article_reviews').select('action,note,created_at,actor_id').eq('article_id',id).order('created_at',{ascending:false}).limit(30),
    supabase.auth.getUser(),
  ]);
  // Reporters only ever get their own stories (row security); anything else is "not found".
  if(!article)notFound();
  const {data:me}=user?await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle():{data:null};
  const writer=isWriterRole(me?.role);

  // Names for the review history (reviewers' profiles are private, so look them up on the server).
  const actorIds=[...new Set((reviews||[]).map(r=>r.actor_id).filter(Boolean))] as string[];
  let names=new Map<string,string>();
  if(actorIds.length){
    try{
      const {data:people}=await createAdminClient().from('profiles').select('id,display_name,email').in('id',actorIds);
      names=new Map((people||[]).map(p=>[p.id,p.display_name||p.email||'']));
    }catch{}
  }
  const reviewTrail:ReviewEvent[]=(reviews||[]).map(r=>({action:r.action as ReviewEvent['action'],note:r.note,created_at:r.created_at,actor:r.actor_id?names.get(r.actor_id)||null:null}));

  const rows=(article.article_categories||[]) as Array<{category_id:string;is_primary:boolean}>;
  const primary=rows.find(row=>row.is_primary)?.category_id||'';
  const tags=(article.article_tags||[]).map((row:any)=>row.tags?.name).filter(Boolean);
  const byline=(authors||[]).find(a=>a.id===article.author_id)||null;
  const mine=(authors||[]).find(a=>user&&a.profile_id===user.id)||null;
  return <ArticleWorkspace
    article={article} categories={categories||[]}
    authors={(authors||[]).map(({id,name,title,avatar_url})=>({id,name,title,avatar_url}))}
    revisions={revisions||[]} initialCategoryIds={rows.map(row=>row.category_id)} initialPrimaryCategoryId={primary}
    initialTags={tags} initialMedia={(article as any).media||null}
    mode={writer?'writer':'reviewer'} reviewTrail={reviewTrail} reviewNote={article.review_note||null}
    submittedBy={article.created_by?byline?.name||null:null}
    myByline={mine?{name:mine.name,title:mine.title,avatar_url:mine.avatar_url}:null}
  />;
}
