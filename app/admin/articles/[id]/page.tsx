import { notFound } from 'next/navigation';
import ArticleQuickEdit from '../../../../components/admin/ArticleQuickEdit';
import { createClient } from '../../../../lib/supabase-server';
export default async function EditArticle({params}:{params:Promise<{id:string}>}){const {id}=await params;const supabase=await createClient();const [{data},{data:revisions}]=await Promise.all([supabase.from('articles').select('*').eq('id',id).maybeSingle(),supabase.from('article_revisions').select('id,title,created_at').eq('article_id',id).order('created_at',{ascending:false}).limit(20)]);if(!data)notFound();return <ArticleQuickEdit article={data} revisions={revisions||[]}/>}
