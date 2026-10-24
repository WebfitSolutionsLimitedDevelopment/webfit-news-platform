'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { resizedImage } from '@/lib/image-url';
import styles from './StoryReader.module.css';

/*
 * Story view: tap a headline in the e-paper and the story opens as a phone-sized
 * article (large type, the photo, the full text) instead of a tiny newspaper column.
 * Swipe or use the arrows for the next story in the edition; Esc or × to go back to the page.
 */

export type ReaderStory = { slug: string; title: string; section: string; image: string | null };
type Full = { title: string; slug: string; publishedAt: string; author: string | null; image: string | null; imageAlt: string; blocks: Array<{ k: 'p' | 'h'; t: string }> };

const SIZES = [17, 19, 22];

export function StoryReader({ stories, openSlug, onClose, editionLabel }: { stories: ReaderStory[]; openSlug: string | null; onClose: () => void; editionLabel: string }) {
  const [slug, setSlug] = useState<string | null>(openSlug);
  const [full, setFull] = useState<Full | null>(null);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState(0);
  const cache = useRef(new Map<string, Full>());
  const panel = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => { setSlug(openSlug); }, [openSlug]);
  useEffect(() => { try { const s = Number(localStorage.getItem('wf-reader-size')); if (s >= 0 && s < SIZES.length) setSize(s); } catch {} }, []);

  const index = slug ? stories.findIndex(s => s.slug === slug) : -1;
  const meta = index >= 0 ? stories[index] : null;

  const load = useCallback(async (s: string) => {
    if (cache.current.has(s)) return cache.current.get(s)!;
    const res = await fetch(`/api/epaper/story/${encodeURIComponent(s)}`);
    if (!res.ok) throw new Error('not found');
    const json = (await res.json()) as Full;
    cache.current.set(s, json);
    return json;
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setFailed(false);
    setFull(cache.current.get(slug) || null);
    load(slug).then(f => { if (!cancelled) setFull(f); }).catch(() => { if (!cancelled) setFailed(true); });
    // Fetch the next story too, so swiping is instant.
    const next = stories[index + 1]?.slug;
    if (next) load(next).catch(() => {});
    panel.current?.scrollTo({ top: 0 });
    return () => { cancelled = true; };
  }, [slug, index, stories, load]);

  const go = useCallback((d: number) => { const t = stories[index + d]; if (t) setSlug(t.slug); }, [stories, index]);

  useEffect(() => {
    if (!slug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [slug, go, onClose]);

  if (!slug) return null;
  const setFont = (s: number) => { setSize(s); try { localStorage.setItem('wf-reader-size', String(s)); } catch {} };
  const storyUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`;
  const title = full?.title || meta?.title || '';
  const date = full?.publishedAt ? new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Pacific/Auckland' }).format(new Date(full.publishedAt)) : '';
  const image = full?.image || meta?.image;
  const body = (full?.blocks || []).filter(b => !/^Read the full story at /.test(b.t));

  return <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={title} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={styles.panel} ref={panel}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const x0 = touchX.current; touchX.current = null;
        if (x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
      }}>
      <div className={styles.bar}>
        <button type="button" onClick={onClose} className={styles.close} aria-label="Back to the page">×</button>
        <span className={styles.where}>{meta?.section || editionLabel}{index >= 0 ? ` · ${index + 1} of ${stories.length}` : ''}</span>
        <span className={styles.sizes} role="group" aria-label="Text size">
          {SIZES.map((_, i) => <button key={i} type="button" onClick={() => setFont(i)} aria-pressed={size === i} className={size === i ? styles.on : ''} style={{ fontSize: 12 + i * 3 }}>A</button>)}
        </span>
      </div>
      <article className={styles.story} style={{ fontSize: SIZES[size] }}>
        <h1>{title}</h1>
        <p className={styles.byline}>{[full?.author ? `By ${full.author}` : null, date].filter(Boolean).join(' · ')}</p>
        {image ? <img className={styles.photo} src={resizedImage(image, 900, 78)} alt={full?.imageAlt || ''}/> : null}
        {failed ? <p className={styles.note}>This story couldn’t be loaded. <a href={`/${slug}`}>Read it on webfitnews.com</a>.</p>
          : !full ? <p className={styles.note} role="status">Loading the story…</p>
          : body.map((b, i) => b.k === 'h' ? <h2 key={i}>{b.t}</h2> : <p key={i}>{b.t}</p>)}
        <div className={styles.actions}>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${storyUrl}`)}`} target="_blank" rel="noopener" className={styles.wa}>Share on WhatsApp</a>
          <a href={`/${slug}`} className={styles.site}>Open on webfitnews.com</a>
        </div>
      </article>
      <nav className={styles.pager} aria-label="Stories in this edition">
        <button type="button" onClick={() => go(-1)} disabled={index <= 0}>‹ Previous story</button>
        <button type="button" onClick={() => go(1)} disabled={index < 0 || index >= stories.length - 1}>Next story ›</button>
      </nav>
    </div>
  </div>;
}
