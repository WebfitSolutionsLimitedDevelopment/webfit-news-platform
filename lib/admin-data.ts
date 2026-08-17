import { createClient } from './supabase-server';

export async function getAdminDashboard() {
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now); start.setHours(0,0,0,0);
  const [publishedToday,drafts,inReview,scheduled,articles,recent,nextScheduled,media,failedMedia] = await Promise.all([
    supabase.from('articles').select('*',{count:'exact',head:true}).eq('status','published').gte('published_at',start.toISOString()),
    supabase.from('articles').select('*',{count:'exact',head:true}).eq('status','draft'),
    supabase.from('articles').select('*',{count:'exact',head:true}).eq('status','in_review'),
    supabase.from('articles').select('*',{count:'exact',head:true}).eq('status','scheduled'),
    supabase.from('articles').select('*',{count:'exact',head:true}),
    supabase.from('articles').select('id,title,slug,status,published_at,updated_at').order('updated_at',{ascending:false}).limit(8),
    supabase.from('articles').select('id,title,slug,scheduled_at').eq('status','scheduled').order('scheduled_at',{ascending:true}).limit(6),
    supabase.from('media').select('*',{count:'exact',head:true}),
    supabase.from('media').select('*',{count:'exact',head:true}).eq('migration_status','failed'),
  ]);
  return {publishedToday:publishedToday.count||0,drafts:drafts.count||0,inReview:inReview.count||0,scheduled:scheduled.count||0,articles:articles.count||0,recent:recent.data||[],nextScheduled:nextScheduled.data||[],media:media.count||0,failedMedia:failedMedia.count||0};
}

export type ArticleAdminFilters = { q?: string; status?: string; type?: string; page?: number; pageSize?: number };

export async function getArticlesAdmin(filters:ArticleAdminFilters={}) {
  const supabase = await createClient();
  const page=Math.max(1,Number(filters.page||1));
  const pageSize=Math.min(100,Math.max(10,Number(filters.pageSize||30)));
  const from=(page-1)*pageSize;
  const to=from+pageSize-1;
  let query=supabase.from('articles').select('id,title,slug,status,article_type,published_at,scheduled_at,updated_at,author:author_id(name),media:featured_media_id(public_url)',{count:'exact'});
  if(filters.status && filters.status!=='all') query=query.eq('status',filters.status as any);
  if(filters.type && filters.type!=='all') query=query.eq('article_type',filters.type as any);
  if(filters.q?.trim()) {
    const safe=filters.q.trim().replaceAll(',',' ');
    query=query.or(`title.ilike.%${safe}%,slug.ilike.%${safe}%`);
  }
  const {data,error,count}=await query.order('updated_at',{ascending:false}).range(from,to);
  if(error) throw error;
  return {items:data||[],count:count||0,page,pageSize,pages:Math.max(1,Math.ceil((count||0)/pageSize))};
}

export async function getMediaAdmin(limit=120) {
  const supabase = await createClient();
  const {data,error}=await supabase.from('media').select('id,title,filename,public_url,original_url,alt_text,mime_type,migration_status,created_at').order('created_at',{ascending:false}).limit(limit);
  if(error) throw error; return data||[];
}

export async function getHomepageAdmin() {
  const supabase=await createClient();
  const {data,error}=await supabase.from('homepage_sections').select('id,key,title,section_type,is_enabled,sort_order,max_items,category:category_id(name,slug),slots:homepage_slots(id,position,article:article_id(id,title,slug))').order('sort_order');
  if(error) throw error; return data||[];
}

export async function getCategoriesAdmin(){const supabase=await createClient();const {data,error}=await supabase.from('categories').select('id,name,slug,description,is_active,sort_order,parent:parent_id(name)').order('name');if(error)throw error;return data||[];}
export async function getAdsAdmin(){const supabase=await createClient();const [{data:slots},{data:campaigns},{data:creatives},{data:assignments},{data:media}]=await Promise.all([supabase.from('ad_slots').select('*').order('label'),supabase.from('ad_campaigns').select('*').order('created_at',{ascending:false}),supabase.from('ad_creatives').select('*,media:media_id(id,filename,public_url)').order('created_at',{ascending:false}),supabase.from('ad_assignments').select('*,slot:slot_id(key,label),creative:creative_id(id,headline)').order('created_at',{ascending:false}),supabase.from('media').select('id,filename,public_url').like('mime_type','image/%').order('created_at',{ascending:false}).limit(120)]);return {slots:slots||[],campaigns:campaigns||[],creatives:creatives||[],assignments:assignments||[],media:media||[]};}
export async function getVideosAdmin(){const supabase=await createClient();const {data}=await supabase.from('videos').select('*').order('created_at',{ascending:false});return data||[];}
export async function getIssuesAdmin(){const supabase=await createClient();const {data}=await supabase.from('digital_issues').select('*').order('publication_date',{ascending:false});return data||[];}


export async function getAuthorsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('authors')
    .select('id,name,slug,email,title,bio,avatar_url,is_active,wp_author_id,created_at,updated_at')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getLaunchReadiness() {
  const supabase = await createClient();
  const [articles, published, media, migratedMedia, skippedMedia, categories, authors, redirects, profiles, superAdmins, failedMedia] = await Promise.all([
    supabase.from('articles').select('*', { count: 'exact', head: true }),
    supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status','published'),
    supabase.from('media').select('*', { count: 'exact', head: true }),
    supabase.from('media').select('*', { count: 'exact', head: true }).eq('migration_status','migrated'),
    supabase.from('media').select('*', { count: 'exact', head: true }).eq('migration_status','skipped'),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('authors').select('*', { count: 'exact', head: true }),
    supabase.from('redirects').select('*', { count: 'exact', head: true }).eq('is_active',true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active',true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active',true).eq('role','super_admin'),
    supabase.from('media').select('*', { count: 'exact', head: true }).eq('migration_status','failed'),
  ]);
  const settings = await supabase.from('site_settings').select('key,value').in('key',['publication','seo','trust','archive_import']);
  const settingMap = Object.fromEntries((settings.data ?? []).map((row:any)=>[row.key,row.value]));
  return {
    articles: articles.count ?? 0,
    published: published.count ?? 0,
    media: media.count ?? 0,
    migratedMedia: migratedMedia.count ?? 0,
    skippedMedia: skippedMedia.count ?? 0,
    failedMedia: failedMedia.count ?? 0,
    categories: categories.count ?? 0,
    authors: authors.count ?? 0,
    redirects: redirects.count ?? 0,
    activeUsers: profiles.count ?? 0,
    superAdmins: superAdmins.count ?? 0,
    publication: settingMap.publication ?? {},
    seo: settingMap.seo ?? {},
    trust: settingMap.trust ?? {},
    archive: settingMap.archive_import ?? {},
  };
}
