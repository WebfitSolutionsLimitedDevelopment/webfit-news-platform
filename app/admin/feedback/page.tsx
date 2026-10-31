import Link from 'next/link';
import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import { requireAdmin } from '../../../lib/admin-auth';

type Row = {
  article_id: string;
  helpful: boolean;
  comment: string | null;
  updated_at: string;
  articles: { title: string; slug: string; published_at: string | null } | null;
};

type RangeKey = '7d' | '30d' | '90d';
const RANGES: Record<RangeKey, { label: string; days: number }> = {
  '7d': { label: 'Last 7 days', days: 7 },
  '30d': { label: 'Last 30 days', days: 30 },
  '90d': { label: 'Last 90 days', days: 90 },
};

const nzTime = (iso: string) => new Date(iso).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland', dateStyle: 'medium', timeStyle: 'short' });

export default async function ReaderFeedbackPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const range: RangeKey = params.range && params.range in RANGES ? params.range as RangeKey : '30d';
  const since = new Date(Date.now() - RANGES[range].days * 86400000).toISOString();

  const { data, error } = await supabase
    .from('article_feedback')
    .select('article_id,helpful,comment,updated_at,articles(title,slug,published_at)')
    .gte('updated_at', since)
    .order('updated_at', { ascending: false })
    .limit(5000);
  if (error) throw error;
  const rows = (data || []) as unknown as Row[];

  const byArticle = new Map<string, { title: string; slug: string; yes: number; no: number; comments: number; last: string }>();
  for (const r of rows) {
    const a = byArticle.get(r.article_id) || { title: r.articles?.title || '(deleted story)', slug: r.articles?.slug || '', yes: 0, no: 0, comments: 0, last: r.updated_at };
    if (r.helpful) a.yes += 1; else a.no += 1;
    if (r.comment) a.comments += 1;
    if (r.updated_at > a.last) a.last = r.updated_at;
    byArticle.set(r.article_id, a);
  }
  // Stories that most need a look first: most "No" answers, then lowest share of "Yes".
  const summary = [...byArticle.values()].sort((x, y) => y.no - x.no || (x.yes / (x.yes + x.no)) - (y.yes / (y.yes + y.no)));
  const comments = rows.filter(r => r.comment).slice(0, 200);
  const totalYes = rows.filter(r => r.helpful).length;

  return (
    <AdminShell active="Reader feedback">
      <AdminHeader
        title="Reader feedback"
        description="Private answers to “Was this article useful?” at the end of every story. Readers never see these counts."
      />

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>{RANGES[range].label}</h2>
          <span className="admin-note">{rows.length} answers · {totalYes} yes · {rows.length - totalYes} no · {comments.length} comments</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', margin: '1rem 0' }}>
          {(Object.keys(RANGES) as RangeKey[]).map(key => (
            <Link key={key} className={key === range ? 'admin-primary' : 'admin-secondary'} href={`/admin/feedback?range=${key}`}>{RANGES[key].label}</Link>
          ))}
        </div>
        <p className="admin-note">One answer per reader per story. A reader who changes their mind replaces their earlier answer.</p>
      </section>

      <section className="admin-card">
        <div className="admin-card-head"><h2>What readers said was missing or wrong</h2></div>
        {comments.length ? (
          <div className="admin-table-wrap">
            <table>
              <thead><tr><th>Story</th><th>Comment</th><th>When</th></tr></thead>
              <tbody>
                {comments.map((r, i) => (
                  <tr key={`${r.article_id}-${i}`}>
                    <td>{r.articles?.slug ? <a href={`/${r.articles.slug}`} target="_blank" rel="noreferrer">{r.articles.title}</a> : '(deleted story)'}</td>
                    <td style={{ whiteSpace: 'pre-wrap' }}>{r.comment}</td>
                    <td>{nzTime(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="admin-note">No written comments in this period.</p>}
      </section>

      <section className="admin-card">
        <div className="admin-card-head"><h2>Stories by answers</h2><span className="admin-note">Most “No” answers first</span></div>
        <div className="admin-table-wrap">
          <table>
            <thead><tr><th>Story</th><th>👍 Yes</th><th>👎 No</th><th>Useful</th><th>Comments</th><th>Last answer</th></tr></thead>
            <tbody>
              {summary.length ? summary.map(a => (
                <tr key={a.slug || a.title}>
                  <td>{a.slug ? <a href={`/${a.slug}`} target="_blank" rel="noreferrer">{a.title}</a> : a.title}</td>
                  <td>{a.yes}</td>
                  <td><strong>{a.no}</strong></td>
                  <td>{Math.round((a.yes / (a.yes + a.no)) * 100)}%</td>
                  <td>{a.comments}</td>
                  <td>{nzTime(a.last)}</td>
                </tr>
              )) : <tr><td colSpan={6}>No answers yet in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
