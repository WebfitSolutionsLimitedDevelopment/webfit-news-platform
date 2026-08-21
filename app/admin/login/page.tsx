'use client';

import { useState } from 'react';
import { createClient } from '../../../lib/supabase-browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setMessage(error?.message || 'Unable to sign in.');
      setBusy(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role,is_active')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.is_active) {
      window.location.href = '/admin';
      return;
    }

    const { data: bootstrapped, error: bootstrapError } = await supabase.rpc('bootstrap_first_admin');
    if (!bootstrapError && bootstrapped === true) {
      window.location.href = '/admin';
      return;
    }

    await supabase.auth.signOut();
    setMessage('This account does not currently have Webfit News newsroom access.');
    setBusy(false);
  }

  return <main className="login-page">
    <form onSubmit={submit} className="login-card">
      <img src="/webfit-news-logo.png" alt="Webfit News"/>
      <div className="admin-kicker">NEWSROOM ACCESS</div>
      <h1>Sign in</h1>
      <p className="admin-note">Use your individual Webfit News newsroom account. Accounts without an active newsroom role cannot enter the CMS.</p>
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label>
      {message && <p className="login-error">{message}</p>}
      <button className="admin-primary" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
    </form>
  </main>;
}
