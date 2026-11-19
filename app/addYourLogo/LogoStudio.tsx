'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { LOGO_KEEP_DAYS, LOGO_SIZE_DEFAULT, LOGO_SIZE_MAX, LOGO_SIZE_MIN, placeLogo, type LogoCorner } from '@/lib/logo-placement';
import s from './LogoStudio.module.css';

type Item = { id: string; createdAt: string; filename: string; download: string | null; thumb: string | null; expiresAt: string };
type Photo = { key: string; name: string; file: File; url: string; w: number; h: number; state: 'ready' | 'working' | 'done' | 'error'; note?: string };

const PRODUCTION_ORIGIN = 'https://webfitnews.com';
const PHOTO_EDGE = 3000;
const PHOTO_MAX_BYTES = 3.6 * 1024 * 1024;
const POSITIONS: Array<{ id: LogoCorner; label: string }> = [
  { id: 'tl', label: 'Top left' }, { id: 'tr', label: 'Top right' },
  { id: 'bl', label: 'Bottom left' }, { id: 'bc', label: 'Bottom centre' }, { id: 'br', label: 'Bottom right' },
];

function authOrigin() {
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' ? window.location.origin : PRODUCTION_ORIGIN;
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (file.type !== 'image/svg+xml' && 'createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* fall back */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally { URL.revokeObjectURL(url); }
}

function blob(canvas: HTMLCanvasElement, type: string, q?: number) {
  return new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('Could not read that image.'))), type, q));
}

/** Phone photos can be 8 MB; shrink to 3000 px and a size the server accepts. */
async function preparePhoto(file: File) {
  const img = await decode(file);
  const sw = img.width, sh = img.height;
  for (const edge of [PHOTO_EDGE, 2400, 1920]) {
    const k = Math.min(1, edge / Math.max(sw, sh));
    const c = document.createElement('canvas');
    c.width = Math.round(sw * k); c.height = Math.round(sh * k);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    for (const q of [0.92, 0.86]) {
      const b = await blob(c, 'image/jpeg', q);
      if (b.size <= PHOTO_MAX_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
        return { file: new File([b], name, { type: 'image/jpeg' }), w: c.width, h: c.height };
      }
    }
  }
  throw new Error('That photo is too large.');
}

