'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressImageForUpload, distributionCopy, formatUploadSize } from '../../lib/client-image-compression';
import { altFromFilename } from '../../lib/alt-text';
import { watermarkOn } from '../../lib/watermark-pref';
import WatermarkToggle from './WatermarkToggle';

/** Most files one batch can take. Each file is its own request, so this keeps a batch to a few minutes. */
const MAX_FILES = 20;
/** Files sent at the same time. Two keeps it quick without tripping the server on large photos. */
const AT_ONCE = 2;

type Result = { name: string; ok: boolean; note: string };

async function uploadOne(file: File, stamp: boolean): Promise<Result> {
  try {
    const image = file.type.startsWith('image/');
    const uploadFile = image ? await compressImageForUpload(file) : file;
    const fd = new FormData();
    fd.set('file', uploadFile);
    fd.set('alt_text', altFromFilename(file.name));
    fd.set('watermark', stamp ? '1' : '0');
    // Full HD copy with the logo, for downloading and sending to other media.
    if (image && stamp) {
      try { const hd = await distributionCopy(file); if (hd) fd.set('distribution', hd); } catch { /* web copy still uploads */ }
    }
    const r = await fetch('/api/admin/media', { method: 'POST', body: fd });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { name: file.name, ok: false, note: d.error || 'Upload failed' };
    return { name: file.name, ok: true, note: image ? formatUploadSize(uploadFile.size) : 'uploaded' };
  } catch (e: any) {
    return { name: file.name, ok: false, note: e?.message || 'Upload failed' };
  }
}

/** Upload up to 20 images or PDFs in one go. A failed file doesn't stop the rest. */
export default function MediaUploader() {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [chosen, setChosen] = useState(0);
  const [failed, setFailed] = useState<Result[]>([]);

  function onPick() {
    const n = ref.current?.files?.length ?? 0;
    setFailed([]);
    setChosen(Math.min(n, MAX_FILES));
    setMsg(n > MAX_FILES ? `${n} files chosen. Only the first ${MAX_FILES} will upload.` : '');
  }

  async function upload() {
    const files = Array.from(ref.current?.files ?? []).slice(0, MAX_FILES);
    if (!files.length) { setMsg('Choose files first.'); return; }
    setBusy(true);
    setFailed([]);
    const stamp = watermarkOn();
    const results: Result[] = [];
    let next = 0;
    setMsg(`Uploading 0 of ${files.length}...`);
    const worker = async () => {
      while (next < files.length) {
        const file = files[next++];
        results.push(await uploadOne(file, stamp));
        setMsg(`Uploading... ${results.length} of ${files.length} done`);
      }
    };
    await Promise.all(Array.from({ length: Math.min(AT_ONCE, files.length) }, worker));
    const bad = results.filter(r => !r.ok);
    const good = results.length - bad.length;
    setFailed(bad);
    setMsg(bad.length ? `${good} of ${files.length} uploaded. ${bad.length} failed:` : `${good} file${good === 1 ? '' : 's'} uploaded.`);
    if (ref.current) ref.current.value = '';
    setChosen(0);
    setBusy(false);
    if (good) router.refresh();
  }

  return <div className="media-uploader">
    <input ref={ref} type="file" accept="image/*,.pdf" multiple onChange={onPick} disabled={busy}/>
    <WatermarkToggle/>
    <button className="admin-primary" disabled={busy} onClick={upload}>
      {busy ? 'Uploading...' : chosen > 1 ? `Upload ${chosen} files` : 'Upload media'}
    </button>
    {msg && <span>{msg}</span>}
    {failed.length ? <ul className="media-upload-failed">{failed.map((f, i) => <li key={i}><b>{f.name}</b>: {f.note}</li>)}</ul> : null}
    <small className="media-upload-hint">Up to {MAX_FILES} files at a time.</small>
  </div>;
}
