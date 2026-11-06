import ArticleWorkspace from '../../../../components/admin/ArticleWorkspace';
import { requireAdmin, isWriterRole } from '../../../../lib/admin-auth';

export default async function NewArticle(){
  const { supabase, user, profile } = await requireAdmin();
  const volunteer = profile.role === 'volunteer';
  let authorQuery = supabase.from('authors').select('id,name,profile_id,title,avatar_url').eq('is_active',true);
  if(volunteer) authorQuery=authorQuery.eq('profile_id',user.id);
  const [{data:categories},{data:authors}]=await Promise.all([
    supabase.from('categories').select('id,name').eq('is_active',true).order('name'),
    authorQuery.order('name')
  ]);
  // The byline defaults to the author profile linked to whoever is signed in.
  const mine=(authors||[]).find(a=>user&&a.profile_id===user.id)||null;
  const defaultAuthorId=mine?.id||'';
  return <ArticleWorkspace categories={categories||[]} authors={(authors||[]).map(({id,name,title,avatar_url})=>({id,name,title,avatar_url}))} defaultAuthorId={defaultAuthorId}
    volunteerId={volunteer ? user.id : undefined} mode={isWriterRole(profile.role)?'writer':'reviewer'} myByline={mine?{name:mine.name,title:mine.title,avatar_url:mine.avatar_url}:null}/>;
}