/** Any logo (PNG, JPEG, WebP or SVG) becomes a PNG up to 1200 px wide, keeping transparency. */
async function prepareLogo(file: File) {
  const img = await decode(file);
  for (const edge of [1200, 800, 500]) {
    const k = Math.min(1, edge / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    const b = await blob(c, 'image/png');
    if (b.size <= 950 * 1024) return new File([b], 'logo.png', { type: 'image/png' });
  }
  throw new Error('That logo file is too large.');
}

function nzDate(iso: string) {
  return new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short', timeZone: 'Pacific/Auckland' }).format(new Date(iso));
}

export default function LogoStudio({ signedIn, email }: { signedIn: boolean; email: string | null }) {
  const [inApp, setInApp] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState(5);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [active, setActive] = useState(0);
  const [corner, setCorner] = useState<LogoCorner>('br');
  const [size, setSize] = useState(LOGO_SIZE_DEFAULT);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoImgs = useRef(new Map<string, HTMLImageElement>());

  useEffect(() => { setInApp(navigator.userAgent.includes('WebfitNewsApp')); }, []);

  const refresh = useCallback(async () => {
    const r = await fetch('/api/logo-studio', { cache: 'no-store' });
    if (!r.ok) return;
    const d = await r.json();
    setItems(d.items || []); setRemaining(d.remaining); setLimit(d.limit);
    if (d.logo) setLogoUrl(u => u ?? d.logo);
  }, []);
  useEffect(() => { if (signedIn) refresh(); }, [signedIn, refresh]);

  // Load whichever logo is current (new upload, or the saved one) for the preview.
  useEffect(() => {
    const src = logoFile ? URL.createObjectURL(logoFile) : logoUrl;
    if (!src) { setLogoImg(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setLogoImg(img);
    img.src = src;
    return () => { if (logoFile) URL.revokeObjectURL(src); };
  }, [logoFile, logoUrl]);

  // Live preview of the selected photo.
  useEffect(() => {
    const c = canvasRef.current, p = photos[active];
    if (!c) return;
    const ctx = c.getContext('2d')!;
    if (!p) { c.width = 1200; c.height = 800; ctx.clearRect(0, 0, c.width, c.height); return; }
    const draw = (img: HTMLImageElement) => {
      const k = Math.min(1, 1400 / Math.max(p.w, p.h));
      c.width = Math.round(p.w * k); c.height = Math.round(p.h * k);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      if (logoImg) {
        const spot = placeLogo(c.width, c.height, logoImg.naturalWidth, logoImg.naturalHeight, corner, size);
        ctx.drawImage(logoImg, spot.left, spot.top, spot.width, spot.height);
      }
    };
    const cached = photoImgs.current.get(p.key);
    if (cached) { draw(cached); return; }
    const img = new Image();
    img.onload = () => { photoImgs.current.set(p.key, img); draw(img); };
    img.src = p.url;
  }, [photos, active, logoImg, corner, size]);

  async function signIn() {
    setSigningIn(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${authOrigin()}/auth/callback?next=/addYourLogo` },
    });
    if (error) { setSigningIn(false); setMessage(error.message); }
  }

  async function pickLogo(f: File | undefined) {
    if (!f) return;
    setMessage('');
    try { setLogoFile(await prepareLogo(f)); } catch (e: any) { setMessage(e.message); }
  }

  async function pickPhotos(list: FileList | null) {
    if (!list?.length) return;
    setMessage('');
    const room = Math.max(0, (remaining ?? limit) - photos.filter(p => p.state !== 'done').length);
    const chosen = Array.from(list).filter(f => f.type.startsWith('image/')).slice(0, room);
    if (list.length > chosen.length) setMessage(room ? `You can add ${room} more today, so only the first ${room} were added.` : `You have used today's ${limit} photos.`);
    const ready: Photo[] = [];
    for (const f of chosen) {
      try {
        const prepared = await preparePhoto(f);
        ready.push({ key: crypto.randomUUID(), name: f.name, file: prepared.file, url: URL.createObjectURL(prepared.file), w: prepared.w, h: prepared.h, state: 'ready' });
      } catch (e: any) { setMessage(`${f.name}: ${e.message}`); }
    }
    setPhotos(prev => { const next = [...prev.filter(p => p.state !== 'done'), ...ready]; setActive(Math.max(0, next.length - ready.length)); return next; });
  }

  function removePhoto(key: string) {
    setPhotos(prev => prev.filter(p => p.key !== key));
    setActive(0);
  }

  async function run() {
    const queue = photos.filter(p => p.state === 'ready' || p.state === 'error');
    if (!queue.length || busy) return;
    setBusy(true); setMessage('');
    let sentLogo = false;
    for (const p of queue) {
      setPhotos(prev => prev.map(x => x.key === p.key ? { ...x, state: 'working', note: undefined } : x));
      const fd = new FormData();
      fd.set('photo', p.file);
      fd.set('position', corner);
      fd.set('size', String(size));
      fd.set('rights', rights ? 'yes' : 'no');
      if (logoFile && !sentLogo) fd.set('logo', logoFile);
      const r = await fetch('/api/logo-studio', { method: 'POST', body: fd }).catch(() => null);
      const d = r ? await r.json().catch(() => ({})) : { error: 'No connection. Try again.' };
      if (r?.ok) {
        sentLogo = true;
        setRemaining(d.remaining);
        setPhotos(prev => prev.map(x => x.key === p.key ? { ...x, state: 'done' } : x));
      } else {
        setPhotos(prev => prev.map(x => x.key === p.key ? { ...x, state: 'error', note: d.error } : x));
        if (r?.status === 429) { setRemaining(0); setMessage(d.error); break; }
        if (r?.status === 422 && !String(d.error || '').includes('processed')) { setMessage(d.error); break; }
      }
    }
    if (sentLogo) { setLogoFile(null); setLogoUrl(null); }
    setBusy(false);
    await refresh();
    if (sentLogo) document.getElementById('your-photos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (!signedIn) {
    return <section className={s.signin}>
      <div>
        <h2>Sign in with Google to start</h2>
        <p>Your account keeps your logo and your photos together, so you can come back and download them again for {LOGO_KEEP_DAYS} days.</p>
      </div>
      {inApp
        ? <p className={s.appNote}>Open <b>webfitnews.com/addYourLogo</b> in your phone’s browser to sign in with Google.</p>
        : <button className={s.google} onClick={signIn} disabled={signingIn}>
            <svg viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.96 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"/></svg>
            {signingIn ? 'Opening Google…' : 'Continue with Google'}
          </button>}
      {message ? <p className={s.message}>{message}</p> : null}
    </section>;
  }

  const queued = photos.filter(p => p.state === 'ready' || p.state === 'error').length;
  const haveLogo = !!(logoFile || logoUrl);
  const left = remaining ?? limit;

  return <>
    <section className={s.studio}>
      <div className={s.controls}>
        <p className={s.account}>Signed in as {email}. <b>{left} of {limit}</b> photos left today.</p>

        <div className={s.step}>
          <h2><span>1</span>Your logo</h2>
          <label className={s.drop}>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => pickLogo(e.target.files?.[0])}/>
            {logoImg ? <img src={logoImg.src} alt="Your logo"/> : null}
            <span>{haveLogo ? 'Change logo' : 'Choose your logo'}</span>
            <small>A PNG with a transparent background looks best.</small>
          </label>
        </div>

        <div className={s.step}>
          <h2><span>2</span>Your photos</h2>
          <label className={`${s.drop} ${left === 0 ? s.dropOff : ''}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple disabled={left === 0} onChange={e => { pickPhotos(e.target.files); e.target.value = ''; }}/>
            <span>{left === 0 ? 'Come back tomorrow for more' : `Choose up to ${left} photo${left === 1 ? '' : 's'}`}</span>
          </label>
          {photos.length ? <ul className={s.queue}>
            {photos.map((p, i) => <li key={p.key} className={i === active ? s.current : ''}>
              <button className={s.thumbBtn} onClick={() => setActive(i)} aria-label={`Preview ${p.name}`}><img src={p.url} alt=""/></button>
              <span className={s.qName}>{p.name}<small>{p.state === 'working' ? 'Adding logo…' : p.state === 'done' ? 'Done, see Your photos below' : p.state === 'error' ? p.note : 'Ready'}</small></span>
              {p.state !== 'working' && p.state !== 'done' ? <button className={s.remove} onClick={() => removePhoto(p.key)} aria-label={`Remove ${p.name}`}>×</button> : null}
            </li>)}
          </ul> : null}
        </div>

        <div className={s.step}>
          <h2><span>3</span>Where the logo goes</h2>
          <div className={s.placer} role="radiogroup" aria-label="Logo position">
            {POSITIONS.map(p => <button key={p.id} role="radio" aria-checked={corner === p.id} aria-label={p.label} title={p.label}
              className={`${s.dot} ${s['at_' + p.id]} ${corner === p.id ? s.dotOn : ''}`} onClick={() => setCorner(p.id)}/>)}
          </div>
          <label className={s.size}>Size <output>{size}%</output>
            <input type="range" min={LOGO_SIZE_MIN} max={LOGO_SIZE_MAX} value={size} onChange={e => setSize(Number(e.target.value))}/>
          </label>
        </div>

        <label className={s.rights}><input type="checkbox" checked={rights} onChange={e => setRights(e.target.checked)}/>These are our own photos, or we have permission to use them.</label>
        <button className={s.go} disabled={busy || !queued || !haveLogo || !rights || left === 0} onClick={run}>
          {busy ? 'Adding your logo…' : queued ? `Add logo to ${queued} photo${queued === 1 ? '' : 's'}` : 'Add logo to photos'}
        </button>
        {message ? <p className={s.message} role="status">{message}</p> : null}
      </div>

      <div className={s.stage}>
        <canvas ref={canvasRef} className={photos.length ? '' : s.empty} aria-label="Preview"/>
        {!photos.length ? <p className={s.stageHint}>Your preview appears here.</p> : null}
      </div>
    </section>

    {items.length ? <section className={s.history} id="your-photos">
      <h2>Your photos</h2>
      <p>Download any of these again until the date shown.</p>
      <ul>
        {items.map(it => <li key={it.id}>
          {it.thumb ? <img src={it.thumb} alt="" loading="lazy"/> : <span className={s.noThumb}/>}
          <div><b>{it.filename}</b><small>Made {nzDate(it.createdAt)}, kept until {nzDate(it.expiresAt)}</small></div>
          {it.download ? <a className={s.dl} href={it.download} download={it.filename}>Download</a> : null}
        </li>)}
      </ul>
    </section> : null}
  </>;
}
