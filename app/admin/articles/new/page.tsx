import ArticleWorkspace from '../../../../components/admin/ArticleWorkspace';
import { createClient } from '../../../../lib/supabase-server';

export default async function NewArticle(){
  const supabase=await createClient();
  const [{data:categories},{data:authors},{data:{user}}]=await Promise.all([
    supabase.from('categories').select('id,name').eq('is_active',true).order('name'),
    supabase.from('authors').select('id,name,profile_id').eq('is_active',true).order('name'),
    supabase.auth.getUser()
  ]);
  // The byline defaults to the author profile linked to whoever is signed in.
  const defaultAuthorId=(authors||[]).find(a=>user&&a.profile_id===user.id)?.id||'';
  return <ArticleWorkspace categories={categories||[]} authors={(authors||[]).map(({id,name})=>({id,name}))} defaultAuthorId={defaultAuthorId}/>;
}
