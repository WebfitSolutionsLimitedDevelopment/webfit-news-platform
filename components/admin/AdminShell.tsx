import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoutButton } from './LogoutButton';

const nav = [
  ['Dashboard','/admin'],
  ['Articles','/admin/articles'],
  ['Media','/admin/media'],
  ['Homepage','/admin/homepage'],
  ['Categories','/admin/categories'],
  ['Authors','/admin/authors'],
  ['Advertisements','/admin/advertisements'],
  ['Videos','/admin/videos'],
  ['Digital Edition','/admin/digital-edition'],
  ['Archive Audit','/admin/migration'],
  ['Redirects','/admin/redirects'],
  ['Users','/admin/users'],
  ['Launch Readiness','/admin/launch'],
  ['Settings','/admin/settings'],
] as const;

export function AdminShell({children, active}:{children:ReactNode;active?:string}) {
  return <div className="admin-layout">
    <aside className="admin-sidebar">
      <Link className="admin-brand" href="/admin"><span>WEBFIT</span><strong>NEWSROOM</strong></Link>
      <nav>{nav.map(([label,href]) => <Link key={href} className={active===label?'active':''} href={href}>{label}</Link>)}</nav>
      <div className="admin-sidebar-footer"><Link href="/" target="_blank">View website ↗</Link><LogoutButton/><span>Webfit News CMS v2.0</span></div>
    </aside>
    <main className="admin-content">{children}</main>
  </div>;
}

export function AdminHeader({title,description,actions}:{title:string;description?:string;actions?:ReactNode}) {
  return <header className="admin-header"><div><div className="admin-kicker">WEBFIT NEWSROOM</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="admin-header-actions">{actions}</div>}</header>;
}

export function StatusBadge({status}:{status:string}) { return <span className={`status-badge status-${status.replaceAll('_','-')}`}>{status.replaceAll('_',' ')}</span>; }
