'use client';

import { useMemo, useState } from 'react';
import { IMAGE_TYPES, SLOT_GUIDE, checkFile, prepareAdImage, readImageSize, readVideoInfo, recommendPlacements, uploadToMedia, type Placement } from '@/lib/ad-upload-client';
import styles from './AdManager.module.css';

type Any = Record<string, any>;

const PLACE_OPTIONS: { key: string; label: string }[] = [
  { key: 'ARTICLE_RAIL', label: 'Stories: right-hand column (desktop)' },
  { key: 'ARTICLE_INLINE_1', label: 'Stories: after paragraph 3' },
  { key: 'ARTICLE_INLINE_2', label: 'Stories: after paragraph 8' },
  { key: 'ARTICLE_BOTTOM', label: 'Stories: end of story' },
  { key: 'MOBILE_STICKY', label: 'Stories: bar at bottom of phone screen' },
  { key: 'HEADER_LEADERBOARD', label: 'Top of homepage and stories (desktop)' },
  { key: 'HOME_AFTER_HERO', label: 'Homepage: after lead stories' },
  { key: 'HOME_MIDDLE', label: 'Homepage: middle' },
  { key: 'HOME_SIDEBAR_1', label: 'Homepage: further down (phones)' },
  { key: 'CATEGORY_TOP', label: 'Top of section pages' },
];

const DEVICE_LABEL = { all: 'Desktop + phone', desktop: 'Desktop only', mobile: 'Phone only' } as const;

