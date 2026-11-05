'use client';

import { useRef, useState, type FormEvent } from 'react';
import { acceptanceStatement, agreementVersion, volunteerContact, volunteerDeclarations } from '@/lib/volunteer-agreement';
import styles from './volunteer.module.css';

export function VolunteerForm() {
  const [driving, setDriving] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          declarations: {
            transport: form.get('transport') === 'on',
            workRights: form.get('workRights') === 'on',
            authorisation: form.get('authorisation') === 'on',
            driving: form.get('driving') === 'on',
            validLicence: form.get('validLicence') === 'on',
          },
          accepted: form.get('accepted') === 'on',
          website: form.get('website'),
          version: agreementVersion,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.reference) {
        setError(result.error || 'We could not submit your agreement. Please try again.');
        return;
      }
      setReference(result.reference);
    } catch {
      setError('We could not confirm your submission. Please try again using the same name and email.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className={styles.signing} aria-labelledby="sign-agreement">
      <h2 id="sign-agreement">Sign the agreement</h2>
      {reference ? (
        <p role="status">
          Agreement submitted. Your signed copy was queued for email delivery. Your reference is <strong>{reference}</strong>.
          If it does not arrive, check your spam folder or email{' '}
          <a href={`mailto:${volunteerContact}`}>{volunteerContact}</a> with your reference.
          Your coordinator will send a separate authorisation email for any approved event.
        </p>
      ) : (
        <form action="/api/volunteer" method="post" onSubmit={submit} aria-describedby="volunteer-privacy" aria-busy={pending}>
          <fieldset disabled={pending}>
            <label className={styles.field}>
              Full name (electronic signature)
              <input name="name" autoComplete="name" maxLength={120} required />
            </label>
            <label className={styles.field}>
              Email address
              <input name="email" type="email" autoComplete="email" maxLength={254} required />
            </label>
            <div hidden>
              <label>Leave this blank <input name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>
            <h3>Volunteer declarations</h3>
            {(['transport', 'workRights', 'authorisation'] as const).map(declaration => (
              <label className={styles.acceptance} key={declaration}>
                <input name={declaration} type="checkbox" required />
                <span>{volunteerDeclarations[declaration]}</span>
              </label>
            ))}
            <label className={styles.acceptance}>
              <input name="driving" type="checkbox" checked={driving} onChange={event => setDriving(event.target.checked)} />
              <span>I plan to drive my own vehicle to or from an event.</span>
            </label>
            {driving && (
              <label className={styles.acceptance}>
                <input name="validLicence" type="checkbox" required />
                <span>{volunteerDeclarations.driving}</span>
              </label>
            )}
            <label className={styles.acceptance}>
              <input name="accepted" type="checkbox" required />
              <span>{acceptanceStatement}</span>
            </label>
            <button type="submit">{pending ? 'Submitting…' : 'Sign and submit'}</button>
          </fieldset>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </section>
  );
}
