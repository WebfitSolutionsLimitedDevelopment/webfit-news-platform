'use client';

import { useEffect, useState } from 'react';
import styles from './ArticleFeedback.module.css';

type Step = 'ask' | 'thanks' | 'why' | 'sent';

const VISITOR_KEY = 'wf-visitor-id';
const answeredKey = (id: string) => `wf-feedback:${id}`;

function visitorId() {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 64);
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

async function send(articleId: string, helpful: boolean, comment?: string, website?: string) {
  try {
    await fetch('/api/article-feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ articleId, visitorId: visitorId(), helpful, comment, website }),
      keepalive: true,
    });
  } catch {}
}

export function ArticleFeedback({ articleId }: { articleId: string }) {
  const [step, setStep] = useState<Step>('ask');
  const [comment, setComment] = useState('');
  const [trap, setTrap] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try { if (window.localStorage.getItem(answeredKey(articleId))) setStep('sent'); } catch {}
  }, [articleId]);

  const remember = () => { try { window.localStorage.setItem(answeredKey(articleId), '1'); } catch {} };

  const vote = (helpful: boolean) => {
    send(articleId, helpful);
    if (helpful) { remember(); setStep('thanks'); } else setStep('why');
  };

  const submitWhy = async () => {
    setSending(true);
    if (comment.trim()) await send(articleId, false, comment.trim(), trap);
    remember();
    setSending(false);
    setStep('sent');
  };

  if (step === 'sent') return null;

  return (
    <section className={styles.box} aria-label="Article feedback">
      {step === 'ask' ? <>
        <p className={styles.question}>Was this article useful?</p>
        <div className={styles.buttons}>
          <button type="button" onClick={() => vote(true)}><span aria-hidden="true">👍</span> Yes</button>
          <button type="button" onClick={() => vote(false)}><span aria-hidden="true">👎</span> No</button>
        </div>
      </> : null}

      {step === 'thanks' ? <p className={styles.thanks}>Thanks for letting us know.</p> : null}

      {step === 'why' ? <>
        <label className={styles.question} htmlFor="wf-feedback-why">Thanks. What was missing or wrong?</label>
        <p className={styles.note}>Optional. Only our newsroom sees this. Please don’t include personal details.</p>
        <textarea id="wf-feedback-why" rows={3} maxLength={1000} value={comment} onChange={e => setComment(e.target.value)} placeholder="For example: a figure looked wrong, or the story didn’t explain what happens next" />
        <input className={styles.trap} tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={trap} onChange={e => setTrap(e.target.value)} />
        <div className={styles.buttons}>
          <button type="button" className={styles.primary} disabled={sending} onClick={submitWhy}>{comment.trim() ? 'Send' : 'Skip'}</button>
        </div>
      </> : null}
    </section>
  );
}
