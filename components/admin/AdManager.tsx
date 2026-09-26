'use client';

import { useMemo, useState } from 'react';
import { IMAGE_TYPES, prepareAdImage, SLOT_GUIDE, fmtDate, placementState, readImageSize, readVideoInfo, checkFile, uploadToMedia } from '@/lib/ad-upload-client';
import styles from './AdManager.module.css';
import { AdList, QuickAdForm } from './QuickAd';

type Any = Record<string, any>;

function FilePick({ id, label, hint, accept, file, onChange, error, info }: { id: string; label: string; hint: string; accept: string; file: File | null; onChange: (f: File | null) => void; error?: string; info?: string }) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  return <label className={styles.drop} htmlFor={id}>
    <span className={styles.dropLabel}>{label}</span>
    <input id={id} type="file" accept={accept} onChange={e => onChange(e.target.files?.[0] || null)}/>
    {file ? (file.type.startsWith('video/')
      ? <video className={styles.preview} src={preview} muted controls playsInline/>
      : <img className={styles.preview} src={preview} alt=""/>) : null}
    <small>{file ? `${file.name} · ${(file.size / 1048576).toFixed(2)} MB${info ? ` · ${info}` : ''}` : hint}</small>
    {error ? <em className={styles.fileError}>{error}</em> : null}
  </label>;
}

