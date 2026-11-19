import Link from 'next/link';
import { AdminHeader, AdminShell } from '@/components/admin/AdminShell';
import { isReviewerRole, requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { adminListJobs } from '@/lib/logo-studio';
import { LogoUploadActions, UnblockButton } from './LogoUploadActions';

export const dynamic = 'force-dynamic';
const PER_PAGE = 48;

function nzTime(iso: string) {
  return new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Pacific/Auckland' }).format(new Date(iso));
}

/** Everything made with webfitnews.com/addYourLogo, so the newsroom can remove anything wrong or reported. */
export default async function LogoUploads({ searchParams }: { searchParams: Promise<{ page?: string; email?: string }> }) {
  const { profile } = await requireAdmin();
  if (!isReviewerRole(profile.role)) {
    return <AdminShell active="Logo uploads"><AdminHeader title="Logo uploads"/><div className="admin-empty">Only super admins and editors can see this page.</div></AdminShell>;
  }
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const email = (sp.email || '').slice(0, 120);
  const { items, total, today, accounts } = await adminListJobs({ page, perPage: PER_PAGE, email });
  const db = createAdminClient();
  const { data: blockedRows } = await db.from('logo_studio_blocked').select('user_id,blocked_at').order('blocked_at', { ascending: false });
  const blockedIds = (blockedRows ?? []).map(b => b.user_id);
  const { data: blockedPeople } = blockedIds.length ? await db.from('profiles').select('id,email').in('id', blockedIds) : { data: [] as { id: string; email: string | null }[] };
  const blockedEmail = new Map((blockedPeople ?? []).map(p => [p.id, p.email]));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const link = (p: number) => `/admin/logo-uploads?page=${p}${email ? `&email=${encodeURIComponent(email)}` : ''}`;

  return <AdminShell active="Logo uploads">
    <AdminHeader title="Logo uploads" description="Photos people have made with webfitnews.com/addYourLogo. Delete anything wrong or reported; block an account to remove everything it made and stop it using the tool."/>
    <div className="logo-uploads-stats"><span><b>{today}</b> made today</span><span><b>{total}</b> {email ? 'matching' : 'kept (last 30 days)'}</span><span><b>{accounts}</b> accounts</span><a href="/addYourLogo" target="_blank" rel="noopener">Open the tool</a></div>
    <form className="admin-toolbar" action="/admin/logo-uploads">
      <input name="email" defaultValue={email} placeholder="Filter by email"/>
      <button className="admin-secondary" type="submit">Filter</button>
      {email ? <Link className="admin-text-link" href="/admin/logo-uploads">Clear</Link> : null}
    </form>
    {items.length ? <div className="logo-uploads-grid">
      {items.map(it => <article key={it.id} className="logo-upload-card">
        <a href={it.full ?? '#'} target="_blank" rel="noopener" className="logo-upload-thumb">{it.thumb ? <img src={it.thumb} alt="" loading="lazy"/> : null}</a>
        <div className="logo-upload-meta">
          <strong title={it.email ?? ''}>{it.email ?? 'Unknown account'}</strong>
          <small>{nzTime(it.createdAt)}{it.width && it.height ? `, ${it.width}×${it.height}` : ''}</small>
          <small className="logo-upload-file">{it.filename}</small>
          {it.logo ? <span className="logo-upload-logo"><img src={it.logo} alt="Logo used"/></span> : null}
        </div>
        <LogoUploadActions id={it.id} userId={it.userId} email={it.email}/>
      </article>)}
    </div> : <div className="admin-empty">{email ? 'No photos from accounts matching that email.' : 'Nobody has used the tool yet.'}</div>}
    {pages > 1 ? <div className="admin-pagination"><span>Page {page} of {pages}</span><div>{page > 1 ? <Link href={link(page - 1)}>Newer</Link> : null}{page < pages ? <Link href={link(page + 1)}>Older</Link> : null}</div></div> : null}
    {blockedIds.length ? <section className="logo-uploads-blocked">
      <h2>Blocked accounts</h2>
      <ul>{(blockedRows ?? []).map(b => <li key={b.user_id}><span>{blockedEmail.get(b.user_id) ?? b.user_id}</span><small>since {nzTime(b.blocked_at)}</small><UnblockButton userId={b.user_id}/></li>)}</ul>
    </section> : null}
  </AdminShell>;
}
