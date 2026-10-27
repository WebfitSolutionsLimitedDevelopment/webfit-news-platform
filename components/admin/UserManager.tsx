'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadAuthorPhoto } from '../../lib/author-photo';

export type ManagedUser = {
  id: string; email: string | null; display_name: string | null; role: string; is_active: boolean; phone: string | null;
  created_at: string; title: string | null; avatar_url: string | null; author_slug: string | null;
  drafts: number; submitted: number; published: number;
};

const ROLE_OPTIONS: Array<[string, string, string]> = [
  ['contributor', 'Reporter', 'Writes stories and submits them for approval. Sees only their own stories.'],
  ['editor', 'Editor', 'Reviews, publishes and sends back stories. Sees every story.'],
  ['super_admin', 'Super Admin', 'Everything, including accounts, ads and settings.'],
  ['ad_manager', 'Ad Manager', 'Advertisements only.'],
];
const ROLE_LABEL: Record<string, string> = { contributor: 'Reporter', journalist: 'Reporter', editor: 'Editor', super_admin: 'Super Admin', ad_manager: 'Ad Manager' };

function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || '?'; }

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  return <span style={{ flex: 'none', width: size, height: size, borderRadius: '50%', overflow: 'hidden', display: 'inline-grid', placeItems: 'center', background: '#1f2a6b', color: '#fff', fontWeight: 700, fontSize: size / 2.8 }}>
    {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials(name)}
  </span>;
}

/** Shown once after creating an account or resetting a password, ready to copy and send. */
function Credentials({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  const text = `Webfit News newsroom login\nAddress: https://webfitnews.com/admin\nEmail: ${email}\nPassword: ${password}\n\nPlease keep this private.`;
  const [copied, setCopied] = useState(false);
  return <div role="alert" style={{ border: '2px solid #17613b', background: '#f0faf4', borderRadius: 12, padding: '14px 16px', margin: '0 0 16px' }}>
    <strong style={{ display: 'block', marginBottom: 6 }}>Login details: copy them now, the password is not shown again</strong>
    <pre style={{ margin: '0 0 10px', whiteSpace: 'pre-wrap', fontSize: 14, background: '#fff', padding: 10, borderRadius: 8, border: '1px solid #cfe8d9' }}>{text}</pre>
    <div className="admin-actions">
      <button className="admin-primary" type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch {} }}>{copied ? 'Copied' : 'Copy login details'}</button>
      <button className="admin-secondary" type="button" onClick={onClose}>Done</button>
    </div>
  </div>;
}

