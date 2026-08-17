'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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

export function SiteMenu(){
  const [open,setOpen]=useState(false);

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
      className={`menu-chip ${styles.trigger}`}
      type="button"
      aria-label={open?'Close menu':'Open menu'}
      aria-expanded={open}
      aria-controls="site-menu-drawer"
      onClick={()=>setOpen(value=>!value)}
    >
      <span className={styles.icon} aria-hidden="true"><i></i><i></i><i></i></span>
      <span className={styles.triggerLabel}>Menu</span>
    </button>

    {open?<div className={styles.layer}>
      <button className={styles.backdrop} aria-label="Close menu" onClick={close}/>
      <aside id="site-menu-drawer" className={styles.drawer} aria-label="Site navigation">
        <div className={styles.head}>
          <Link href="/" className={styles.brand} onClick={close}>
            <img src="/webfit-news-logo.png" alt="Webfit News"/>
          </Link>
          <button className={styles.close} type="button" onClick={close} aria-label="Close menu">Close</button>
        </div>

        <div className={styles.content}>
          <div>
            <span className={styles.label}>News</span>
            <nav className={styles.links} aria-label="News sections">
              {sections.map(([label,href])=><Link key={href} href={href} onClick={close}>{label}</Link>)}
            </nav>
          </div>

          <div>
            <span className={styles.label}>Webfit News</span>
            <nav className={`${styles.links} ${styles.secondary}`} aria-label="Publication links">
              {publication.map(([label,href])=><Link key={href} href={href} onClick={close}>{label}</Link>)}
            </nav>
          </div>
        </div>

        <div className={styles.foot}>
          <Link href="/search" onClick={close}>Search</Link>
          <Link href="/login" onClick={close}>Reader Sign In</Link>
        </div>
      </aside>
    </div>:null}
  </>;
}
