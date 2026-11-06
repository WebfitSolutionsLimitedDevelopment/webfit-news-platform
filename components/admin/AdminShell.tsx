import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoutButton } from './LogoutButton';
import styles from './AdminShell.module.css';
import { createClient } from '../../lib/supabase-server';
import { isReviewerRole, isWriterRole } from '../../lib/admin-auth';

type Group={label:string;items:ReadonlyArray<readonly [string,string]>};

/** Outside reporters see only their own stories and the image library. */
const writerGroups:Group[]=[
  {label:'My work',items:[['My stories','/admin/articles'],['New story','/admin/articles/new'],['Media','/admin/media']]},
];

const volunteerGroups:Group[]=[
  {label:'My work',items:[['My assignments','/admin/assignments'],['My stories','/admin/articles'],['New story','/admin/articles/new']]},
];

function staffGroups(reviewer=false):Group[]{
  return [
  {label:'Editorial',items:[['Dashboard','/admin'],['Articles','/admin/articles'],
    ...(reviewer?[['Volunteer assignments','/admin/assignments'] as const]:[]),
    ['Analytics','/admin/analytics'],['Reader feedback','/admin/feedback'],['Homepage','/admin/homepage'],['E-paper front','/admin/epaper-front'],['Media','/admin/media'],['Categories','/admin/categories'],['Authors','/admin/authors']]},
  {label:'Revenue & formats',items:[['Advertisements','/admin/advertisements'],['Videos','/admin/videos'],['Digital Edition','/admin/digital-edition']]},
  {label:'Operations',items:[['Users','/admin/users'],['404 Monitor','/admin/404-monitor'],['Redirects','/admin/redirects'],['Archive Audit','/admin/migration'],['Launch Readiness','/admin/launch'],['Settings','/admin/settings']]}
  ];
}

function AdminMobileNav({active,groups}:{active?:string;groups:Group[]}){
  return <div className="admin-mobile-bar">
    <Link className="admin-mobile-brand" href="/admin">
      <img src="/webfit-news-logo-400.webp" alt="Webfit News"/>
      <span>NEWSROOM</span>
    </Link>
    <Link className="admin-mobile-new" href="/admin/articles/new">New story</Link>
    <details className="admin-mobile-menu">
      <summary aria-label="Open newsroom navigation"><span>Menu</span><b aria-hidden="true">☰</b></summary>
      <div className="admin-mobile-menu-panel">
        {groups.map(group=><section key={group.label}>
          <strong>{group.label}</strong>
          <nav>{group.items.map(([label,href])=><Link key={href} className={active===label?'active':''} href={href}>{label}</Link>)}</nav>
        </section>)}
        <div className="admin-mobile-menu-footer"><Link href="/" target="_blank">Public site</Link><LogoutButton/></div>
      </div>
    </details>
  </div>;
}

async function navFor():Promise<Group[]>{
  try{
    const supabase=await createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)return staffGroups();
    const {data:p}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
    if(p?.role==='volunteer')return volunteerGroups;
    return isWriterRole(p?.role)?writerGroups:staffGroups(isReviewerRole(p?.role));
  }catch{return staffGroups()}
}

export async function AdminShell({children,active}:{children:ReactNode;active?:string}){
  const groups=await navFor();
  return <div className="admin-layout premium-admin">
    <AdminMobileNav active={active} groups={groups}/>
    <aside className={`admin-sidebar premium-sidebar ${styles.sidebar}`}>
      <Link className="admin-brand premium-admin-brand" href="/admin"><img src="/webfit-news-logo-400.webp" alt="Webfit News"/><div><span>WEBFIT</span><strong>NEWSROOM</strong></div></Link>
      <nav className="admin-nav-groups">{groups.map(group=><div className="admin-nav-group" key={group.label}><span>{group.label}</span>{group.items.map(([label,href])=><Link key={href} className={active===label?'active':''} href={href}>{label}</Link>)}</div>)}</nav>
      <div className="admin-sidebar-footer"><Link href="/" target="_blank">Open public website</Link><LogoutButton/><span>Webfit News CMS</span></div>
    </aside>
    <main className="admin-content premium-admin-content">{children}</main>
  </div>;
}

export function AdminHeader({title,description,actions}:{title:string;description?:string;actions?:ReactNode}){
  return <header className="admin-header premium-admin-header"><div><div className="admin-kicker">WEBFIT NEWSROOM</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="admin-header-actions">{actions}</div>}</header>;
}
export function StatusBadge({status}:{status:string}){return <span className={`status-badge status-${status.replaceAll('_','-')}`}>{status.replaceAll('_',' ')}</span>;}
