'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { assignmentAttachmentMaxBytes, assignmentLabels, canAddBriefingAttachments, type Assignment, type AssignmentFile } from '@/lib/volunteer-assignments';

async function submit(url: string, payload: object | FormData) {
  const response = await fetch(url, {
    method: 'POST',
    ...(payload instanceof FormData ? { body: payload } : {
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (payload instanceof FormData && response.status === 413) {
      throw new Error('The upload exceeded the 4 MB file limit. Reduce the file size and try again.');
    }
    if (payload instanceof FormData && response.status === 401) {
      throw new Error('Your session expired. Sign in again and retry the upload.');
    }
    throw new Error(result.error || (payload instanceof FormData
      ? `Upload failed (HTTP ${response.status}). Please try again.`
      : 'The assignment could not be saved. Please try again.'));
  }
  return result;
}

type Volunteer = { id: string; display_name: string | null; email: string | null };

export function NewAssignment({ volunteers }: { volunteers: Volunteer[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const result = await submit('/api/admin/assignments', Object.fromEntries(new FormData(event.currentTarget)));
      router.push(`/admin/assignments?id=${result.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the assignment.');
      setBusy(false);
    }
  }

  return <section className="admin-card">
    <div className="admin-card-head"><h2>New assignment</h2></div>
    {volunteers.length ? <form className="admin-form-grid" onSubmit={create}>
      <label><span>Volunteer</span><select name="volunteer_id" required defaultValue="">
        <option value="" disabled>Choose a volunteer</option>
        {volunteers.map(person => <option key={person.id} value={person.id}>{person.display_name || person.email || 'Volunteer'}</option>)}
      </select></label>
      <label><span>Assignment title</span><input name="title" required minLength={3} maxLength={150} /></label>
      <label><span>Event date</span><input name="event_date" type="date" required /></label>
      <label><span>Time or access window (New Zealand local time)</span><input name="event_time" maxLength={100} placeholder="For example, 10 am to 1 pm" /></label>
      <label><span>Venue or location</span><input name="venue" required maxLength={300} /></label>
      <label><span>On-site contact (optional)</span><input name="contact" maxLength={250} /></label>
      <label style={{ gridColumn: '1/-1' }}><span>Briefing and reporting instructions</span><textarea name="instructions" rows={5} required maxLength={6000} /></label>
      <div className="admin-actions" style={{ gridColumn: '1/-1' }}><button className="admin-primary" disabled={busy}>Create briefing draft</button><small>Open the assignment after saving to add briefing files.</small></div>
      {message && <p role="alert">{message}</p>}
    </form> : <p>Set up an active volunteer account under Users before assigning work.</p>}
  </section>;
}

export function AssignmentActions({ assignment, files, reviewer }: { assignment: Assignment; files: AssignmentFile[]; reviewer: boolean }) {
  const router = useRouter();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [report, setReport] = useState('');
  const [declineNote, setDeclineNote] = useState('');
  const url = `/api/admin/assignments/${assignment.id}`;
  const status = assignment.status;

  async function run(action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your changes.');
    } finally {
      busyRef.current = false;
      setBusy(false);
      router.refresh();
    }
  }

  function act(action: string, details: object = {}) {
    return run(async () => {
      const result = await submit(url, { action, ...details });
      setMessage(result.notice || 'Assignment updated.');
    });
  }

  function upload(selected: FileList | null) {
    const chosen = Array.from(selected || []);
    if (!chosen.length) return;
    return run(async () => {
      let uploaded = 0;
      const failures: string[] = [];
      for (const file of chosen) {
        if (file.size > assignmentAttachmentMaxBytes || file.size === 0) {
          failures.push(`${file.name}: ${file.size ? 'Over 4 MB. Reduce the file size and retry.' : 'The file is empty.'}`);
          continue;
        }
        const form = new FormData();
        form.set('file', file);
        try {
          await submit(url, form);
          uploaded += 1;
        } catch (error) {
          failures.push(`${file.name}: ${error instanceof Error ? error.message : 'Upload failed.'}`);
        }
      }
      setMessage([`${uploaded} of ${chosen.length} attachments uploaded.`, ...failures].join('\n'));
    });
  }

  const briefing = files.filter(file => file.kind === 'briefing');
  const photos = files.filter(file => file.kind === 'report');
  const uploadAllowed = reviewer ? canAddBriefingAttachments(status) : status === 'accepted';
  return <section className="admin-card">
    <div className="admin-card-head"><h2>{assignment.title}</h2><span className="status-badge">{assignmentLabels[status]}</span></div>
    <p><strong>{assignment.volunteer_name}</strong> · {assignment.event_date}{assignment.event_time ? ` · ${assignment.event_time}` : ''} · {assignment.venue}</p>
    {assignment.contact && <p>Event contact: {assignment.contact}</p>}
    <p style={{ whiteSpace: 'pre-wrap' }}>{assignment.instructions}</p>

    <h3>Briefing attachments</h3>
    {briefing.length ? <ul>{briefing.map(file => <li key={file.id}><a href={`${url}?file=${file.id}`}>{file.filename}</a></li>)}</ul> : <p className="admin-note">No briefing attachments.</p>}

    {assignment.accepted_at && <p><a className="admin-secondary" href={`${url}?letter=1`}>Download authorisation letter</a></p>}
    {assignment.response_note && <p style={{ whiteSpace: 'pre-wrap' }}>Volunteer’s response: {assignment.response_note}</p>}

    {(!reviewer && status === 'accepted' || assignment.report_text) && <h3>Event report</h3>}
    {assignment.report_text && <p style={{ whiteSpace: 'pre-wrap' }}>{assignment.report_text}</p>}
    {photos.length > 0 && <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '12px 0' }}>
      {photos.map(photo => <a key={photo.id} href={`${url}?file=${photo.id}`} style={{ width: 145, overflowWrap: 'anywhere' }}>
        <img src={`${url}?file=${photo.id}&preview=1`} alt="" loading="lazy" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
        {photo.filename}
      </a>)}
    </div>}
    {status === 'complete' && <p className="admin-note">{assignment.photos_purged_at
      ? 'Report photos have been removed. The written report is kept.'
      : 'Report photos are hidden while cleanup is pending.'}</p>}

    <div className="admin-form-grid">
      {uploadAllowed && <label style={{ gridColumn: '1/-1' }}><span>{reviewer ? 'Add briefing attachments' : 'Upload report photos'}</span>
        <input type="file" multiple disabled={busy} accept={reviewer ? '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp' : 'image/jpeg,image/png,image/webp'}
          onChange={event => { void upload(event.target.files); event.target.value = ''; }} />
        <small>{reviewer ? 'PDF, Word, text or images. ' : ''}Up to 12 attachments, 4 MB each.</small>
      </label>}
      {!reviewer && status === 'offered' && <label style={{ gridColumn: '1/-1' }}><span>Reason if declining (optional)</span>
        <textarea rows={2} value={declineNote} onChange={event => setDeclineNote(event.target.value)} maxLength={1000} />
      </label>}
      {!reviewer && status === 'accepted' && <label style={{ gridColumn: '1/-1' }}><span>Written report</span>
        <textarea rows={9} value={report} onChange={event => setReport(event.target.value)} maxLength={20000} placeholder="What happened, who you spoke with, and anything the editor should follow up." />
      </label>}
      <div className="admin-actions" style={{ gridColumn: '1/-1' }}>
        {reviewer && status === 'draft' && <button className="admin-primary" disabled={busy} onClick={() => act('offer')}>Offer to volunteer</button>}
        {!reviewer && status === 'offered' && <>
          <button className="admin-primary" disabled={busy} onClick={() => act('accept')}>Accept assignment</button>
          <button className="admin-secondary" disabled={busy} onClick={() => act('decline', { note: declineNote })}>Decline assignment</button>
        </>}
        {!reviewer && status === 'accepted' && <button className="admin-primary" disabled={busy || !report.trim()} onClick={() => act('report', { text: report })}>Submit report</button>}
        {reviewer && (status === 'reported' || status === 'complete' && !assignment.photos_purged_at) &&
          <button className="admin-primary" disabled={busy} onClick={() => {
            if (status === 'complete' || window.confirm('Complete this assignment and permanently delete its report photos?')) void act('complete');
          }}>{status === 'complete' ? 'Retry photo cleanup' : 'Mark complete and delete report photos'}</button>}
      </div>
      {message && <p role="status" style={{ whiteSpace: 'pre-line' }}>{message}</p>}
    </div>
  </section>;
}
