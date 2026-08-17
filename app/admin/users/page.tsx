import { AdminHeader, AdminShell, StatusBadge } from '../../../components/admin/AdminShell';
import { requireAdmin } from '../../../lib/admin-auth';

export default async function UsersPage(){
  const {supabase,profile}=await requireAdmin();
  const {data:profiles,error}=await supabase.from('profiles').select('id,email,display_name,role,is_active,created_at,updated_at').order('created_at',{ascending:true});
  if(error) throw error;
  return <AdminShell active="Users">
    <AdminHeader title="Users & Roles" description="Control newsroom access without sharing a single administrator login."/>
    <section className="admin-card">
      <div className="admin-card-head"><h2>Newsroom accounts</h2><span className="admin-note">Signed in as {profile.email || profile.display_name || 'staff'}</span></div>
      <p className="admin-note">Create new authentication users in Supabase Auth, then manage their newsroom role here. Only Super Admins can change roles or disable accounts.</p>
      <div className="admin-table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Created</th><th>Action</th></tr></thead><tbody>
        {(profiles||[]).length ? (profiles||[]).map((p:any)=><tr key={p.id}>
          <td><strong>{p.display_name||p.email||'Unnamed user'}</strong><small>{p.email||p.id}</small></td>
          <td><StatusBadge status={p.role}/></td>
          <td><StatusBadge status={p.is_active?'active':'disabled'}/></td>
          <td>{new Date(p.created_at).toLocaleDateString('en-NZ')}</td>
          <td>{profile.role==='super_admin'?<form className="user-role-form" action={`/api/admin/users/${p.id}`} method="post">
            <select name="role" defaultValue={p.role}><option value="super_admin">Super Admin</option><option value="editor">Editor</option><option value="journalist">Journalist</option><option value="contributor">Contributor</option><option value="ad_manager">Ad Manager</option></select>
            <select name="is_active" defaultValue={String(p.is_active)}><option value="true">Active</option><option value="false">Disabled</option></select>
            <button className="admin-secondary" type="submit">Update</button>
          </form>:<span className="admin-note">Super Admin only</span>}</td>
        </tr>):<tr><td colSpan={5}>No newsroom profiles yet. The first Supabase Auth user still needs to be created.</td></tr>}
      </tbody></table></div>
    </section>
  </AdminShell>
}
