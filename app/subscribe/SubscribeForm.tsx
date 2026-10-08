'use client';
import { useState, type FormEvent } from 'react';
import styles from './subscribe.module.css';

export function SubscribeForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState('sending');
    setMessage('');
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), firstName: form.get('firstName'), website: form.get('website') }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setState('sent');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  }

  if (state === 'sent') {
    return <div className={styles.notice} role="status">
      <strong>Check your inbox.</strong> We’ve sent you a confirmation email. Tap the button in it to start getting the e-paper. (If it’s not there in a few minutes, look in spam or promotions.)
    </div>;
  }

  return <form className={styles.form} onSubmit={onSubmit} noValidate>
    <label className={styles.field}>
      <span>First name <em>(optional)</em></span>
      <input name="firstName" type="text" autoComplete="given-name" maxLength={60}/>
    </label>
    <label className={styles.field}>
      <span>Email address</span>
      <input name="email" type="email" autoComplete="email" required inputMode="email"/>
    </label>
    <input className={styles.hp} name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    <button className={styles.submit} type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send me the e-paper'}</button>
    {state === 'error' ? <p className={styles.error} role="alert">{message}</p> : null}
    <p className={styles.small}>Free. Twice a week. One tap to unsubscribe. See our <a href="/privacy-policy">privacy policy</a>.</p>
  </form>;
}
