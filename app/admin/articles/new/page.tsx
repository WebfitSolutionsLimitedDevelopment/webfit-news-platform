import ArticleEditor from '../../../../components/admin/ArticleEditor';
import { createClient } from '../../../../lib/supabase-server';
export default async function NewArticle(){const supabase=await createClient();const [{data:categories},{data:authors}]=await Promise.all([supabase.from('categories').select('id,name').eq('is_active',true).order('name'),supabase.from('authors').select('id,name').eq('is_active',true).order('name')]);return <ArticleEditor categories={categories||[]} authors={authors||[]}/>}
