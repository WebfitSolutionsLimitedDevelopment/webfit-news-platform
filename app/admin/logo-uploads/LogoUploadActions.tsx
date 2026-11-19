'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function call(body: object) {
  const r = await fetch('/api/admin/logo-studio', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'That did not work.');
  return d;
}

/** Delete one photo, or block the account behind it (which also deletes everything it made). */
export function LogoUploadActions({ id, userId, email }: { id: string; userId: string; email: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run(body: object, confirmText: string) {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    try { await call(body); router.refresh(); } catch (e: any) { window.alert(e.message); setBusy(false); }
  }
  return <div className="logo-upload-actions">
    <button className="admin-secondary" disabled={busy} onClick={() => run({ action: 'delete', id }, 'Delete this photo? The account owner will no longer be able to download it.')}>Delete</button>
    <button className="logo-upload-block" disabled={busy} onClick={() => run({ action: 'block', userId }, `Block ${email || 'this account'}? Every photo and the saved logo from this account will be deleted, and it will not be able to use the tool again.`)}>Block account</button>
  </div>;
}

export function UnblockButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button className="admin-secondary" disabled={busy} onClick={async () => {
    setBusy(true);
    try { await call({ action: 'unblock', userId }); router.refresh(); } catch (e: any) { window.alert(e.message); setBusy(false); }
  }}>Unblock</button>;
}
