import { AdminHeader, AdminShell, StatusBadge } from '../../../components/admin/AdminShell';
import { requireAdmin } from '../../../lib/admin-auth';

export default async function RedirectsPage(){
  const {supabase,profile}=await requireAdmin();
  const {data,error}=await supabase.from('redirects').select('*').order('created_at',{ascending:false}).limit(500);
  if(error) throw error;
  return <AdminShell active="Redirects">
    <AdminHeader title="Redirect Manager" description="Protect historical URLs and SEO equity during the move to webfitnews.co.nz."/>
    <section className="admin-card">
      <h2>Add redirect</h2>
      <form className="redirect-create-row" action="/api/admin/redirects" method="post">
        <input name="source_path" required placeholder="/old-article-slug/"/>
        <input name="destination_path" required placeholder="/new-slug/"/>
        <select name="status_code" defaultValue="301"><option value="301">301 Permanent</option><option value="302">302 Temporary</option><option value="307">307 Temporary</option><option value="308">308 Permanent</option></select>
        <button className="admin-primary" type="submit">Add Redirect</button>
      </form>
    </section>
    <section className="admin-card">
      <div className="admin-card-head"><h2>Redirects</h2><span className="admin-note">{(data||[]).length} shown</span></div>
      <div className="admin-table-wrap"><table><thead><tr><th>Source</th><th>Destination</th><th>Code</th><th>Source type</th><th>Status</th><th>Action</th></tr></thead><tbody>
        {(data||[]).length?(data||[]).map((r:any)=><tr key={r.id}><td><code>{r.source_path}</code></td><td><code>{r.destination_path}</code></td><td>{r.status_code}</td><td>{r.source}</td><td><StatusBadge status={r.is_active?'active':'disabled'}/></td><td>{profile.role==='super_admin'?<form action={`/api/admin/redirects/${r.id}`} method="post"><input type="hidden" name="action" value={r.is_active?'disable':'enable'}/><button className="admin-secondary" type="submit">{r.is_active?'Disable':'Enable'}</button></form>:null}</td></tr>):<tr><td colSpan={6}>No redirects created yet.</td></tr>}
      </tbody></table></div>
    </section>
  </AdminShell>
}
