import Link from 'next/link';
import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import { requireAdmin } from '../../../lib/admin-auth';
import './analytics.css';

/**
 * Webfit News' own readership numbers, from the page_views table
 * (recorded by components/ReadTracker.tsx through /api/track).
 * Counting started on 28 October 2026 (9:18am NZ); nothing before that exists.
 */

const PERIODS = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
} as const;
type PeriodKey = keyof typeof PERIODS;

type Named = { name: string; views: number };
type StoryRow = { id: string; title: string; slug: string; published_at: string | null; views: number; readers: number; reads: number; avgSeconds: number; topSource: string | null };
type Report = {
  totals: { views: number; readers: number; returning: number; articleViews: number; reads: number; avgSeconds: number; mobile: number; epaper: number };
  trend: Array<{ t: string; views: number; readers: number }>;
  articles: StoryRow[];
  sources: Named[];
  devices: Named[];
  countries: Named[];
  kinds: Named[];
  referrers: Named[];
  live: number;
};

const SOURCE_LABEL: Record<string, string> = {
  google: 'Google', facebook: 'Facebook / Instagram', whatsapp: 'WhatsApp', newsletter: 'Newsletter',
  direct: 'Direct (typed, app, bookmarks)', internal: 'From another Webfit page', 'other search': 'Other search engines',
  'other social': 'Other social (X, LinkedIn, Reddit)', 'other sites': 'Other websites',
};
const KIND_LABEL: Record<string, string> = { article: 'Stories', home: 'Homepage', epaper: 'E-paper', section: 'Section pages', other: 'Other pages' };
const COUNTRY = new Intl.DisplayNames(['en-NZ'], { type: 'region' });