function PhotoField({ name, url, onChange }: { name: string; url: string | null; onChange: (u: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
    <Avatar name={name || '?'} url={url} size={52}/>
    <label className="admin-secondary" style={{ cursor: busy ? 'wait' : 'pointer', margin: 0 }}>
      {busy ? 'Uploading…' : url ? 'Change photo' : 'Upload photo'}
      <input type="file" accept="image/*" hidden disabled={busy} onChange={async e => {
        const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
        setBusy(true); setErr('');
        try { onChange(await uploadAuthorPhoto(f, name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'reporter', name || 'Reporter photo')); }
        catch (x: any) { setErr(x.message); } finally { setBusy(false); }
      }}/>
    </label>
    {url ? <button type="button" className="admin-text-link" style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => onChange(null)}>Remove</button> : null}
    {err ? <span className="admin-note" style={{ color: '#a32323' }}>{err}</span> : null}
  </div>;
}

function AccountForm({ initial, onSaved, onCancel, isSelf }: { initial?: ManagedUser; onSaved: (creds?: { email: string; password: string }) => void; onCancel?: () => void; isSelf?: boolean }) {
  const [name, setName] = useState(initial?.display_name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [role, setRole] = useState(initial?.role === 'journalist' ? 'contributor' : initial?.role || 'contributor');
  const [title, setTitle] = useState(initial?.title || '');
  const [avatar, setAvatar] = useState<string | null>(initial?.avatar_url || null);
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function save() {
    setBusy(true); setNote('');
    try {
      const body = { name: name.trim(), email: email.trim(), phone: phone.trim() || null, role, title: title.trim() || null, avatar_url: avatar, ...(initial ? { is_active: active } : {}) };
      const r = await fetch(initial ? `/api/admin/users/${initial.id}` : '/api/admin/users', { method: initial ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof d.error === 'string' ? d.error : 'Could not save.');
      onSaved(initial ? undefined : { email: d.email, password: d.password });
    } catch (e: any) { setNote(e.message); } finally { setBusy(false); }
  }

  const roleHelp = ROLE_OPTIONS.find(r => r[0] === role)?.[2];
  return <div className="admin-form-grid">
    <label><span>Full name (shown on their stories)</span><input value={name} onChange={e => setName(e.target.value)} placeholder="Priya Sharma"/></label>
    <label><span>Role under the name</span><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Reporter (used if left blank)"/></label>
    <label><span>Email (their login)</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com"/></label>
    <label><span>Mobile (newsroom only, not shown publicly)</span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="021 123 4567"/></label>
    <label><span>Access</span><select value={role} onChange={e => setRole(e.target.value)} disabled={isSelf}>{ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>{roleHelp ? <small style={{ color: '#6b7280' }}>{roleHelp}</small> : null}</label>
    {initial ? <label><span>Status</span><select value={String(active)} onChange={e => setActive(e.target.value === 'true')} disabled={isSelf}><option value="true">Active: can sign in</option><option value="false">Disabled: cannot sign in</option></select></label> : <span/>}
    <div style={{ gridColumn: '1/-1' }}><span style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Photo (shown in a circle next to their name on stories)</span><PhotoField name={name} url={avatar} onChange={setAvatar}/></div>
    <div className="admin-actions" style={{ gridColumn: '1/-1' }}>
      <button className="admin-primary" type="button" disabled={busy || name.trim().length < 2 || !email.includes('@')} onClick={save}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Create account'}</button>
      {onCancel ? <button className="admin-secondary" type="button" onClick={onCancel}>Cancel</button> : null}
      {note ? <span className="admin-note" style={{ color: '#a32323' }}>{note}</span> : null}
    </div>
    {!initial ? <p className="admin-note" style={{ gridColumn: '1/-1', margin: 0 }}>A password is made for them automatically and shown once, ready to copy and send. They cannot change their name, photo, email or mobile: you do that here.</p> : null}
  </div>;
}

export default function UserManager({ users, currentUserId, canManage }: { users: ManagedUser[]; currentUserId: string; canManage: boolean }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'reporters' | 'staff' | 'disabled'>('all');

  async function resetPassword(u: ManagedUser) {
    if (!window.confirm(`Give ${u.display_name || u.email} a new password? Their old password stops working straight away.`)) return;
    const r = await fetch(`/api/admin/users/${u.id}/password`, { method: 'POST' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { window.alert(d.error || 'Could not reset the password.'); return; }
    setCreds({ email: u.email || '', password: d.password });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const shown = users.filter(u => filter === 'all' ? true : filter === 'disabled' ? !u.is_active : filter === 'reporters' ? (u.is_active && (u.role === 'contributor' || u.role === 'journalist')) : (u.is_active && !['contributor', 'journalist'].includes(u.role)));

  return <>
    {creds ? <Credentials email={creds.email} password={creds.password} onClose={() => setCreds(null)}/> : null}

    {canManage ? <section className="admin-card">
      <div className="admin-card-head"><h2>Add a reporter or staff member</h2>{!adding ? <button className="admin-primary" type="button" onClick={() => setAdding(true)}>+ New account</button> : null}</div>
      {adding ? <AccountForm onSaved={c => { setAdding(false); if (c) setCreds(c); router.refresh(); }} onCancel={() => setAdding(false)}/> : <p className="admin-note" style={{ margin: 0 }}>Reporters write and submit stories; you approve them or send them back with a comment.</p>}
    </section> : <section className="admin-card"><p className="admin-note" style={{ margin: 0 }}>Only a Super Admin can create or change accounts.</p></section>}

    <section className="admin-card">
      <div className="admin-card-head">
        <h2>Accounts</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{([['all', 'All'], ['reporters', 'Reporters'], ['staff', 'Staff'], ['disabled', 'Disabled']] as const).map(([k, l]) =>
          <button key={k} type="button" className={filter === k ? 'admin-primary' : 'admin-secondary'} style={{ padding: '6px 12px' }} onClick={() => setFilter(k)}>{l}</button>)}</div>
      </div>
      <div className="admin-table-wrap"><table><thead><tr><th>Person</th><th>Access</th><th>Mobile</th><th>Stories</th><th>Status</th><th></th></tr></thead><tbody>
        {shown.map(u => <tr key={u.id} style={{ verticalAlign: 'top' }}>
          <td colSpan={editing === u.id ? 6 : 1}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Avatar name={u.display_name || u.email || '?'} url={u.avatar_url}/>
              <div><strong>{u.display_name || 'No name yet'}</strong>{u.id === currentUserId ? <em style={{ marginLeft: 6, fontSize: 11, color: '#17613b' }}>(you)</em> : null}<br/><small>{u.email}</small>{u.title ? <><br/><small style={{ color: '#6b7280' }}>{u.title}</small></> : null}</div>
            </div>
            {editing === u.id ? <div style={{ marginTop: 14 }}><AccountForm initial={u} isSelf={u.id === currentUserId} onSaved={() => { setEditing(null); router.refresh(); }} onCancel={() => setEditing(null)}/></div> : null}
          </td>
          {editing === u.id ? null : <>
            <td>{ROLE_LABEL[u.role] || u.role}</td>
            <td>{u.phone || <span style={{ color: '#9aa3af' }}>–</span>}</td>
            <td><small>{u.published} published<br/>{u.submitted} waiting{u.drafts ? <><br/>{u.drafts} drafts</> : null}</small></td>
            <td>{u.is_active ? <span className="status-badge status-active">active</span> : <span className="status-badge status-disabled">disabled</span>}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{canManage ? <>
              <button type="button" className="admin-secondary" style={{ padding: '6px 10px' }} onClick={() => setEditing(u.id)}>Edit</button>{' '}
              <button type="button" className="admin-text-link" style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => resetPassword(u)}>New password</button>
            </> : null}</td>
          </>}
        </tr>)}
        {!shown.length ? <tr><td colSpan={6}>No accounts here.</td></tr> : null}
      </tbody></table></div>
    </section>
  </>;
}
