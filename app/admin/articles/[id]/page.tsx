import { notFound } from 'next/navigation';
import ArticleWorkspace from '../../../../components/admin/ArticleWorkspace';
import { createClient } from '../../../../lib/supabase-server';

export default async function EditArticle({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();
  const [{data:article},{data:categories},{data:authors},{data:revisions}]=await Promise.all([
    supabase.from('articles').select('*,media:media!articles_featured_media_id_fkey(id,public_url,alt_text,filename,width,height),article_categories(category_id,is_primary),article_tags(tag_id,tags(name,slug))').eq('id',id).maybeSingle(),
    supabase.from('categories').select('id,name').eq('is_active',true).order('name'),
    supabase.from('authors').select('id,name').eq('is_active',true).order('name'),
    supabase.from('article_revisions').select('id,title,created_at').eq('article_id',id).order('created_at',{ascending:false}).limit(20)
  ]);
  if(!article)notFound();
  const rows=(article.article_categories||[]) as Array<{category_id:string;is_primary:boolean}>;
  const primary=rows.find(row=>row.is_primary)?.category_id||'';
  const tags=(article.article_tags||[]).map((row:any)=>row.tags?.name).filter(Boolean);
  return <ArticleWorkspace article={article} categories={categories||[]} authors={authors||[]} revisions={revisions||[]} initialCategoryIds={rows.map(row=>row.category_id)} initialPrimaryCategoryId={primary} initialTags={tags} initialMedia={(article as any).media||null}/>;
}