const n = (v: number) => new Intl.NumberFormat('en-NZ').format(v || 0);
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '–');
const duration = (s: number) => (!s ? '–' : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`);

/** Midnight in Auckland for a YYYY-MM-DD date, as a real instant (handles NZDT/NZST). */
function aucklandMidnight(key: string) {
  const guess = new Date(`${key}T00:00:00Z`);
  const offset = new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', timeZoneName: 'longOffset' })
    .formatToParts(guess).find(p => p.type === 'timeZoneName')?.value || 'GMT+12:00';
  const m = offset.match(/GMT([+-])(\d{2}):(\d{2})/);
  const minutes = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 720;
  return new Date(guess.getTime() - minutes * 60000);
}
function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function shift(key: string, days: number) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days, 12)).toISOString().slice(0, 10);
}
function range(period: PeriodKey) {
  const today = todayKey();
  const tomorrow = aucklandMidnight(shift(today, 1));
  switch (period) {
    case 'today': return { from: aucklandMidnight(today), to: tomorrow };
    case 'yesterday': return { from: aucklandMidnight(shift(today, -1)), to: aucklandMidnight(today) };
    case '7d': return { from: aucklandMidnight(shift(today, -6)), to: tomorrow };
    case '90d': return { from: aucklandMidnight(shift(today, -89)), to: tomorrow };
    default: return { from: aucklandMidnight(shift(today, -29)), to: tomorrow };
  }
}
function trendLabel(t: string) {
  if (t.includes('T')) return `${Number(t.slice(11, 13))}:00`;
  const [y, m, d] = t.split('-').map(Number);
  return new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short' }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}
function published(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', day: 'numeric', month: 'short' }).format(new Date(value));
}

function Bars({ title, note, rows, label }: { title: string; note?: string; rows: Named[]; label?: (name: string) => string }) {
  const max = Math.max(1, ...rows.map(r => r.views));
  const total = rows.reduce((s, r) => s + r.views, 0);
  return <section className="admin-card story-analytics-card">
    <div className="story-analytics-card-head"><div><h2>{title}</h2>{note ? <p>{note}</p> : null}</div></div>
    {rows.length ? <div className="readership-bars">
      {rows.map(r => <div key={r.name} className="readership-bar">
        <span>{label ? label(r.name) : r.name}</span>
        <div><i style={{ width: `${Math.max(2, (r.views / max) * 100)}%` }}/></div>
        <strong>{n(r.views)}</strong><small>{pct(r.views, total)}</small>
      </div>)}
    </div> : <p className="readership-empty">No visits counted yet for this period.</p>}
  </section>;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string; story?: string }> }) {
  const params = await searchParams;
  const period = (params.period && params.period in PERIODS ? params.period : '7d') as PeriodKey;
  const storyId = params.story && /^[0-9a-f-]{36}$/i.test(params.story) ? params.story : null;
  const { supabase, profile } = await requireAdmin();

  const { from, to } = range(period);
  const [{ data, error }, storyResult, firstResult] = await Promise.all([
    supabase.rpc('readership_report', { p_from: from.toISOString(), p_to: to.toISOString(), p_article: storyId }),
    storyId ? supabase.from('articles').select('id,title,slug,published_at,view_count').eq('id', storyId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('page_views').select('occurred_at').order('occurred_at', { ascending: true }).limit(1).maybeSingle(),
  ]);
  // Counting began when the tracker went live; periods that reach back before that only hold data from then on.
  const firstAt = (firstResult as { data: { occurred_at: string } | null }).data?.occurred_at || null;
  const startedLabel = firstAt ? new Intl.DateTimeFormat('en-NZ', { timeZone: 'Pacific/Auckland', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' }).format(new Date(firstAt)) : null;
  const beforeStart = !firstAt || from < new Date(firstAt);
  const story = (storyResult as { data: { id: string; title: string; slug: string; published_at: string | null; view_count: number | null } | null }).data;
  const report = (data || null) as Report | null;
  const t = report?.totals;
  const trendMax = Math.max(1, ...(report?.trend || []).map(x => x.views));
  const allowed = ['super_admin', 'editor'].includes(profile.role);
  const query = (p: PeriodKey) => `/admin/analytics?period=${p}${storyId ? `&story=${storyId}` : ''}`;

  return <AdminShell active="Analytics">
    <AdminHeader
      title={story ? 'Story analytics' : 'Analytics'}
      description="Webfit News' own readership numbers, counted on our site and stored in our own database. Google Analytics keeps working alongside it."
      actions={<a className="admin-secondary" href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">Open Google Analytics ↗</a>}
    />

    <nav className="readership-periods" aria-label="Period">
      {(Object.keys(PERIODS) as PeriodKey[]).map(p => <Link key={p} href={query(p)} className={p === period ? 'is-active' : ''}>{PERIODS[p]}</Link>)}
      <span className="readership-live"><i/> {n(report?.live || 0)} reading now</span>
    </nav>

    {story ? <section className="admin-card readership-story-head">
      <div><small>Story · published {published(story.published_at)}</small><h2>{story.title}</h2></div>
      <div className="readership-story-links">
        <a href={`/${story.slug}`} target="_blank" rel="noopener noreferrer">View story ↗</a>
        <Link href={`/admin/analytics?period=${period}`}>← All stories</Link>
      </div>
    </section> : null}

    {beforeStart ? <section className="story-analytics-alert">{startedLabel
      ? <>Counting started on {startedLabel}. Nothing before that was recorded, so {PERIODS[period].toLowerCase()} only includes visits from then on{period === 'yesterday' ? ' (none yet)' : ''}.</>
      : <>No visits recorded yet.</>}</section> : null}

    {!allowed ? <section className="story-analytics-alert">Analytics is available to super admins and editors.</section> : null}
    {error ? <section className="story-analytics-warning">Could not load analytics: {error.message}</section> : null}

    <section className="story-analytics-metrics readership-metrics">
      <article><span>Page views</span><strong>{n(t?.views || 0)}</strong><small>{PERIODS[period]}</small></article>
      <article><span>Readers</span><strong>{n(t?.readers || 0)}</strong><small>different people (browsers)</small></article>
      <article><span>Returning readers</span><strong>{pct(t?.returning || 0, t?.readers || 0)}</strong><small>had visited before</small></article>
      <article><span>Stories read</span><strong>{n(t?.reads || 0)}</strong><small>{pct(t?.reads || 0, t?.articleViews || 0)} of story views (30s+ or 75% scrolled)</small></article>
      <article><span>Average reading time</span><strong>{duration(t?.avgSeconds || 0)}</strong><small>per story view</small></article>
      <article><span>On phones</span><strong>{pct(t?.mobile || 0, t?.views || 0)}</strong><small>of page views</small></article>
      {!story ? <article><span>E-paper opens</span><strong>{n(t?.epaper || 0)}</strong><small>edition page views</small></article> : null}
      {story ? <article><span>All-time views</span><strong>{n(story.view_count || 0)}</strong><small>since counting began</small></article> : null}
    </section>

    <section className="admin-card story-analytics-card">
      <div className="story-analytics-card-head"><div><h2>{period === 'today' || period === 'yesterday' ? 'Views by hour' : 'Views by day'}</h2><p>Auckland time.</p></div></div>
      {report?.trend?.length ? <div className="story-analytics-trend">
        {report.trend.map(x => <div className="story-analytics-trend-item" key={x.t} title={`${trendLabel(x.t)}: ${n(x.views)} views, ${n(x.readers)} readers`}>
          <div className="story-analytics-trend-track"><span style={{ height: `${(x.views / trendMax) * 100}%` }}/></div>
          <small>{trendLabel(x.t)}</small>
        </div>)}
      </div> : <p className="readership-empty">No visits counted for this period.</p>}
    </section>

    {!story ? <section className="admin-card story-analytics-card">
      <div className="story-analytics-card-head"><div><h2>Top stories</h2><p>Click a story to see its own numbers. &ldquo;Read&rdquo; means the reader stayed 30 seconds or scrolled 75% of the page.</p></div></div>
      {report?.articles?.length ? <div className="admin-table-wrap"><table className="readership-table">
        <thead><tr><th>#</th><th>Story</th><th>Views</th><th>Readers</th><th>Read</th><th>Avg time</th><th>Main source</th></tr></thead>
        <tbody>{report.articles.map((a, i) => <tr key={a.id}>
          <td>{i + 1}</td>
          <td><Link href={`/admin/analytics?period=${period}&story=${a.id}`}><strong>{a.title}</strong></Link><small>{published(a.published_at)}</small></td>
          <td>{n(a.views)}</td>
          <td>{n(a.readers)}</td>
          <td>{pct(a.reads, a.views)}</td>
          <td>{duration(a.avgSeconds)}</td>
          <td>{a.topSource ? SOURCE_LABEL[a.topSource] || a.topSource : '–'}</td>
        </tr>)}</tbody>
      </table></div> : <p className="readership-empty">No story views counted yet for this period.</p>}
    </section> : null}

    <div className="story-analytics-grid">
      <Bars title="Where readers come from" rows={report?.sources || []} label={s => SOURCE_LABEL[s] || s}/>
      <Bars title="Websites sending readers" note="Outside sites only." rows={report?.referrers || []}/>
      <Bars title="Devices" rows={report?.devices || []} label={d => d === 'mobile' ? 'Phone' : d === 'tablet' ? 'Tablet' : d === 'desktop' ? 'Computer' : 'Unknown'}/>
      <Bars title="Countries" rows={report?.countries || []} label={c => { try { return c === '??' ? 'Unknown' : COUNTRY.of(c) || c; } catch { return c; } }}/>
      {!story ? <Bars title="What people opened" rows={report?.kinds || []} label={k => KIND_LABEL[k] || k}/> : null}
    </div>

    <p className="readership-footnote">Counted on webfitnews.com since {startedLabel || 'the tracker went live'}. Search engines and other bots are left out; newsroom staff reading the public site are included. Readers are told about this in the privacy policy.</p>
  </AdminShell>;
}
