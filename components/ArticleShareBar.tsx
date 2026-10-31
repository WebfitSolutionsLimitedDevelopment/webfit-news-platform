'use client';

import { useEffect, useState } from 'react';
import styles from './ArticleEnd.module.css';

/** End-of-story share buttons. No public share counts: a row of zeros puts readers off. */
export function ArticleShareBar({ url, title }: { url: string; title: string }) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'); }, []);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: 'Facebook', cls: styles.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: 'WhatsApp', cls: styles.whatsapp, href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}` },
    { label: 'X', cls: styles.x, href: `https://x.com/intent/post?url=${u}&text=${t}` },
    { label: 'LinkedIn', cls: styles.linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: 'Email', cls: styles.email, href: `mailto:?subject=${t}&body=${encodeURIComponent(`I thought you might find this useful:\n\n${title}\n${url}`)}` },
  ];

  const nativeShare = async () => { try { await navigator.share({ title, url }); } catch {} };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <section className={styles.block} aria-label="Share this story">
      <h2 className={styles.heading}>Share this story</h2>
      <div className={styles.row}>
        {canNativeShare ? <button type="button" className={`${styles.btn} ${styles.native}`} onClick={nativeShare}>Share…</button> : null}
        {links.map(l => <a key={l.label} className={`${styles.btn} ${l.cls}`} href={l.href} target={l.label === 'Email' ? undefined : '_blank'} rel="noopener noreferrer">{l.label}</a>)}
        <button type="button" className={`${styles.btn} ${styles.copy}`} onClick={copy} aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</button>
      </div>
    </section>
  );
}
