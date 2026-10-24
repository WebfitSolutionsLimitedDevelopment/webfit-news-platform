import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import EpaperFrontManager from '../../../components/admin/EpaperFrontManager';
import { requireAdmin } from '../../../lib/admin-auth';
import { listEditions } from '../../../lib/epaper';

/*
 * The editor's choices for each weekly e-paper: lead story, three "Inside this week" teasers
 * and the editor's note on page 2 (table epaper_front). Anything left empty is chosen automatically.
 */
export const dynamic = 'force-dynamic';

export default async function EpaperFront() {
  const { supabase } = await requireAdmin();
  // The edition being filled now (out next Thursday) and the two before it.
  const editions = listEditions().filter(e => e.title === 'Weekly edition').slice(0, 3);
  const data = await Promise.all(editions.map(async e => {
    const [{ data: stories }, { data: row }] = await Promise.all([
      supabase.from('articles').select('id,title,slug,published_at').eq('status', 'published').gte('published_at', e.fromIso).lt('published_at', e.toIso).order('published_at', { ascending: false }).limit(200),
      supabase.from('epaper_front').select('lead_article_id,teaser_article_ids,editor_note,note_author,updated_at').eq('edition_key', e.key).maybeSingle(),
    ]);
    return { key: e.key, label: `No. ${e.number} · ${e.coverage}`, status: e.released ? `Out ${e.releaseDay}` : `Being filled · out ${e.releaseDay}`, href: e.href, stories: stories || [], row: row || null };
  }));
  return <AdminShell active="E-paper front">
    <AdminHeader title="E-paper front page" description="Choose this week's lead story, the three 'Inside this week' teasers and your editor's note. Leave anything empty to let the e-paper choose automatically."/>
    <EpaperFrontManager editions={data as any}/>
  </AdminShell>;
}
