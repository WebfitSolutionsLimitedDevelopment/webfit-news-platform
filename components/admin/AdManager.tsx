'use client';
import { useState } from 'react';

export default function AdManager({campaigns,slots}:{campaigns:any[];slots:any[]}){
 const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
 async function createCampaign(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMsg('');const fd=new FormData(e.currentTarget);const body={advertiser_name:fd.get('advertiser_name'),campaign_name:fd.get('campaign_name'),status:fd.get('status'),starts_at:fd.get('starts_at')||null,ends_at:fd.get('ends_at')||null,notes:fd.get('notes')||null};const r=await fetch('/api/admin/ads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();setBusy(false);if(!r.ok){setMsg(j.error||'Could not create campaign');return;}location.reload()}
 async function status(id:string,status:string){setBusy(true);const r=await fetch('/api/admin/ads/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});setBusy(false);if(r.ok)location.reload();else setMsg('Could not update campaign')}
 return <>
  <section className="admin-card"><h2>Create campaign</h2><form className="admin-form-grid" onSubmit={createCampaign}>
   <label>Advertiser<input name="advertiser_name" required/></label><label>Campaign name<input name="campaign_name" required/></label>
   <label>Status<select name="status" defaultValue="draft"><option>draft</option><option>active</option><option>paused</option><option>ended</option></select></label>
   <label>Starts<input name="starts_at" type="datetime-local"/></label><label>Ends<input name="ends_at" type="datetime-local"/></label>
   <label className="admin-span-2">Notes<textarea name="notes" rows={3}/></label><div><button className="admin-primary" disabled={busy}>{busy?'Saving...':'Create campaign'}</button></div>{msg&&<p>{msg}</p>}
  </form></section>
  <section className="admin-card"><h2>Campaigns</h2>{campaigns.length?<table><thead><tr><th>Advertiser</th><th>Campaign</th><th>Status</th><th>Dates</th><th>Action</th></tr></thead><tbody>{campaigns.map(c=><tr key={c.id}><td>{c.advertiser_name}</td><td>{c.campaign_name}</td><td>{c.status}</td><td>{c.starts_at?new Date(c.starts_at).toLocaleDateString('en-NZ'):'-'} to {c.ends_at?new Date(c.ends_at).toLocaleDateString('en-NZ'):'-'}</td><td><select defaultValue={c.status} onChange={e=>status(c.id,e.target.value)} disabled={busy}><option>draft</option><option>active</option><option>paused</option><option>ended</option></select></td></tr>)}</tbody></table>:<div className="admin-empty">No campaigns yet.</div>}</section>
  <section className="admin-card"><h2>Available ad positions</h2><div className="ad-slot-grid">{slots.map(s=><div key={s.id}><strong>{s.label}</strong><code>{s.key}</code><span>{s.recommended_width||'?'} × {s.recommended_height||'?'}</span><small>{s.description}</small></div>)}</div></section>
 </>
}
