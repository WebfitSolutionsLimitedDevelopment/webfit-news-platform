'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { volunteerStorySlug } from '@/lib/volunteer-story';

type Story = { id: string; slug: string; title: string; status: string; review_note: string | null; text: string };

export default function VolunteerStoryForm({ story, byline }: { story?: Story; byline?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(story?.title || '');
  const [text, setText] = useState(story?.text || '');
  const [status, setStatus] = useState(story?.status || 'draft');
  const attempt = useRef<{ title: string; slug: string } | null>(null);
  const saving = useRef(false);
  const articleId = useRef(story?.id);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const editable = status === 'draft';

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || !editable) return;
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const nextStatus = button?.value === 'in_review' ? 'in_review' : 'draft';
    saving.current = true;
    setBusy(true);
    setMessage('');
    try {
      const id = articleId.current;
      if (!id && attempt.current?.title !== title) attempt.current = { title, slug: volunteerStorySlug(title) };
      const response = await fetch(id ? `/api/admin/articles/${id}` : '/api/admin/articles', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body: text, status: nextStatus, ...(id ? {} : { slug: attempt.current?.slug }) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Could not save your story.');
      setStatus(result.article.status);
      setMessage(result.article.status === 'in_review' ? 'Submitted for editorial review.' : 'Draft saved.');
      articleId.current = result.article.id;
      if (!id) router.replace(`/admin/articles/${result.article.id}`);
      else router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your story.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return <section className="admin-card">
    <p><Link href="/admin/articles">← My stories</Link></p>
    {byline && <p className="admin-note">Byline: {byline}</p>}
    {status === 'rejected' && <p role="status"><strong>Rejected by the editor.</strong></p>}
    {status === 'in_review' && <p role="status">Your story is waiting for editorial review.</p>}
    {status === 'scheduled' && <p role="status">Your story is scheduled for publication.</p>}
    {status === 'published' && story && <p><Link href={`/${story.slug}`}>View your published story</Link></p>}
    {story?.review_note && (status === 'rejected' || status === 'draft') && <p style={{ whiteSpace: 'pre-wrap' }}>Editor’s note: {story.review_note}</p>}
    <form className="admin-form-grid" onSubmit={save}>
      <label style={{ gridColumn: '1/-1' }}><span>Headline</span><input value={title} onChange={e => setTitle(e.target.value)} minLength={5} maxLength={250} required readOnly={!editable} /></label>
      <label style={{ gridColumn: '1/-1' }}><span>Article</span><textarea value={text} onChange={e => setText(e.target.value)} rows={18} maxLength={60000} required readOnly={!editable} placeholder="Paste your article here. Leave a blank line between paragraphs." /></label>
      {editable && <div className="admin-actions" style={{ gridColumn: '1/-1' }}>
        <button type="submit" className="admin-secondary" disabled={busy} value="draft">Save draft</button>
        <button type="submit" className="admin-primary" disabled={busy} value="in_review">Submit for review</button>
      </div>}
      {message && <p role="status" style={{ gridColumn: '1/-1' }}>{message}</p>}
    </form>
  </section>;
}
