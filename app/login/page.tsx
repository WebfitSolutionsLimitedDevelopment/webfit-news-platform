'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

const PRODUCTION_ORIGIN='https://webfitnews.com';

function getAuthOrigin(){
  if(typeof window==='undefined')return PRODUCTION_ORIGIN;
  const hostname=window.location.hostname;
  if(hostname==='localhost'||hostname==='127.0.0.1')return window.location.origin;
  return PRODUCTION_ORIGIN;
}

function getAuthCallback(){
  return `${getAuthOrigin()}/auth/callback?next=/`;
}

export default function ReaderLogin(){
  const [email,setEmail]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [googleBusy,setGoogleBusy]=useState(false);
  // The iOS/Android apps only offer email sign-in, not Google. Apple's App
  // Store guidelines require any third-party login service (like Google) to
  // have an equivalent privacy-preserving alternative (e.g. Sign in with
  // Apple) in the app. Rather than build that, we simply don't offer Google
  // sign-in inside the native apps; the website itself keeps it for regular
  // browser visitors.
  const [isNativeApp,setIsNativeApp]=useState(false);
  useEffect(()=>{
    if(typeof navigator!=='undefined'&&navigator.userAgent.includes('WebfitNewsApp')){
      setIsNativeApp(true);
    }
  },[]);

  async function emailLogin(e:React.FormEvent){
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const supabase=createClient();
    const {error}=await supabase.auth.signInWithOtp({
      email,
      options:{emailRedirectTo:getAuthCallback()}
    });
    setBusy(false);
    setMessage(error?error.message:'Check your email for a secure sign-in link.');
  }

  async function googleLogin(){
    setGoogleBusy(true);
    setMessage('');
    const supabase=createClient();
    const {error}=await supabase.auth.signInWithOAuth({
      provider:'google',
      options:{redirectTo:getAuthCallback()}
    });
    if(error){
      setGoogleBusy(false);
      setMessage(error.message);
    }
  }

  return <main className="reader-login-page"><div className="reader-login-shell"><Link href="/"><img src="/webfit-news-logo.png" alt="Webfit News"/></Link><span>Reader account</span><h1>Sign in to Webfit News</h1><p>Use one account for reader features and future supporter benefits. Newsroom staff should use the separate newsroom login.</p>
    {!isNativeApp&&<><div className="reader-oauth"><button type="button" disabled={googleBusy} onClick={googleLogin}>{googleBusy?'Opening Google...':'Continue with Google'}</button></div>
    <div className="reader-or"><span>or use email</span></div></>}
    <form onSubmit={emailLogin}><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button type="submit" disabled={busy}>{busy?'Sending sign-in link...':'Email me a sign-in link'}</button></form>
    {message?<p className="reader-message">{message}</p>:null}<small>No password is required for email sign-in.</small><Link className="reader-newsroom-link" href="/admin/login">Newsroom staff sign in</Link></div></main>
}
