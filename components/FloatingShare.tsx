'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './FloatingShare.module.css';
import { Icon } from './SocialIcons';
import { shareLinks } from './ArticleShareBar';

/**
 * Share icons that follow the reader down the story.
 * - Wide screens: a vertical column in the left margin, always open (it sits beside the text, not on it).
 * - Phones and narrower screens: one round Share button on the right edge; tap to open the column.
 *   It starts closed so it never sits on top of the words people are reading.
 * Hidden while the share row under the headline, or the Share box at the end, is on screen.
 */
export function FloatingShare({ url, title }: { url: string; title: string }) {
  const [inZone, setInZone] = useState(false);
  const [open, setOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
    const top = document.getElementById('share-top');
    const end = document.getElementById('share-end');
    const seen = new Map<Element, boolean>();
    const update = () => {
      const topVisible = top ? seen.get(top) ?? true : false;
      const endVisible = end ? seen.get(end) ?? false : false;
      const pastTop = top ? top.getBoundingClientRect().bottom < 0 : window.scrollY > 400;
      const beforeEnd = end ? end.getBoundingClientRect().top > window.innerHeight : true;
      const show = !topVisible && !endVisible && pastTop && beforeEnd;
      setInZone(show);
      if (!show) setOpen(false);
    };
    const io = new IntersectionObserver(entries => { entries.forEach(e => seen.set(e.target, e.isIntersecting)); update(); });
    if (top) io.observe(top);
    if (end) io.observe(end);
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => { io.disconnect(); window.removeEventListener('scroll', update); };
  }, []);

  // Close the phone column when the reader taps elsewhere.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <div ref={box} className={`${styles.wrap} ${inZone ? styles.show : ''} ${open ? styles.open : ''}`} aria-hidden={!inZone}>
      <div className={styles.list} id="floating-share-list">
        {shareLinks(url, title).map(l => (
          <a key={l.icon} className={`${styles.icon} ${styles[l.icon] || ''}`} href={l.href} aria-label={l.label} title={l.label}
            tabIndex={inZone ? 0 : -1} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <Icon name={l.icon} />
          </a>
        ))}
        <button type="button" className={`${styles.icon} ${styles.plain}`} onClick={copy} tabIndex={inZone ? 0 : -1}
          aria-label={copied ? 'Link copied' : 'Copy link'} title={copied ? 'Link copied' : 'Copy link'}>
          <Icon name={copied ? 'check' : 'link'} />
        </button>
        {canNativeShare ? (
          <button type="button" className={`${styles.icon} ${styles.plain} ${styles.nativeOnly}`} tabIndex={inZone ? 0 : -1}
            onClick={async () => { try { await navigator.share({ title, url }); } catch {} }} aria-label="More ways to share" title="More ways to share">
            <span className={styles.more} aria-hidden="true">•••</span>
          </button>
        ) : null}
      </div>
      <button type="button" className={`${styles.icon} ${styles.toggle}`} onClick={() => setOpen(o => !o)} tabIndex={inZone ? 0 : -1}
        aria-expanded={open} aria-controls="floating-share-list" aria-label={open ? 'Close share options' : 'Share this story'} title="Share this story">
        <Icon name={open ? 'close' : 'share'} />
      </button>
    </div>
  );
}