/** "tickety.co.nz" or "www.tickety.co.nz" -> "https://www.tickety.co.nz". */
function normaliseLink(value: string) {
  const v = value.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`;
}

function todayPlus(days: number) {
  const d = new Date(Date.now() + days * 86400000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function toDateInput(iso?: string | null) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}

function niceDate(iso?: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-NZ', { timeZone: 'Pacific/Auckland', day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry';
}

export function QuickAdForm({ slots }: { slots: Any[] }) {
  const activeKeys = useMemo(() => new Set(slots.filter(s => s.is_active).map(s => s.key)), [slots]);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<'image' | 'video'>('image');
  const [info, setInfo] = useState('');
  const [fileError, setFileError] = useState('');
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [expires, setExpires] = useState(todayPlus(30));
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [showPlaces, setShowPlaces] = useState(false);
  const [election, setElection] = useState(false);
  const [promoter, setPromoter] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  async function onFile(picked: File | null) {
    let f = picked;
    setMsg(''); setOk(''); setInfo(''); setFileError('');
    if (!f) { setFile(null); setPlacements([]); return; }
    const k: 'image' | 'video' = f.type.startsWith('video/') ? 'video' : 'image';
    setKind(k);
    // Big photos and PNG posters are shrunk here, before the size check, so they are never refused for being too large.
    if (k === 'image' && IMAGE_TYPES.includes(f.type)) f = await prepareAdImage(f);
    setFile(f);
    const err = await checkFile(f, k);
    setFileError(err);
    if (err) return;
    let w = 0, h = 0;
    if (k === 'image') { const s = await readImageSize(f); w = s.w; h = s.h; setInfo(`${w}×${h}px`); }
    else { const v = await readVideoInfo(f); w = v.w; h = v.h; setInfo(`${Math.round(v.seconds)} seconds`); }
    setPlacements(recommendPlacements(k, w, h).filter(p => activeKeys.has(p.key)));
  }

  function toggle(key: string, on: boolean) {
    setPlacements(list => on ? [...list, { key, device: key === 'ARTICLE_RAIL' || key === 'HEADER_LEADERBOARD' ? 'desktop' : key === 'MOBILE_STICKY' || key === 'HOME_SIDEBAR_1' ? 'mobile' : 'all' }] : list.filter(p => p.key !== key));
  }

  function setDevice(key: string, device: Placement['device']) {
    setPlacements(list => list.map(p => p.key === key ? { ...p, device } : p));
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setMsg(''); setOk('');
    if (!file) { setMsg('Choose the image or video first.'); return; }
    if (fileError) { setMsg(fileError); return; }
    if (!placements.length) { setMsg('Choose at least one place for the ad.'); setShowPlaces(true); return; }
    setBusy(true); setOk('Uploading…');
    try {
      const mediaId = await uploadToMedia(file, name);
      const r = await fetch('/api/admin/ads/quick', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, format: kind, media_id: kind === 'image' ? mediaId : null, video_media_id: kind === 'video' ? mediaId : null, destination_url: normaliseLink(link), expires_on: expires, placements, is_election_ad: election, promoter_statement: election ? promoter : '' }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Could not publish the ad.');
      setOk(`Published. "${name}" is live now and comes down automatically after ${niceDate(new Date(expires + 'T12:00:00').toISOString())}.`);
      setTimeout(() => location.reload(), 1400);
    } catch (err: any) {
      setOk(''); setMsg(err?.message || 'Could not publish the ad.');
      setBusy(false);
    }
  }

  return <section className={`admin-card ${styles.quick}`}>
    <div className={styles.quickHead}>
      <div><h2>Add an ad</h2><p>Upload the poster, banner or video, give it a name and an end date. It goes live straight away and comes down by itself.</p></div>
    </div>
    {msg ? <div className="admin-alert" role="alert">{msg}</div> : null}
    {ok ? <div className={styles.ok} role="status">{ok}</div> : null}
    <form onSubmit={publish} className={styles.quickGrid}>
      <label className={styles.quickDrop} htmlFor="quick-file">
        {file ? (kind === 'video' ? <video src={preview} muted controls playsInline/> : <img src={preview} alt=""/>) : <span className={styles.quickDropHint}><b>Choose image or video</b><small>Any size JPG, PNG, WebP or GIF (resized automatically), or MP4 up to 60 seconds</small></span>}
        <input id="quick-file" type="file" accept={[...IMAGE_TYPES, 'video/mp4'].join(',')} onChange={e => onFile(e.target.files?.[0] || null)}/>
        {file ? <small>{file.name}{info ? ` · ${info}` : ''} · click to change</small> : null}
        {fileError ? <em className={styles.fileError}>{fileError}</em> : null}
      </label>

      <div className={styles.quickFields}>
        <label htmlFor="quick-name">Ad name<input id="quick-name" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={120} placeholder="e.g. Bank of Baroda festive offers"/></label>
        <label htmlFor="quick-expires">Show until (last day)<input id="quick-expires" type="date" value={expires} min={todayPlus(0)} onChange={e => setExpires(e.target.value)} required/></label>
        <label htmlFor="quick-link">Link when clicked <span className={styles.optional}>optional</span><input id="quick-link" type="text" inputMode="url" autoComplete="url" value={link} onChange={e => setLink(e.target.value)} onBlur={() => setLink(v => normaliseLink(v))} placeholder="advertiser.co.nz"/></label>

        <div className={styles.whereBox}>
          <div className={styles.whereHead}>
            <b>Where it shows</b>
            <button type="button" className={styles.linkBtnDark} onClick={() => setShowPlaces(v => !v)}>{showPlaces ? 'Done' : 'Change'}</button>
          </div>
          {!showPlaces ? (placements.length
            ? <ul className={styles.wherePills}>{placements.map(p => <li key={p.key}>{PLACE_OPTIONS.find(o => o.key === p.key)?.label || p.key}<span>{DEVICE_LABEL[p.device]}</span></li>)}</ul>
            : <small className={styles.muted}>{file ? 'Nothing chosen yet. Click Change.' : 'Picked automatically from the shape of your file.'}</small>)
            : <div className={styles.whereList}>{PLACE_OPTIONS.filter(o => activeKeys.has(o.key)).map(o => {
              const current = placements.find(p => p.key === o.key);
              return <div key={o.key} className={current ? styles.whereOn : ''}>
                <label htmlFor={`quick-place-${o.key}`}><input id={`quick-place-${o.key}`} type="checkbox" checked={Boolean(current)} onChange={e => toggle(o.key, e.target.checked)}/> {o.label}<small>{SLOT_GUIDE[o.key] ? `Best size: desktop ${SLOT_GUIDE[o.key].desktop}, phone ${SLOT_GUIDE[o.key].mobile}` : ''}</small></label>
                {current ? <select aria-label={`Devices for ${o.label}`} value={current.device} onChange={e => setDevice(o.key, e.target.value as Placement['device'])}><option value="all">Desktop + phone</option><option value="desktop">Desktop only</option><option value="mobile">Phone only</option></select> : null}
              </div>;
            })}</div>}
        </div>

        <label className={styles.inlineCheck} htmlFor="quick-election"><input id="quick-election" type="checkbox" checked={election} onChange={e => setElection(e.target.checked)}/> Election advertisement</label>
        {election ? <label htmlFor="quick-promoter">Promoter statement<input id="quick-promoter" value={promoter} onChange={e => setPromoter(e.target.value)} required placeholder="Promoted by Jane Smith, 1 Queen Street, Auckland"/></label> : null}

        <button className="admin-primary" disabled={busy || !file}>{busy ? 'Publishing…' : 'Publish ad'}</button>
      </div>
    </form>
  </section>;
}

export function AdList({ campaigns, creatives, assignments, performance, slots }: { campaigns: Any[]; creatives: Any[]; assignments: Any[]; performance: Any[]; slots: Any[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const slotLabel = useMemo(() => new Map(slots.map(s => [s.id, s.key])), [slots]);
  const stats = useMemo(() => new Map(performance.map(p => [p.creative_id, p])), [performance]);

  const rows = campaigns.map(c => {
    const crs = creatives.filter(x => x.campaign_id === c.id);
    const crIds = new Set(crs.map(x => x.id));
    const places = assignments.filter(a => crIds.has(a.creative_id) && a.is_active);
    const views = crs.reduce((t, x) => t + Number(stats.get(x.id)?.impressions || 0), 0);
    const clicks = crs.reduce((t, x) => t + Number(stats.get(x.id)?.clicks || 0), 0);
    const expired = c.ends_at && new Date(c.ends_at).getTime() < Date.now();
    const status = expired ? 'Expired' : c.status === 'active' ? (places.length ? 'Live' : 'Not placed') : c.status === 'paused' ? 'Paused' : c.status === 'ended' ? 'Ended' : 'Draft';
    return { c, crs, places, views, clicks, status };
  }).sort((a, b) => (a.status === 'Live' ? 0 : 1) - (b.status === 'Live' ? 0 : 1));

  async function call(id: string, method: 'PATCH' | 'DELETE', body?: Any) {
    setBusy(id); setMsg('');
    const r = await fetch(`/api/admin/ads/quick/${id}`, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setBusy(null); setMsg(j.error || 'Could not save that change.'); return; }
    location.reload();
  }

  return <section className="admin-card">
    <div className="admin-card-head"><h2>Your ads</h2><span className="admin-note">Views and clicks cover the last 30 days.</span></div>
    {msg ? <div className="admin-alert" role="alert">{msg}</div> : null}
    {rows.length ? <div className={styles.adRows}>{rows.map(({ c, crs, places, views, clicks, status }) => {
      const cr = crs[0];
      const cls = status === 'Live' ? 'status-active' : status === 'Expired' || status === 'Ended' ? 'status-ended' : 'status-draft';
      return <article key={c.id} className={styles.adRow}>
        <div className={styles.adThumb}>{cr?.format === 'video' && cr.video?.public_url ? <video src={cr.video.public_url} muted playsInline preload="metadata"/> : cr?.media?.public_url ? <img src={cr.media.public_url} alt=""/> : <span>No file</span>}</div>
        <div className={styles.adInfo}>
          <div className={styles.adTitle}><b>{c.campaign_name === c.advertiser_name ? c.campaign_name : `${c.advertiser_name}: ${c.campaign_name}`}</b><span className={`status-badge ${cls}`}>{status}</span></div>
          <small>{status === 'Expired' ? 'Expired' : 'Shows until'} {niceDate(c.ends_at)} · {views.toLocaleString('en-NZ')} views · {clicks.toLocaleString('en-NZ')} clicks</small>
          <small className={styles.muted}>{places.length ? places.map(p => `${PLACE_OPTIONS.find(o => o.key === slotLabel.get(p.slot_id))?.label || slotLabel.get(p.slot_id)} (${DEVICE_LABEL[p.device as Placement['device']] || p.device})`).join(' · ') : 'Not placed anywhere'}</small>
          {editing === c.id ? <div className={styles.inlineEdit}>
            <label htmlFor={`exp-${c.id}`}>New last day<input id={`exp-${c.id}`} type="date" value={newDate} min={todayPlus(0)} onChange={e => setNewDate(e.target.value)}/></label>
            <button type="button" className="admin-primary" disabled={!newDate || busy === c.id} onClick={() => call(c.id, 'PATCH', { expires_on: newDate })}>Save date</button>
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div> : confirming === c.id ? <div className={styles.confirm}><span>Delete this ad and its figures?</span><button type="button" disabled={busy === c.id} onClick={() => call(c.id, 'DELETE')}>Delete</button><button type="button" onClick={() => setConfirming(null)}>Keep</button></div>
            : <div className={styles.rowActions}>
              {status === 'Live' ? <button type="button" disabled={busy === c.id} onClick={() => call(c.id, 'PATCH', { paused: true })}>Pause</button> : null}
              {status === 'Paused' ? <button type="button" disabled={busy === c.id} onClick={() => call(c.id, 'PATCH', { paused: false })}>Resume</button> : null}
              <button type="button" onClick={() => { setEditing(c.id); setNewDate(toDateInput(c.ends_at) || todayPlus(30)); }}>{status === 'Expired' ? 'Run again' : 'Change end date'}</button>
              <button type="button" className={styles.danger} onClick={() => setConfirming(c.id)}>Delete</button>
            </div>}
        </div>
      </article>;
    })}</div> : <div className="admin-empty">No ads yet. Add one above.</div>}
  </section>;
}
