'use client';

import { useEffect, useState } from 'react';
import styles from './ArticleEnd.module.css';
import { Icon, type IconName } from './SocialIcons';

/** End-of-story share icons. No public share counts: a row of zeros puts readers off. */
export function ArticleShareBar({ url, title }: { url: string; title: string }) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function'); }, []);

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links: { label: string; icon: IconName; href: string; external: boolean }[] = [
    { label: 'Share on Facebook', icon: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, external: true },
    { label: 'Share on WhatsApp', icon: 'whatsapp', href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, external: true },
    { label: 'Share on X', icon: 'x', href: `https://x.com/intent/post?url=${u}&text=${t}`, external: true },
    { label: 'Share on LinkedIn', icon: 'linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, external: true },
    { label: 'Share by email', icon: 'mail', href: `mailto:?subject=${t}&body=${encodeURIComponent(`I thought you might find this useful:\n\n${title}\n${url}`)}`, external: false },
  ];

  const nativeShare = async () => { try { await navigator.share({ title, url }); } catch {} };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div className={styles.line}>
      <span className={styles.lineLabel}>Share</span>
      <div className={styles.icons}>
        {canNativeShare ? <button type="button" className={`${styles.icon} ${styles.plain}`} onClick={nativeShare} aria-label="Share" title="Share"><Icon name="share" /></button> : null}
        {links.map(l => (
          <a key={l.icon} className={`${styles.icon} ${styles[l.icon] || ''}`} href={l.href} aria-label={l.label} title={l.label}
            {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><Icon name={l.icon} /></a>
        ))}
        <button type="button" className={`${styles.icon} ${styles.plain}`} onClick={copy} aria-label={copied ? 'Link copied' : 'Copy link'} title={copied ? 'Link copied' : 'Copy link'}>
          <Icon name={copied ? 'check' : 'link'} />
        </button>
        <span className={styles.copied} aria-live="polite">{copied ? 'Link copied' : ''}</span>
      </div>
    </div>
  );
}
