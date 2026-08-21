import { AdminHeader, AdminShell } from '../../../components/admin/AdminShell';
import { getLaunchReadiness } from '../../../lib/admin-data';

function Check({ok,title,detail}:{ok:boolean;title:string;detail:string}){
  return <div className={`launch-check ${ok?'launch-ok':'launch-pending'}`}><strong>{ok?'Ready':'Pending'}: {title}</strong><span>{detail}</span></div>;
}

export default async function LaunchReadiness(){
  const s=await getLaunchReadiness();
  const publication:any=s.publication||{};
  const seo:any=s.seo||{};
  const trust:any=s.trust||{};
  const archive:any=s.archive||{};
  const targetArticles=728;
  const targetMedia=2798;
  const archiveReconciled=s.migratedMedia+s.skippedMedia;

  return <AdminShell active="Launch Readiness">
    <AdminHeader title="Launch Readiness" description="Production gates for the independent Webfit News platform. Migration is complete; this screen now focuses on staging, newsroom access and cutover safety." />
    <div className="admin-stat-grid">
      <div className="admin-stat"><span>Published archive</span><strong>{s.published}</strong><small>Baseline target: {targetArticles}</small></div>
      <div className="admin-stat"><span>Media reconciled</span><strong>{archiveReconciled}</strong><small>{s.migratedMedia} copied, {s.skippedMedia} optional video skipped</small></div>
      <div className="admin-stat"><span>Active redirects</span><strong>{s.redirects}</strong><small>Historical URL preservation</small></div>
      <div className="admin-stat"><span>Super Admins</span><strong>{s.superAdmins}</strong><small>At least one required before staging sign-off</small></div>
    </div>
    <section className="admin-card">
      <h2>Production gates</h2>
      <div className="launch-grid">
        <Check ok={archive.locked===true && archive.completed===true} title="Archive locked" detail="Historical import is complete and mutating import actions are disabled."/>
        <Check ok={s.categories>=60} title="Taxonomy" detail={`${s.categories} categories available in the new database.`}/>
        <Check ok={s.authors>=1} title="Authors" detail={`${s.authors} author profile(s) available.`}/>
        <Check ok={s.published>=targetArticles} title="Published archive" detail={`${s.published} baseline published stories loaded.`}/>
        <Check ok={s.media>=targetMedia} title="Media metadata" detail={`${s.media} of ${targetMedia} baseline media records loaded.`}/>
        <Check ok={archiveReconciled>=targetMedia && s.failedMedia===0} title="Physical media" detail={`${s.migratedMedia} copied, ${s.skippedMedia} optional legacy video skipped, ${s.failedMedia} failures.`}/>
        <Check ok={s.redirects>=13} title="Historical redirects" detail={`${s.redirects} active redirect rules are available to the public request layer.`}/>
        <Check ok={publication.primary_domain==='https://webfitnews.co.nz'} title="Primary domain" detail={publication.primary_domain||'Primary domain has not been configured.'}/>
        <Check ok={Boolean(seo.default_meta_title)} title="SEO defaults" detail={seo.default_meta_title||'Default SEO title is missing.'}/>
        <Check ok={trust.display_media_council===true} title="Trust settings" detail="Editorial trust and Media Council presentation configured."/>
        <Check ok={s.superAdmins>=1} title="Super Admin" detail={s.superAdmins?`${s.superAdmins} active Super Admin account(s).`:'First newsroom administrator has not been created yet.'}/>
        <Check ok={s.activeUsers>=1} title="Newsroom access" detail={`${s.activeUsers} active CMS user(s).`}/>
        <Check ok={Boolean(publication.contact_email)} title="Publication contact" detail={publication.contact_email||'Public newsroom contact email still needs to be configured.'}/>
      </div>
    </section>
    <section className="admin-card launch-warning">
      <h2>Cutover rule</h2>
      <p>Do not change DNS or cancel the previous hosting until the staging production build, health check, Super Admin login, article publishing, scheduled publishing, native image upload, homepage curation, redirects, RSS, sitemaps and a final content delta have all been verified.</p>
    </section>
  </AdminShell>;
}
