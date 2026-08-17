import Link from 'next/link';
import { AdminHeader, AdminShell, StatusBadge } from '../../components/admin/AdminShell';
import { getAdminDashboard } from '../../lib/admin-data';

export default async function AdminDashboard(){
  const d=await getAdminDashboard();
  return <AdminShell active="Dashboard"><AdminHeader title="Newsroom Dashboard" description="Publish, curate and operate Webfit News from one place." actions={<Link className="admin-primary" href="/admin/articles/new">+ New Article</Link>}/>
    <section className="admin-metrics">
      <div><span>Published today</span><strong>{d.publishedToday}</strong></div><div><span>In review</span><strong>{d.inReview}</strong></div><div><span>Drafts</span><strong>{d.drafts}</strong></div><div><span>Scheduled</span><strong>{d.scheduled}</strong></div><div><span>Total articles</span><strong>{d.articles}</strong></div><div><span>Media assets</span><strong>{d.media}</strong></div>
    </section>
    <section className="admin-two-col"><div className="admin-card"><div className="admin-card-head"><h2>Recent articles</h2><Link href="/admin/articles">View all</Link></div><div className="admin-table-wrap"><table><thead><tr><th>Headline</th><th>Status</th><th>Updated</th></tr></thead><tbody>{d.recent.length?d.recent.map((a:any)=><tr key={a.id}><td><Link href={`/admin/articles/${a.id}`}>{a.title}</Link><small>/{a.slug}/</small></td><td><StatusBadge status={a.status}/></td><td>{new Date(a.updated_at).toLocaleString('en-NZ',{timeZone:'Pacific/Auckland'})}</td></tr>):<tr><td colSpan={3}>No articles yet.</td></tr>}</tbody></table></div></div>
      <div className="admin-card"><div className="admin-card-head"><h2>Next scheduled</h2><Link href="/admin/articles?status=scheduled">Open queue</Link></div>{d.nextScheduled.length?<div className="schedule-list">{d.nextScheduled.map((a:any)=><div className="schedule-item" key={a.id}><div><Link href={`/admin/articles/${a.id}`}>{a.title}</Link><small>/{a.slug}/</small></div><time>{a.scheduled_at?new Date(a.scheduled_at).toLocaleString('en-NZ',{timeZone:'Pacific/Auckland'}):'No time'}</time></div>)}</div>:<p className="admin-note">Nothing is scheduled. Scheduled stories publish automatically from Supabase at their due time.</p>}</div>
    </section>
    <section className="admin-two-col"><div className="admin-card"><h2>Newsroom shortcuts</h2><div className="admin-shortcuts"><Link href="/admin/articles?status=in_review"><strong>{d.inReview}</strong><span>Stories awaiting review</span></Link><Link href="/admin/articles?status=draft"><strong>{d.drafts}</strong><span>Draft stories</span></Link><Link href="/admin/media"><strong>{d.failedMedia}</strong><span>Media needing attention</span></Link><Link href="/admin/homepage"><strong>Home</strong><span>Curate homepage</span></Link></div></div>
      <div className="admin-card"><h2>Platform status</h2><div className="migration-check"><span>Own database</span><b>Ready</b></div><div className="migration-check"><span>Own newsroom CMS</span><b>Ready</b></div><div className="migration-check"><span>Scheduled publishing</span><b>Active</b></div><div className="migration-check"><span>Archive transfer tooling</span><b>Prepared</b></div><p className="admin-note">Normal publishing runs entirely from Webfit News CMS, Supabase and the Next.js frontend. The old publishing platform is only a temporary archive source until transfer and verification are complete.</p></div>
    </section>
  </AdminShell>
}
