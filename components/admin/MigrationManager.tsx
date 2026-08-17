'use client';
import { useEffect, useState } from 'react';

type Status={
  counts:Record<string,number>;
  media:{pending:number;migrated:number;skipped:number;failed:number};
  archive?:{locked:boolean;completed:boolean;legacy_videos_optional:boolean};
};

export default function MigrationManager(){
  const[status,setStatus]=useState<Status|null>(null);
  const[error,setError]=useState('');
  async function refresh(){
    setError('');
    const r=await fetch('/api/admin/migration',{cache:'no-store'});
    const d=await r.json().catch(()=>null);
    if(!r.ok){setError(d?.error||'Unable to load archive audit.');return;}
    setStatus(d);
  }
  useEffect(()=>{refresh()},[]);
  const reconciled=(status?.media.migrated||0)+(status?.media.skipped||0);
  return <div className="migration-page">
    {error&&<div className="admin-card migration-message">{error}</div>}
    <div className="architecture-notice">
      <strong>Historical import is locked.</strong>
      <p>The old archive transfer is complete and this screen is now read-only. New stories, media and publishing activity use the Webfit News CMS and Supabase directly.</p>
    </div>
    <div className="migration-counts">
      {[
        ['Articles',status?.counts.articles],['Categories',status?.counts.categories],['Tags',status?.counts.tags],
        ['Media records',status?.counts.media],['Media migrated',status?.media.migrated],['Legacy videos skipped',status?.media.skipped],
        ['Media failures',status?.media.failed]
      ].map(([l,v])=><div key={String(l)}><span>{l}</span><strong>{v??'...'}</strong></div>)}
    </div>
    <div className="admin-card">
      <h2>Archive reconciliation</h2>
      <p className="admin-note">Migrated and intentionally skipped legacy videos must reconcile to the historical media total. Skipped videos are retained as provenance records but are not launch blockers.</p>
      <div className="media-migration-summary">
        <b>{reconciled || '...'} / {status?.counts.media ?? '...'} reconciled</b>
        <b>{status?.media.pending ?? '...'} pending</b>
        <b>{status?.media.failed ?? '...'} failed</b>
      </div>
      <button className="admin-secondary" onClick={refresh}>Refresh audit</button>
    </div>
  </div>
}
