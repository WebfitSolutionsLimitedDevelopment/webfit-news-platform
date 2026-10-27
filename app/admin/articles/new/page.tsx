import ArticleWorkspace from '../../../../components/admin/ArticleWorkspace';
import { createClient } from '../../../../lib/supabase-server';
import { isWriterRole } from '../../../../lib/admin-auth';

export default async function NewArticle(){
  const supabase=await createClient();
  const [{data:categories},{data:authors},{data:{user}}]=await Promise.all([
    supabase.from('categories').select('id,name').eq('is_active',true).order('name'),
    supabase.from('authors').select('id,name,profile_id,title,avatar_url').eq('is_active',true).order('name'),
    supabase.auth.getUser()
  ]);
  // The byline defaults to the author profile linked to whoever is signed in.
  const mine=(authors||[]).find(a=>user&&a.profile_id===user.id)||null;
  const defaultAuthorId=mine?.id||'';
  const {data:me}=user?await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle():{data:null};
  return <ArticleWorkspace categories={categories||[]} authors={(authors||[]).map(({id,name,title,avatar_url})=>({id,name,title,avatar_url}))} defaultAuthorId={defaultAuthorId}
    mode={isWriterRole(me?.role)?'writer':'reviewer'} myByline={mine?{name:mine.name,title:mine.title,avatar_url:mine.avatar_url}:null}/>;
}
