'use client';

import { useState } from 'react';
import styles from './AdManager.module.css';

type Story = { id: string; title: string; slug: string; published_at: string };
type Edition = { key: string; label: string; status: string; href: string; stories: Story[]; row: { lead_article_id: string | null; teaser_article_ids: string[] | null; editor_note: string | null; note_author: string | null; updated_at: string } | null };

const day = (iso: string) => new Intl.DateTimeFormat('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Pacific/Auckland' }).format(new Date(iso));

export default function EpaperFrontManager({ editions }: { editions: Edition[] }) {
  const [key, setKey] = useState(editions[0]?.key || '');
  const ed = editions.find(e => e.key === key);
  if (!ed) return <div className="admin-empty">No weekly editions yet.</div>;
  return <div className="panel">
    <label>Edition{' '}
      <select value={key} onChange={e => setKey(e.target.value)}>
        {editions.map(e => <option key={e.key} value={e.key}>{e.label} ({e.status})</option>)}
      </select>
    </label>
    <FrontForm key={ed.key} ed={ed}/>
  </div>;
}

function FrontForm({ ed }: { ed: Edition }) {
  const [lead, setLead] = useState(ed.row?.lead_article_id || '');
  const [teasers, setTeasers] = useState<string[]>([0, 1, 2].map(i => ed.row?.teaser_article_ids?.[i] || ''));
  const [note, setNote] = useState(ed.row?.editor_note || '');
  const [author, setAuthor] = useState(ed.row?.note_author || '');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const words = note.trim() ? note.trim().split(/\s+/).length : 0;
  const options = ed.stories.map(s => <option key={s.id} value={s.id}>{day(s.published_at)} · {s.title}</option>);

  const save = async () => {
    setBusy(true); setMsg(null);
    const picked = teasers.filter(Boolean);
    if (lead && picked.includes(lead)) { setMsg('The lead story is already on the front, so pick a different story for that teaser.'); setBusy(false); return; }
    const res = await fetch('/api/admin/epaper-front', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ edition_key: ed.key, lead_article_id: lead || null, teaser_article_ids: [...new Set(picked)], editor_note: note.trim() || null, note_author: author.trim() || null }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? 'Saved. The e-paper shows your choices within about 5 minutes.' : (json.error || 'Could not save. Please try again.'));
  };

  return <div style={{ display: 'grid', gap: 16, marginTop: 16, maxWidth: 820 }}>
    <p style={{ margin: 0, color: '#5d584f' }}>{ed.status} · {ed.stories.length} stories in this edition · <a href={ed.href} target="_blank" rel="noopener" style={{ color: '#1f2a6b', fontWeight: 700 }}>Open this edition ↗</a>{ed.row?.updated_at ? ` · Last saved ${day(ed.row.updated_at)}` : ''}</p>
    <label style={{ display: 'grid', gap: 6 }}><b>Lead story on the front page</b>
      <select value={lead} onChange={e => setLead(e.target.value)}><option value="">Automatic (the strongest story of the week)</option>{options}</select>
    </label>
    <fieldset style={{ display: 'grid', gap: 8, border: '1px solid #e3e3df', borderRadius: 8, padding: 12 }}>
      <legend><b>“Inside this week” teasers</b> (three small boxes under the masthead, with their page numbers)</legend>
      {teasers.map((t, i) => <select key={i} value={t} onChange={e => setTeasers(ts => ts.map((x, j) => (j === i ? e.target.value : x)))}>
        <option value="">Automatic</option>{options}
      </select>)}
      <small style={{ color: '#5d584f' }}>A teaser only shows if that story is printed inside this edition. Empty boxes are filled automatically from other sections.</small>
    </fieldset>
    <label style={{ display: 'grid', gap: 6 }}><b>Editor’s note</b> (printed in a box at the top of page 2; leave empty for no note)
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={7} maxLength={1200} placeholder="A few lines to readers about this week's edition: what to read first, what we're following, a thank-you…"/>
      <small style={{ color: words > 160 ? '#a12a2a' : '#5d584f' }}>{words} words · best under 120 words ({note.length}/1200 characters)</small>
    </label>
    <label style={{ display: 'grid', gap: 6, maxWidth: 360 }}><b>Signed by</b>
      <input value={author} onChange={e => setAuthor(e.target.value)} maxLength={80} placeholder="e.g. Ravi Gupta, Editor"/>
    </label>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <button type="button" className={styles.reportBtn} style={{ minHeight: 40, padding: '0 18px', background: '#1f2a6b', color: '#fff' }} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save front page'}</button>
      {msg ? <span role="status">{msg}</span> : null}
    </div>
  </div>;
}
