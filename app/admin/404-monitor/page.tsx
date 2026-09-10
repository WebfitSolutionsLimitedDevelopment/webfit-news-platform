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

export default async function NotFoundMonitorPage() {
  const { supabase } = await requireAdmin();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('not_found_events')
    .select('id,path,query_string,host,referrer,user_agent,created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1000);

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
          <h2>Last 7 days</h2>
          <span className="admin-note">{rows.length} events · {summary.length} unique URLs</span>
        </div>
        <p className="admin-note">Highest-hit URLs appear first. Add a redirect only after confirming the correct destination.</p>
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
              )) : <tr><td colSpan={5}>No 404 events recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
