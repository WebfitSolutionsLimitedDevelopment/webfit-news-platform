import { cache } from 'react';
import { createPublicClient as createClient } from '@/lib/supabase-public';

/** Stories per section page. Page 1 is /category/<slug>, later pages are /category/<slug>/page/<n>. */
export const SECTION_PAGE_SIZE = 60;

export function sectionDescription(name: string, description?: string | null) {
  return description?.trim() || `The latest ${name} news, analysis and community stories from Webfit News, independent New Zealand journalism.`;
}

export function sectionPath(slug: string, page = 1) {
  return page <= 1 ? `/category/${slug}` : `/category/${slug}/page/${page}`;
}

/** One page of a section, newest first, with the total so pages can link to older stories. */
export const getSectionPage = cache(async (slug: string, page = 1) => {
  const supabase = await createClient();
  const { data: cat } = await supabase.from('categories').select('id,name,slug,description').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (!cat) return null;
  const from = (page - 1) * SECTION_PAGE_SIZE;
  const { data, count } = await supabase
    .from('articles')
    .select('id,title,slug,excerpt,published_at,featured_media_id,article_type,media:media!articles_featured_media_id_fkey(public_url,alt_text),article_categories!inner(category_id)', { count: 'exact' })
    .eq('article_categories.category_id', cat.id)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .range(from, from + SECTION_PAGE_SIZE - 1);
  const total = count || 0;
  return {
    cat,
    stories: (data || []) as any[],
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / SECTION_PAGE_SIZE)),
  };
});
