import { notFound } from 'next/navigation';
import ArticleWorkspace, { type ReviewEvent } from '../../../../components/admin/ArticleWorkspace';
import { sanitizeArticleHtml } from '@/lib/article-html';
import { createAdminClient } from '../../../../lib/supabase-admin';
import { requireAdmin, isWriterRole } from '../../../../lib/admin-auth';

export default async function EditArticle({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const { supabase, user, profile } = await requireAdmin();
  const volunteer = profile.role === 'volunteer';
  const writer = isWriterRole(profile.role);
  let articleQuery = supabase.from('articles').select('*,media:media!articles_featured_media_id_fkey(id,public_url,alt_text,caption,filename,width,height,uploaded_by),article_categories(category_id,is_primary),article_tags(tag_id,tags(name,slug))').eq('id',id);
  if(writer) articleQuery=articleQuery.eq('created_by',user.id);
  let authorQuery = supabase.from('authors').select('id,name,title,avatar_url,profile_id').eq('is_active',true);
  if(volunteer) authorQuery=authorQuery.eq('profile_id',user.id);
  const [{data:article},{data:categories},{data:authors},{data:revisions},{data:reviews}]=await Promise.all([
    articleQuery.maybeSingle(),
    supabase.from('categories').select('id,name').eq('is_active',true).order('name'),
    authorQuery.order('name'),
    supabase.from('article_revisions').select('id,title,created_at').eq('article_id',id).order('created_at',{ascending:false}).limit(20),
    supabase.from('article_reviews').select('action,note,created_at,actor_id').eq('article_id',id).order('created_at',{ascending:false}).limit(30),
  ]);
  // Reporters only ever get their own stories (row security); anything else is "not found".
  if(!article || (writer && article.created_by !== user.id))notFound();

  // Names for the review history (reviewers' profiles are private, so look them up on the server).
  const actorIds=[...new Set([...(reviews||[]).map(r=>r.actor_id), article.created_by].filter(Boolean))] as string[];
  let names=new Map<string,string>();
  if(actorIds.length){
    try{
      const {data:people}=await createAdminClient().from('profiles').select('id,display_name').in('id',actorIds);
      names=new Map((people||[]).map(p=>[p.id,p.display_name||'']));
    }catch{}
  }
  const reviewTrail:ReviewEvent[]=(reviews||[]).map(r=>({action:r.action as ReviewEvent['action'],note:r.note,created_at:r.created_at,actor:r.actor_id?names.get(r.actor_id)||null:null}));

  const rows=(article.article_categories||[]) as Array<{category_id:string;is_primary:boolean}>;
  const primary=rows.find(row=>row.is_primary)?.category_id||'';
  const tags=(article.article_tags||[]).map((row:any)=>row.tags?.name).filter(Boolean);
  const byline=(authors||[]).find(a=>a.id===article.author_id)||null;
  const mine=(authors||[]).find(a=>user&&a.profile_id===user.id)||null;
  return <ArticleWorkspace
    article={{...article,content_html:sanitizeArticleHtml(article.content_html||'')}} categories={categories||[]}
    authors={(authors||[]).map(({id,name,title,avatar_url})=>({id,name,title,avatar_url}))}
    revisions={revisions||[]} initialCategoryIds={rows.map(row=>row.category_id)} initialPrimaryCategoryId={primary}
    initialTags={tags} initialMedia={(article as any).media||null}
    volunteerId={volunteer ? user.id : undefined} mode={writer?'writer':'reviewer'} reviewTrail={reviewTrail} reviewNote={article.review_note||null}
    submittedBy={article.created_by?names.get(article.created_by)||byline?.name||null:null}
    myByline={mine?{name:mine.name,title:mine.title,avatar_url:mine.avatar_url}:null}
  />;
}
