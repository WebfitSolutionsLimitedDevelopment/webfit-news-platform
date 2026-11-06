import ArticleWorkspace from '../../../../components/admin/ArticleWorkspace';
import { AdminHeader, AdminShell } from '@/components/admin/AdminShell';
import VolunteerStoryForm from '@/components/admin/VolunteerStoryForm';
import { requireAdmin, isWriterRole } from '../../../../lib/admin-auth';

export default async function NewArticle(){
  const { supabase, user, profile } = await requireAdmin();
  if (profile.role === 'volunteer') {
    const { data: byline } = await supabase.from('authors').select('name').eq('profile_id', user.id).eq('is_active', true).maybeSingle();
    return <AdminShell active="New story"><AdminHeader title="New story" description="Paste your article and send it to the editor."/><VolunteerStoryForm byline={byline?.name}/></AdminShell>;
  }
  const [{data:categories},{data:authors}]=await Promise.all([
    supabase.from('categories').select('id,name').eq('is_active',true).order('name'),
    supabase.from('authors').select('id,name,profile_id,title,avatar_url').eq('is_active',true).order('name')
  ]);
  // The byline defaults to the author profile linked to whoever is signed in.
  const mine=(authors||[]).find(a=>user&&a.profile_id===user.id)||null;
  const defaultAuthorId=mine?.id||'';
  return <ArticleWorkspace categories={categories||[]} authors={(authors||[]).map(({id,name,title,avatar_url})=>({id,name,title,avatar_url}))} defaultAuthorId={defaultAuthorId}
    mode={isWriterRole(profile.role)?'writer':'reviewer'} myByline={mine?{name:mine.name,title:mine.title,avatar_url:mine.avatar_url}:null}/>;
}
