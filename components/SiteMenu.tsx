'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import styles from './SiteMenu.module.css';

const sections=[
  ['New Zealand','/category/new-zealand'],
  ['Auckland','/category/auckland'],
  ['Politics','/category/politics'],
  ['Business','/category/business'],
  ['Immigration','/category/immigration'],
  ['India','/category/india'],
  ['World','/category/world'],
  ['Community','/category/communities'],
  ['Entertainment','/category/entertainment'],
  ['Sports','/category/sports'],
  ['Opinion','/category/opinion'],
];

const publication=[
  ['About','/about'],
  ['Editorial Policy','/editorial-policy'],
  ['Corrections','/corrections'],
  ['Privacy Policy','/privacy-policy'],
  ['Terms','/terms'],
  ['Contact','/contact'],
  ['Advertise','/advertise-media-kit'],
  ['Support Webfit News','/support-us'],
  ['RSS','/rss.xml'],
];

export function SiteMenu({label='Menu',mobile=false}:{label?:string;mobile?:boolean}){
  const [open,setOpen]=useState(false);
  const menuId=`site-menu-${useId().replaceAll(':','')}`;

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setOpen(false);
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[]);

  useEffect(()=>{
    document.body.style.overflow=open?'hidden':'';
    return()=>{document.body.style.overflow='';};
  },[open]);

  const close=()=>setOpen(false);

  return <>
    <button
      className={`${mobile?'':'menu-chip'} ${styles.trigger} ${mobile?styles.mobileTrigger:''}`}
      type="button"
      aria-label={open?'Close sections':'Open sections'}
      aria-expanded={open}
      aria-controls={menuId}
      onClick={()=>setOpen(value=>!value)}
    >
      <span className={styles.triggerLabel}>{label}</span>
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6.5h18M3 12h18M3 17.5h18"/>
      </svg>
    </button>

    {open?<div className={styles.layer}>
      <button className={styles.backdrop} aria-label="Close sections" onClick={close}/>
      <aside id={menuId} className={styles.drawer} aria-label="Site navigation">
        <div className={styles.head}>
          <Link href="/" className={styles.brand} onClick={close}>
            <img src="/webfit-news-logo.png" alt="Webfit News"/>
          </Link>
          <button className={styles.close} type="button" onClick={close} aria-label="Close sections">
            <span aria-hidden="true">×</span>
            <b>Close</b>
          </button>
        </div>

        <div className={styles.content}>
          <section>
            <span className={styles.label}>Sections</span>
            <nav className={styles.links} aria-label="News sections">
              {sections.map(([itemLabel,href])=><Link key={href} href={href} onClick={close}>{itemLabel}</Link>)}
            </nav>
          </section>

          <section>
            <span className={styles.label}>Webfit News</span>
            <nav className={`${styles.links} ${styles.secondary}`} aria-label="Publication links">
              {publication.map(([itemLabel,href])=><Link key={href} href={href} onClick={close}>{itemLabel}</Link>)}
            </nav>
          </section>
        </div>

        <div className={styles.foot}>
          <Link className={styles.footPrimary} href="/login" onClick={close}>Sign in</Link>
          <Link href="/search" onClick={close}>Search</Link>
          <Link href="/support-us" onClick={close}>Support us</Link>
        </div>
      </aside>
    </div>:null}
  </>;
}
