'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './EditorialSupportPrompt.module.css';

const STORAGE_KEY='webfit-news-support-prompt-dismissed';
const DISMISS_FOR_MS=7*24*60*60*1000;

export function EditorialSupportPrompt(){
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    try{
      const dismissedAt=Number(window.localStorage.getItem(STORAGE_KEY)||0);
      if(dismissedAt&&Date.now()-dismissedAt<DISMISS_FOR_MS)return;
    }catch{}

    let shown=false;
    const show=()=>{
      if(shown)return;
      shown=true;
      setOpen(true);
      window.removeEventListener('scroll',onScroll);
    };
    const onScroll=()=>{
      const doc=document.documentElement;
      const scrollable=Math.max(1,doc.scrollHeight-window.innerHeight);
      if(window.scrollY/scrollable>=0.35)show();
    };
    const timer=window.setTimeout(show,18000);
    window.addEventListener('scroll',onScroll,{passive:true});
    return()=>{
      window.clearTimeout(timer);
      window.removeEventListener('scroll',onScroll);
    };
  },[]);

  useEffect(()=>{
    if(!open)return;
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')dismiss();};
    document.addEventListener('keydown',onKey);
    return()=>document.removeEventListener('keydown',onKey);
  },[open]);

  function dismiss(){
    try{window.localStorage.setItem(STORAGE_KEY,String(Date.now()));}catch{}
    setOpen(false);
  }

  if(!open)return null;

  return <div className={styles.backdrop} role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)dismiss();}}>
    <section className={styles.card} role="dialog" aria-modal="true" aria-labelledby="webfit-support-title">
      <button className={styles.close} type="button" aria-label="Close support message" onClick={dismiss}>×</button>
      <span className={styles.eyebrow}>Webfit News · Reader supported</span>
      <h2 className={styles.title} id="webfit-support-title">Good journalism should stay open to everyone.</h2>
      <p className={styles.copy}>If Webfit News is useful to you, help us keep independent New Zealand and community reporting free and accessible.</p>
      <div className={styles.actions}>
        <Link className={styles.primary} href="/support-us">Support Webfit News</Link>
        <Link className={styles.secondary} href="/support-us">See ways to contribute</Link>
        <button className={styles.later} type="button" onClick={dismiss}>Maybe later</button>
      </div>
    </section>
  </div>;
}