export default function AdManager({ campaigns, slots, creatives, assignments, performance }: { campaigns: Any[]; slots: Any[]; creatives: Any[]; assignments: Any[]; performance: Any[] }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');

  // Creative form state
  const [format, setFormat] = useState<'image' | 'video'>('image');
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [fileInfo, setFileInfo] = useState<Record<string, string>>({});
  const [election, setElection] = useState(false);

  // Placement form state
  const [chosenSlots, setChosenSlots] = useState<string[]>([]);

  const stats = useMemo(() => new Map(performance.map(p => [p.creative_id, p])), [performance]);
  const campaignById = useMemo(() => new Map(campaigns.map(c => [c.id, c])), [campaigns]);
  const creativeById = useMemo(() => new Map(creatives.map(c => [c.id, c])), [creatives]);
  const activeSlots = slots.filter(s => s.is_active);
  const liveCount = assignments.filter(a => placementState(a, campaignById.get(creativeById.get(a.creative_id)?.campaign_id)).label === 'Live').length;
  const totals = performance.reduce((t, p) => ({ imp: t.imp + Number(p.impressions || 0), clk: t.clk + Number(p.clicks || 0) }), { imp: 0, clk: 0 });

  function flash(text: string) { setOk(text); setMsg(''); setTimeout(() => location.reload(), 900); }

  async function send(path: string, method: string, body?: unknown) {
    setBusy(true); setMsg(''); setOk('');
    const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsg(typeof j.error === 'string' ? j.error : 'Could not save. Check the form and try again.'); return null; }
    return j;
  }

  async function pick(key: string, picked: File | null, kind: 'image' | 'video', set: (f: File | null) => void) {
    const file = picked && kind === 'image' && IMAGE_TYPES.includes(picked.type) ? await prepareAdImage(picked) : picked;
    set(file);
    const error = await checkFile(file, kind);
    setFileErrors(e => ({ ...e, [key]: error }));
    let info = '';
    if (file && !error) {
      if (kind === 'image') { const s = await readImageSize(file); info = s.w ? `${s.w}×${s.h}px` : ''; }
      else { const v = await readVideoInfo(file); info = v.seconds ? `${Math.round(v.seconds)}s · ${v.w}×${v.h}` : ''; }
    }
    setFileInfo(i => ({ ...i, [key]: info }));
  }

  async function createCampaign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const toIso = (v: FormDataEntryValue | null) => (v ? new Date(String(v)).toISOString() : null);
    const r = await send('/api/admin/ads', 'POST', { advertiser_name: fd.get('advertiser_name'), campaign_name: fd.get('campaign_name'), status: fd.get('status'), starts_at: toIso(fd.get('starts_at')), ends_at: toIso(fd.get('ends_at')), notes: fd.get('notes') || null });
    if (r) flash('Campaign created. Now add the artwork in step 02.');
  }

  async function createCreative(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (Object.values(fileErrors).some(Boolean)) { setMsg('Fix the file problems shown in red first.'); return; }
    if (format === 'image' && !desktopFile) { setMsg('Choose the desktop artwork.'); return; }
    if (format === 'video' && !videoFile) { setMsg('Choose the MP4 video.'); return; }
    const alt = String(fd.get('alt_text') || fd.get('headline') || '');
    setBusy(true); setMsg(''); setOk('Uploading files…');
    try {
      const media_id = desktopFile ? await uploadToMedia(desktopFile, alt) : null;
      const mobile_media_id = format === 'image' && mobileFile ? await uploadToMedia(mobileFile, alt) : null;
      const video_media_id = format === 'video' && videoFile ? await uploadToMedia(videoFile, alt) : null;
      const poster_media_id = format === 'video' && posterFile ? await uploadToMedia(posterFile, alt) : null;
      setBusy(false);
      const r = await send('/api/admin/ads/creative', 'POST', {
        campaign_id: fd.get('campaign_id'), format, media_id, mobile_media_id, video_media_id, poster_media_id,
        headline: fd.get('headline') || null, destination_url: fd.get('destination_url'), alt_text: fd.get('alt_text') || null,
        cta_label: fd.get('cta_label') || null, is_election_ad: election,
        promoter_statement: election ? fd.get('promoter_statement') || null : null,
        authorisation_reference: election ? fd.get('authorisation_reference') || null : null,
      });
      if (r) flash('Creative saved. Place it on the site in step 03.');
    } catch (err: any) {
      setBusy(false); setOk(''); setMsg(err?.message || 'Upload failed.');
    }
  }

  async function createPlacement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!chosenSlots.length) { setMsg('Tick at least one position.'); return; }
    const toIso = (v: FormDataEntryValue | null) => (v ? new Date(String(v)).toISOString() : null);
    const r = await send('/api/admin/ads/assignment', 'POST', { slot_ids: chosenSlots, creative_id: fd.get('creative_id'), device: fd.get('device'), starts_at: toIso(fd.get('starts_at')), ends_at: toIso(fd.get('ends_at')), priority: Number(fd.get('priority') || 100), is_active: true });
    if (r) flash(`Published to ${chosenSlots.length} position${chosenSlots.length > 1 ? 's' : ''}. It is live on the site now.`);
  }

  async function patchPlacement(id: string, body: Any, done: string) { const r = await send(`/api/admin/ads/assignment/${id}`, 'PATCH', body); if (r) flash(done); }
  async function setCampaignStatus(id: string, status: string) { const r = await send(`/api/admin/ads/${id}`, 'PATCH', { status }); if (r) flash(`Campaign set to ${status}.`); }
  async function deleteCreative(id: string) { const r = await send(`/api/admin/ads/creative/${id}`, 'DELETE'); if (r) flash('Creative deleted.'); }

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return <div className="ads-console">
    <QuickAdForm slots={slots}/>
    <AdList campaigns={campaigns} creatives={creatives} assignments={assignments} performance={performance} slots={slots}/>

    <details className={styles.advanced}>
    <summary>Advanced tools <span>campaigns with several ads, separate phone artwork, individual placements, rotation</span></summary>
    {msg ? <div className="admin-alert" role="alert">{msg}</div> : null}
    {ok ? <div className={styles.ok} role="status">{ok}</div> : null}

    <div className="admin-metrics ad-metrics">
      <div><span>Live placements</span><strong>{liveCount}</strong></div>
      <div><span>Campaigns</span><strong>{campaigns.length}</strong></div>
      <div><span>Impressions, 30 days</span><strong>{totals.imp.toLocaleString('en-NZ')}</strong></div>
      <div><span>Clicks, 30 days</span><strong>{totals.clk.toLocaleString('en-NZ')}</strong></div>
    </div>

    <div className={styles.steps}>
      <section className="admin-card">
        <div className="admin-card-title"><span>01</span><div><h2>Campaign</h2><p>Who is advertising and for how long. One campaign can hold several ads.</p></div></div>
        <form className="admin-form-grid" onSubmit={createCampaign}>
          <label htmlFor="ad-advertiser">Advertiser<input id="ad-advertiser" name="advertiser_name" required placeholder="Business name"/></label>
          <label htmlFor="ad-campaign">Campaign name<input id="ad-campaign" name="campaign_name" required placeholder="e.g. Home loans, spring 2026"/></label>
          <label htmlFor="ad-status">Status<select id="ad-status" name="status" defaultValue="active"><option value="active">Active</option><option value="draft">Draft</option><option value="paused">Paused</option><option value="ended">Ended</option></select></label>
          <span/>
          <label htmlFor="ad-camp-start">Starts<input id="ad-camp-start" name="starts_at" type="datetime-local"/></label>
          <label htmlFor="ad-camp-end">Ends<input id="ad-camp-end" name="ends_at" type="datetime-local"/></label>
          <label className="admin-span-2" htmlFor="ad-notes">Notes (private)<textarea id="ad-notes" name="notes" rows={2} placeholder="Invoice number, contact, agreed price"/></label>
          <div><button className="admin-primary" disabled={busy}>Create campaign</button></div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-title"><span>02</span><div><h2>Creative</h2><p>Upload the image or video. Files go straight to Media.</p></div></div>
        <form className="admin-form-grid" onSubmit={createCreative}>
          <label className="admin-span-2" htmlFor="ad-creative-campaign">Campaign<select id="ad-creative-campaign" name="campaign_id" required><option value="">Choose campaign</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.advertiser_name}: {c.campaign_name}</option>)}</select></label>
          <div className={`admin-span-2 ${styles.segment}`} role="radiogroup" aria-label="Ad format">
            <button type="button" role="radio" aria-checked={format === 'image'} className={format === 'image' ? styles.segOn : ''} onClick={() => setFormat('image')}>Image</button>
            <button type="button" role="radio" aria-checked={format === 'video'} className={format === 'video' ? styles.segOn : ''} onClick={() => setFormat('video')}>Video (30 or 60 sec)</button>
          </div>
          {format === 'image' ? <>
            <FilePick id="ad-file-desktop" label="Desktop artwork" hint="Required. 970×250, 728×90 or 300×600. JPG, PNG, WebP or GIF, any size (resized automatically)." accept={IMAGE_TYPES.join(',')} file={desktopFile} onChange={f => pick('desktop', f, 'image', setDesktopFile)} error={fileErrors.desktop} info={fileInfo.desktop}/>
            <FilePick id="ad-file-mobile" label="Mobile artwork" hint="Optional but recommended. 300×250 (or 320×50 for the sticky bar). Without it, phones get the desktop artwork shrunk down." accept={IMAGE_TYPES.join(',')} file={mobileFile} onChange={f => pick('mobile', f, 'image', setMobileFile)} error={fileErrors.mobile} info={fileInfo.mobile}/>
          </> : <>
            <FilePick id="ad-file-video" label="Video file" hint="Required. MP4, 60 seconds or less, under 50 MB. 16:9 works everywhere; add captions, most people watch muted." accept="video/mp4" file={videoFile} onChange={f => pick('video', f, 'video', setVideoFile)} error={fileErrors.video} info={fileInfo.video}/>
            <FilePick id="ad-file-poster" label="Cover image" hint="Optional. Shown before the video plays. Same shape as the video." accept={IMAGE_TYPES.join(',')} file={posterFile} onChange={f => pick('poster', f, 'image', setPosterFile)} error={fileErrors.poster} info={fileInfo.poster}/>
          </>}
          <label htmlFor="ad-headline">Headline or advertiser line<input id="ad-headline" name="headline" maxLength={160} placeholder="Shown beside video ads"/></label>
          <label htmlFor="ad-cta">Button text<input id="ad-cta" name="cta_label" maxLength={40} placeholder="Learn more"/></label>
          <label className="admin-span-2" htmlFor="ad-url">Click-through address<input id="ad-url" name="destination_url" type="url" required placeholder="https://advertiser.co.nz/offer"/></label>
          <label className="admin-span-2" htmlFor="ad-alt">Description for screen readers<input id="ad-alt" name="alt_text" maxLength={240} placeholder="What the ad says, e.g. Home loans from 4.99%"/></label>
          <label className="admin-span-2" htmlFor="ad-election"><input id="ad-election" type="checkbox" checked={election} onChange={e => setElection(e.target.checked)}/> This is an election advertisement</label>
          {election ? <>
            <label className="admin-span-2" htmlFor="ad-promoter">Promoter statement (shown under the ad)<input id="ad-promoter" name="promoter_statement" required placeholder="Promoted by Jane Smith, 1 Queen Street, Auckland"/></label>
            <label className="admin-span-2" htmlFor="ad-auth">Written authorisation on file<input id="ad-auth" name="authorisation_reference" placeholder="e.g. Email from candidate, 3 Oct 2026, saved in Drive/Ads/Election"/></label>
            <p className={`admin-span-2 admin-note ${styles.warn}`}>Election ads are labelled &quot;Election advertisement&quot; and stop showing automatically on election day, 7 November 2026.</p>
          </> : null}
          <div><button className="admin-primary" disabled={busy || !campaigns.length}>{busy ? 'Saving…' : 'Upload and save creative'}</button></div>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card-title"><span>03</span><div><h2>Place on the site</h2><p>Tick every position this ad should appear in. If a position has several ads, they take turns.</p></div></div>
        <form className="admin-form-grid" onSubmit={createPlacement}>
          <label className="admin-span-2" htmlFor="ad-place-creative">Creative<select id="ad-place-creative" name="creative_id" required><option value="">Choose creative</option>{creatives.map(c => <option key={c.id} value={c.id}>{c.campaign?.advertiser_name || 'Ad'}: {c.headline || (c.format === 'video' ? 'Video' : c.media?.filename) || c.id.slice(0, 8)}</option>)}</select></label>
          <fieldset className={`admin-span-2 ${styles.slotPick}`}>
            <legend>Positions</legend>
            {activeSlots.map(s => {
              const g = SLOT_GUIDE[s.key];
              const checked = chosenSlots.includes(s.id);
              return <label key={s.id} className={checked ? styles.slotOn : ''} htmlFor={`ad-slot-${s.key}`}>
                <input id={`ad-slot-${s.key}`} type="checkbox" checked={checked} onChange={e => setChosenSlots(v => e.target.checked ? [...v, s.id] : v.filter(x => x !== s.id))}/>
                <span><b>{s.label}</b><small>{g?.where || s.description}</small><small>Desktop {g?.desktop || '-'} · Mobile {g?.mobile || '-'}{g?.video ? ' · Video OK' : ''}</small></span>
              </label>;
            })}
          </fieldset>
          <label htmlFor="ad-device">Show on<select id="ad-device" name="device" defaultValue="all"><option value="all">Desktop and mobile</option><option value="desktop">Desktop only</option><option value="mobile">Mobile only</option></select></label>
          <label htmlFor="ad-weight">Share of turns<select id="ad-weight" name="priority" defaultValue="100"><option value="100">Normal</option><option value="200">Double</option><option value="400">Four times</option><option value="50">Half</option></select></label>
          <label htmlFor="ad-place-start">Starts<input id="ad-place-start" name="starts_at" type="datetime-local"/></label>
          <label htmlFor="ad-place-end">Ends<input id="ad-place-end" name="ends_at" type="datetime-local"/></label>
          <div><button className="admin-primary" disabled={busy || !creatives.length}>Publish placement</button></div>
        </form>
      </section>
    </div>

    <section className="admin-card">
      <div className="admin-card-head"><h2>Placements</h2><span className="admin-note">Figures are the last 30 days, for the whole creative.</span></div>
      {assignments.length ? <div className="admin-table-wrap"><table>
        <thead><tr><th>Ad</th><th>Position</th><th>Shows on</th><th>Dates</th><th>Status</th><th>Views</th><th>Clicks</th><th>Action</th></tr></thead>
        <tbody>{assignments.map(a => {
          const cr = creativeById.get(a.creative_id);
          const camp = campaignById.get(cr?.campaign_id);
          const st = placementState(a, camp);
          const p = stats.get(a.creative_id);
          return <tr key={a.id}>
            <td><div className={styles.adCell}>{cr?.format === 'video' ? <span className={styles.vidThumb}>Video</span> : <img src={cr?.media?.public_url} alt=""/>}<span><b>{camp?.advertiser_name || 'Ad'}</b><small>{cr?.headline || camp?.campaign_name}</small></span></div></td>
            <td>{a.slot?.label}<small>{a.slot?.key}</small></td>
            <td>{a.device === 'all' ? 'All' : a.device === 'desktop' ? 'Desktop' : 'Mobile'}</td>
            <td>{fmtDate(a.starts_at)} to {fmtDate(a.ends_at)}</td>
            <td><span className={`status-badge ${st.cls}`}>{st.label}</span></td>
            <td className={styles.num}>{Number(p?.impressions || 0).toLocaleString('en-NZ')}</td>
            <td className={styles.num}>{Number(p?.clicks || 0).toLocaleString('en-NZ')}</td>
            <td className={styles.actions}>
              {st.label === 'Ended' ? null : a.is_active
                ? <button type="button" disabled={busy} onClick={() => patchPlacement(a.id, { is_active: false }, 'Placement paused.')}>Pause</button>
                : <button type="button" disabled={busy} onClick={() => patchPlacement(a.id, { is_active: true }, 'Placement resumed.')}>Resume</button>}
              {st.label === 'Ended' ? null : <button type="button" disabled={busy} onClick={() => patchPlacement(a.id, { end_now: true }, 'Placement ended.')}>End now</button>}
            </td>
          </tr>;
        })}</tbody>
      </table></div> : <div className="admin-empty">Nothing placed yet. Finish steps 01 to 03 above.</div>}
    </section>

    <section className="admin-card">
      <div className="admin-card-head"><h2>Creatives</h2><span className="admin-note">Views count when half the ad is on screen for a second.</span></div>
      {creatives.length ? <div className={styles.creativeGrid}>{creatives.map(c => {
        const p = stats.get(c.id);
        const imp = Number(p?.impressions || 0), clk = Number(p?.clicks || 0);
        return <article key={c.id} className={styles.creative}>
          <div className={styles.creativeMedia}>
            {c.format === 'video' && c.video?.public_url ? <video src={c.video.public_url} poster={c.poster?.public_url || c.media?.public_url} muted controls playsInline preload="metadata"/> : c.media?.public_url ? <img src={c.media.public_url} alt={c.alt_text || ''}/> : <span>No artwork</span>}
          </div>
          <div className={styles.creativeBody}>
            <b>{c.campaign?.advertiser_name}</b>
            <small>{c.campaign?.campaign_name} · {c.format === 'video' ? 'Video' : c.mobile?.public_url ? 'Image, desktop + mobile' : 'Image, desktop only'}{c.is_election_ad ? ' · Election ad' : ''}</small>
            <small className={styles.url}>{c.destination_url}</small>
            <div className={styles.creativeStats}>
              <span><b>{imp.toLocaleString('en-NZ')}</b> views</span>
              <span><b>{clk.toLocaleString('en-NZ')}</b> clicks</span>
              <span><b>{imp ? ((clk / imp) * 100).toFixed(2) : '0.00'}%</b> CTR</span>
              {c.format === 'video' ? <span><b>{Number(p?.video_completes || 0)}</b> of {Number(p?.video_starts || 0)} watched to the end</span> : null}
            </div>
            {confirmDelete === c.id
              ? <div className={styles.confirm}><span>Delete this creative, its placements and its figures?</span><button type="button" onClick={() => deleteCreative(c.id)} disabled={busy}>Delete</button><button type="button" onClick={() => setConfirmDelete(null)}>Keep</button></div>
              : <button type="button" className={styles.linkBtn} onClick={() => setConfirmDelete(c.id)}>Delete creative</button>}
          </div>
        </article>;
      })}</div> : <div className="admin-empty">No creatives yet.</div>}
    </section>

    <section className="admin-card">
      <div className="admin-card-head"><h2>Campaigns</h2><span className="admin-note">Only active campaigns show on the site.</span></div>
      {campaigns.length ? <div className="admin-table-wrap"><table><thead><tr><th>Advertiser</th><th>Campaign</th><th>Status</th><th>Dates</th><th>Change status</th></tr></thead><tbody>{campaigns.map(c => <tr key={c.id}><td>{c.advertiser_name}</td><td>{c.campaign_name}</td><td><span className={`status-badge status-${c.status}`}>{c.status}</span></td><td>{fmtDate(c.starts_at)} to {fmtDate(c.ends_at)}</td><td><select aria-label={`Status for ${c.campaign_name}`} defaultValue={c.status} onChange={e => setCampaignStatus(c.id, e.target.value)} disabled={busy}><option>draft</option><option>active</option><option>paused</option><option>ended</option></select></td></tr>)}</tbody></table></div> : <div className="admin-empty">No campaigns yet. Start with step 01 above.</div>}
    </section>

    <section className="admin-card">
      <div className="admin-card-head"><h2>Where ads appear</h2><span className="admin-note">Positions with nothing booked stay hidden, so readers never see empty boxes.</span></div>
      <div className="ad-slot-grid">{activeSlots.map(s => { const g = SLOT_GUIDE[s.key]; return <div key={s.id}><strong>{s.label}</strong><code>{s.key}</code><span>Desktop {g?.desktop || `${s.recommended_width}×${s.recommended_height}`}</span><span>Mobile {g?.mobile || '-'}</span><small>{g?.where || s.description}</small></div>; })}</div>
    </section>
    </details>
  </div>;
}
