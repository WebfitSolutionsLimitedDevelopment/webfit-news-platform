import Link from 'next/link';
import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import { requireAdmin } from '../../../lib/admin-auth';

type EventRow = {
  id: number;
  path: string;
  query_string: string | null;
  host: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
};

type RangeKey = '30m' | '1h' | 'today' | '24h' | '7d';

const RANGE_LABELS: Record<RangeKey, string> = {
  '30m': 'Last 30 minutes',
  '1h': 'Last 1 hour',
  today: 'Today',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
};

function referrerLabel(value: string | null) {
  if (!value) return 'Direct / unknown';
  try {
    const host = new URL(value).hostname.replace(/^www\./, '');
    if (host.includes('google.')) return 'Google';
    if (host.includes('facebook.') || host.includes('fb.')) return 'Facebook';
    return host;
  } catch {
    return value.slice(0, 60);
  }
}

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const asUtc = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second));
  return asUtc - date.getTime();
}

function startOfAucklandToday(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const y = Number(values.year), m = Number(values.month), d = Number(values.day);
  const probe = new Date(Date.UTC(y, m - 1, d, 12));
  const offset = timeZoneOffsetMs(probe, 'Pacific/Auckland');
  return new Date(Date.UTC(y, m - 1, d) - offset);
}

function rangeStart(range: RangeKey) {
  const now = new Date();
  if (range === '30m') return new Date(now.getTime() - 30 * 60 * 1000);
  if (range === '1h') return new Date(now.getTime() - 60 * 60 * 1000);
  if (range === '24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (range === 'today') return startOfAucklandToday(now);
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
}

export default async function NotFoundMonitorPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const requested = params.range as RangeKey | undefined;
  const range: RangeKey = requested && requested in RANGE_LABELS ? requested : 'today';
  const since = rangeStart(range).toISOString();

  const { data, error } = await supabase
    .from('not_found_events')
    .select('id,path,query_string,host,referrer,user_agent,created_at')
    .gte('created_at', since)
    .not('path', 'like', '/.well-known/sgcaptcha%')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) throw error;

  const rows = (data || []) as EventRow[];
  const grouped = new Map<string, { path: string; hits: number; lastSeen: string; referrers: Map<string, number> }>();

  for (const row of rows) {
    const fullPath = `${row.path}${row.query_string || ''}`;
    const existing = grouped.get(fullPath) || {
      path: fullPath,
      hits: 0,
      lastSeen: row.created_at,
      referrers: new Map<string, number>(),
    };
    existing.hits += 1;
    if (row.created_at > existing.lastSeen) existing.lastSeen = row.created_at;
    const ref = referrerLabel(row.referrer);
    existing.referrers.set(ref, (existing.referrers.get(ref) || 0) + 1);
    grouped.set(fullPath, existing);
  }

  const summary = [...grouped.values()]
    .map(item => ({
      ...item,
      topReferrer: [...item.referrers.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Direct / unknown',
    }))
    .sort((a, b) => b.hits - a.hits || b.lastSeen.localeCompare(a.lastSeen));

  return (
    <AdminShell active="404 Monitor">
      <AdminHeader
        title="404 Monitor"
        description="Real broken URLs reaching Webfit News. Use this list to repair old Google, WordPress and social links without guessing."
      />

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>{RANGE_LABELS[range]}</h2>
          <span className="admin-note">{rows.length} events · {summary.length} unique URLs</span>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'.5rem',margin:'1rem 0'}}>
          {(Object.keys(RANGE_LABELS) as RangeKey[]).map(key => (
            <Link
              key={key}
              className={key === range ? 'admin-primary' : 'admin-secondary'}
              href={`/admin/404-monitor?range=${key}`}
            >{RANGE_LABELS[key]}</Link>
          ))}
        </div>
        <p className="admin-note">Known security-challenge noise is hidden. Highest-hit genuine URLs appear first. Add a redirect only after confirming the correct destination.</p>
      </section>

      <section className="admin-card">
        <div className="admin-table-wrap">
          <table>
            <thead><tr><th>Broken URL</th><th>Hits</th><th>Main source</th><th>Last seen</th><th>Tools</th></tr></thead>
            <tbody>
              {summary.length ? summary.map(item => (
                <tr key={item.path}>
                  <td><code style={{ wordBreak: 'break-all' }}>{item.path}</code></td>
                  <td><strong>{item.hits}</strong></td>
                  <td>{item.topReferrer}</td>
                  <td>{new Date(item.lastSeen).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}</td>
                  <td>
                    <a className="admin-secondary" href={item.path} target="_blank" rel="noreferrer">Open</a>{' '}
                    <Link className="admin-secondary" href={`/admin/redirects?source=${encodeURIComponent(item.path)}`}>Redirects</Link>
                  </td>
                </tr>
              )) : <tr><td colSpan={5}>No 404 events recorded in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
