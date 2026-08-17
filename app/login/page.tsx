'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

export default function ReaderLogin(){
  const [email,setEmail]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  async function emailLogin(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');const supabase=createClient();const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:`${window.location.origin}/auth/callback?next=/`}});setBusy(false);setMessage(error?error.message:'Check your email for a secure sign-in link.');}
  async function oauth(provider:'google'|'apple'|'azure') {setMessage('');const supabase=createClient();const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:`${window.location.origin}/auth/callback?next=/`}});if(error)setMessage(error.message);}
  return <main className="reader-login-page"><div className="reader-login-shell"><Link href="/"><img src="/webfit-news-logo.png" alt="Webfit News"/></Link><span>Reader account</span><h1>Sign in to Webfit News</h1><p>Use one account for reader features and future supporter benefits. Newsroom staff should use the separate newsroom login.</p>
    <div className="reader-oauth"><button onClick={()=>oauth('google')}>Continue with Google</button><button onClick={()=>oauth('apple')}>Continue with Apple</button><button onClick={()=>oauth('azure')}>Continue with Microsoft</button></div>
    <div className="reader-or"><span>or use email</span></div>
    <form onSubmit={emailLogin}><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button type="submit" disabled={busy}>{busy?'Sending sign-in link...':'Email me a sign-in link'}</button></form>
    {message?<p className="reader-message">{message}</p>:null}<small>No password is required for email sign-in. Social providers need to be enabled in Supabase Auth before those buttons can be used.</small><Link className="reader-newsroom-link" href="/admin/login">Newsroom staff sign in</Link></div></main>
}
