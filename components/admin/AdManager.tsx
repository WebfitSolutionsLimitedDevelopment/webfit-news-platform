'use client';

import { FormEvent, useMemo, useState } from 'react';
import MediaUploader from './MediaUploader';

type MediaItem={id:string;filename:string;public_url:string|null;mime_type:string|null;alt_text?:string|null};
type Props={campaigns:any[];slots:any[];creatives:any[];assignments:any[];media:MediaItem[]};

function dateValue(value:FormDataEntryValue|null){
  const raw=String(value||'');
  return raw?new Date(raw).toISOString():null;
}
function mediaTitle(item:MediaItem){
  return (item.mime_type||'').startsWith('video/')?'Video · '+item.filename:'Image · '+item.filename;
}
function localDate(value:string|null){
  return value?new Date(value).toLocaleString('en-NZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Pacific/Auckland'}):'Open';
}

export default function AdManager({campaigns,slots,creatives,assignments,media}:Props){
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const [selectedMediaId,setSelectedMediaId]=useState('');
  const [selectedPosterId,setSelectedPosterId]=useState('');
  const selectedMedia=useMemo(()=>media.find(item=>item.id===selectedMediaId),[media,selectedMediaId]);
  const selectedPoster=useMemo(()=>media.find(item=>item.id===selectedPosterId),[media,selectedPosterId]);

  async function send(path:string,method:'POST'|'PATCH',body:any){
    setBusy(true);setMsg('');
    try{
      const response=await fetch(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok){setMsg(typeof result.error==='string'?result.error:'Could not save this advertising change.');return false;}
      window.location.reload();
      return true;
    }catch(error){
      setMsg(error instanceof Error?error.message:'Network error. Please retry.');
      return false;
    }finally{setBusy(false);}
  }

  async function createCampaign(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    await send('/api/admin/ads','POST',{
      advertiser_name:form.get('advertiser_name'),campaign_name:form.get('campaign_name'),status:form.get('status'),
      starts_at:dateValue(form.get('starts_at')),ends_at:dateValue(form.get('ends_at')),notes:form.get('notes')||null
    });
  }
  async function createCreative(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    await send('/api/admin/ads/creative','POST',{
      campaign_id:form.get('campaign_id'),media_id:form.get('media_id'),poster_media_id:form.get('poster_media_id')||null,
      headline:form.get('headline')||null,destination_url:form.get('destination_url'),alt_text:form.get('alt_text')||null
    });
  }
  async function createAssignment(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    await send('/api/admin/ads/assignment','POST',{
      slot_id:form.get('slot_id'),creative_id:form.get('creative_id'),
      starts_at:dateValue(form.get('starts_at')),ends_at:dateValue(form.get('ends_at')),
      priority:Number(form.get('priority')||100),is_active:true
    });
  }
  async function campaignStatus(id:string,status:string){await send('/api/admin/ads/'+id,'PATCH',{status});}
  async function assignmentStatus(id:string,is_active:boolean){await send('/api/admin/ads/assignment/'+id,'PATCH',{is_active});}

  return <div className="ads-console">
    {msg?<div className="admin-alert" role="alert">{msg}</div>:null}
    <div className="admin-metrics ad-metrics">
      <div><span>Campaigns</span><strong>{campaigns.length}</strong></div>
      <div><span>Creatives</span><strong>{creatives.length}</strong></div>
      <div><span>Enabled placements</span><strong>{assignments.filter(a=>a.is_active).length}</strong></div>
      <div><span>Ad positions</span><strong>{slots.length}</strong></div>
    </div>

    <div className="ad-workflow-grid">
      <section className="admin-card">
        <div className="admin-card-title"><span>01</span><div><h2>Create campaign</h2><p>Set an advertiser, dates and campaign status. Only active campaigns within their dates can appear.</p></div></div>
        <form className="admin-form-grid" onSubmit={createCampaign}>
          <label>Advertiser<input name="advertiser_name" required maxLength={160}/></label>
          <label>Campaign name<input name="campaign_name" required maxLength={160}/></label>
          <label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option></select></label>
          <label>Starts<input name="starts_at" type="datetime-local"/></label>
          <label>Ends<input name="ends_at" type="datetime-local"/></label>
          <label className="admin-span-2">Notes<textarea name="notes" rows={3}/></label>
          <div><button className="admin-primary" disabled={busy}>Create campaign</button></div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-title"><span>02</span><div><h2>Add image or video creative</h2><p>Upload to the Media Library or choose an existing asset.</p></div></div>
        <MediaUploader/>
        <form className="admin-form-grid" onSubmit={createCreative}>
          <label>Campaign<select name="campaign_id" required defaultValue=""><option value="">Choose campaign</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.campaign_name} · {c.status}</option>)}</select></label>
          <label>Creative image or video<select name="media_id" required value={selectedMediaId} onChange={event=>setSelectedMediaId(event.target.value)}><option value="">Choose media</option>{media.map(item=><option key={item.id} value={item.id}>{mediaTitle(item)}</option>)}</select></label>
          {selectedMedia?.mime_type?.startsWith('video/')?<label className="admin-span-2">Optional video poster image<select name="poster_media_id" value={selectedPosterId} onChange={event=>setSelectedPosterId(event.target.value)}><option value="">Use video frame</option>{media.filter(item=>(item.mime_type||'').startsWith('image/')).map(item=><option key={item.id} value={item.id}>{item.filename}</option>)}</select></label>:null}
          <label className="admin-span-2">Headline<input name="headline" maxLength={160} placeholder="Optional campaign headline"/></label>
          <label className="admin-span-2">Destination URL<input name="destination_url" type="url" required placeholder="https://advertiser.co.nz/"/></label>
          <label className="admin-span-2">Image alt text<input name="alt_text" maxLength={240} placeholder="Describe the advertisement image"/></label>
          {selectedMedia?<div className="ad-creative-preview admin-span-2" aria-label="Creative preview">
            <span>Preview · {(selectedMedia.mime_type||'').startsWith('video/')?'Video':'Image'}</span>
            {(selectedMedia.mime_type||'').startsWith('video/')
              ?<video src={selectedMedia.public_url||undefined} controls muted playsInline preload="metadata" poster={selectedPoster?.public_url||undefined}/>
              :<img src={selectedMedia.public_url||''} alt={selectedMedia.alt_text||''}/>}
          </div>:null}
          <div><button className="admin-primary" disabled={busy||!campaigns.length||!media.length}>Save creative</button></div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-title"><span>03</span><div><h2>Place advertisement</h2><p>Choose a page position, dates and rotation priority.</p></div></div>
        <form className="admin-form-grid" onSubmit={createAssignment}>
          <label>Ad position<select name="slot_id" required defaultValue=""><option value="">Choose position</option>{slots.map(slot=><option key={slot.id} value={slot.id}>{slot.label} ({slot.key})</option>)}</select></label>
          <label>Creative<select name="creative_id" required defaultValue=""><option value="">Choose creative</option>{creatives.map(creative=><option key={creative.id} value={creative.id}>{creative.headline||creative.media?.filename||creative.id.slice(0,8)}</option>)}</select></label>
          <label>Starts<input name="starts_at" type="datetime-local"/></label>
          <label>Ends<input name="ends_at" type="datetime-local"/></label>
          <label>Priority<input name="priority" type="number" defaultValue="100" min="0" max="1000"/></label>
          <div><button className="admin-primary" disabled={busy||!creatives.length}>Save placement</button></div>
        </form>
      </section>
    </div>

    <section className="admin-card">
      <div className="admin-card-head"><h2>Campaigns</h2><span className="admin-note">Changing campaign status takes effect on the public site.</span></div>
      {campaigns.length?<div className="admin-table-wrap"><table><thead><tr><th>Advertiser</th><th>Campaign</th><th>Status</th><th>Campaign dates</th><th>Change status</th></tr></thead><tbody>
        {campaigns.map(c=><tr key={c.id}><td>{c.advertiser_name}</td><td>{c.campaign_name}</td><td><span className={'status-badge status-'+c.status}>{c.status}</span></td><td>{localDate(c.starts_at)} to {localDate(c.ends_at)}</td><td><select value={c.status} onChange={event=>campaignStatus(c.id,event.target.value)} disabled={busy}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option></select></td></tr>)}
      </tbody></table></div>:<div className="admin-empty">No campaigns yet. Start with step 01 above.</div>}
    </section>

    <section className="admin-card">
      <div className="admin-card-head"><h2>Placements</h2><span className="admin-note">Pause a placement to remove it from every page using that position.</span></div>
      {assignments.length?<div className="admin-table-wrap"><table><thead><tr><th>Position</th><th>Advertiser / campaign</th><th>Creative</th><th>Dates</th><th>Priority</th><th>Status</th></tr></thead><tbody>
        {assignments.map(a=><tr key={a.id}><td>{a.slot?.label||'Ad position'}<small>{a.slot?.key}</small></td><td>{a.creative?.campaign?.campaign_name||'Campaign'}</td><td>{a.creative?.headline||a.creative?.media?.filename||'Creative'}</td><td>{localDate(a.starts_at)} to {localDate(a.ends_at)}</td><td>{a.priority}</td><td><button type="button" className="admin-primary ad-small-button" disabled={busy} onClick={()=>assignmentStatus(a.id,!a.is_active)}>{a.is_active?'Pause':'Enable'}</button></td></tr>)}
      </tbody></table></div>:<div className="admin-empty">No placements assigned yet.</div>}
    </section>

    <section className="admin-card">
      <div className="admin-card-head"><h2>Advertising inventory</h2><span className="admin-note">Positions are responsive unless a mobile-only label is shown.</span></div>
      <div className="ad-slot-grid">{slots.map(slot=><div key={slot.id}><strong>{slot.label}</strong><code>{slot.key}</code><span>{slot.recommended_width||'?'} × {slot.recommended_height||'?'}</span><small>{slot.allowed_devices?.join(', ')||'All devices'}</small><small>{slot.description}</small></div>)}</div>
    </section>
  </div>;
}
