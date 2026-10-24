'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { resizedImage } from '@/lib/image-url';
import styles from './StoryReader.module.css';

/*
 * Story view: tap a headline in the e-paper and the story opens as a phone-sized
 * article (large type, the photo, the full text) instead of a tiny newspaper column.
 * Swipe or use the arrows for the next story in the edition; Esc or × to go back to the page.
 *
 * Listen: reads the story aloud with the phone's or computer's own voice (Web Speech API, free,
 * nothing sent anywhere), paragraph by paragraph, highlighting the one being read, then carries
 * on with the next story in the edition.
 */

export type ReaderStory = { slug: string; title: string; section: string; image: string | null };
type Full = { title: string; slug: string; publishedAt: string; author: string | null; image: string | null; imageAlt: string; blocks: Array<{ k: 'p' | 'h'; t: string }> };

const SIZES = [17, 19, 22];
const RATES = [1, 1.2, 0.85];

/** A natural English voice, preferring New Zealand, then Australian, British and Indian English. */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : [];
  for (const lang of ['en-NZ', 'en-AU', 'en-GB', 'en-IN', 'en-US', 'en']) {
    const matches = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang.toLowerCase()));
    const best = matches.find(v => /natural|neural|enhanced|premium|siri|google/i.test(v.name)) || matches[0];
    if (best) return best;
  }
  return voices[0] || null;
}

/** Speech engines stop on very long utterances, so read in sentence-sized pieces. */
function pieces(text: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (const sentence of text.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g) || [text]) {
    if ((cur + sentence).length > 220 && cur) { out.push(cur.trim()); cur = ''; }
    cur += sentence;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function StoryReader({ stories, openSlug, onClose, editionLabel, autoplay = false }: { stories: ReaderStory[]; openSlug: string | null; onClose: () => void; editionLabel: string; autoplay?: boolean }) {
  const [slug, setSlug] = useState<string | null>(openSlug);
  const [full, setFull] = useState<Full | null>(null);
  const [failed, setFailed] = useState(false);
  const [size, setSize] = useState(0);
  const cache = useRef(new Map<string, Full>());
  const panel = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => { setSlug(openSlug); }, [openSlug]);

  // ---- Listen
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [para, setPara] = useState(-1);
  const [rate, setRate] = useState(0);
  const run = useRef(0); // bumps on every start/stop, so callbacks from an old run are ignored
  const wantPlay = useRef(false); // keep reading when the next story arrives
  const stopSpeech = useCallback(() => { run.current += 1; wantPlay.current = false; if (canSpeak) window.speechSynthesis.cancel(); setSpeaking('idle'); setPara(-1); }, [canSpeak]);
  useEffect(() => { if (openSlug && autoplay) wantPlay.current = true; }, [openSlug, autoplay]);
  useEffect(() => () => { if (canSpeak) window.speechSynthesis.cancel(); }, [canSpeak]);
  useEffect(() => { if (canSpeak) window.speechSynthesis.getVoices(); }, [canSpeak]); // voices load late on some browsers
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
    load(slug).then(f => { if (!cancelled) setFull(f); }).catch(() => {
      if (cancelled) return;
      setFailed(true);
      // Listening through the edition: skip a story that won't load rather than stop.
      const after = stories[index + 1];
      if (wantPlay.current && after) setTimeout(() => setSlug(after.slug), 400);
    });
    // Fetch the next story too, so swiping is instant.
    const next = stories[index + 1]?.slug;
    if (next) load(next).catch(() => {});
    panel.current?.scrollTo({ top: 0 });
    return () => { cancelled = true; };
  }, [slug, index, stories, load]);

  const go = useCallback((d: number) => {
    const t = stories[index + d];
    if (!t) return;
    const keepReading = speaking !== 'idle';
    run.current += 1;
    if (canSpeak) window.speechSynthesis.cancel();
    wantPlay.current = keepReading;
    setPara(-1);
    setSlug(t.slug);
  }, [stories, index, speaking, canSpeak]);

  useEffect(() => {
    if (!slug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { stopSpeech(); onClose(); }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [slug, go, onClose, stopSpeech]);

  const body0 = (full?.blocks || []).filter(b => !/^Read the full story at /.test(b.t));

  /** Read from paragraph `from` (-1 = the headline) to the end, then on to the next story. */
  const play = useCallback((from = -1) => {
    if (!canSpeak || !full) return;
    const synth = window.speechSynthesis;
    try { synth.cancel(); } catch {}
    const my = ++run.current;
    const voice = pickVoice();
    const items: Array<{ i: number; text: string }> = [{ i: -1, text: full.title }, ...body0.map((b, i) => ({ i, text: b.t }))].filter(x => x.i >= from);
    const queue = items.flatMap(x => pieces(x.text).map(text => ({ i: x.i, text })));
    let k = 0;
    const next = () => {
      if (run.current !== my) return;
      if (k >= queue.length) {
        // Story finished: on to the next one in the edition, still reading.
        const after = stories[index + 1];
        if (after) { wantPlay.current = true; setPara(-1); setSlug(after.slug); } else { setSpeaking('idle'); setPara(-1); }
        return;
      }
      const { i, text } = queue[k++];
      setPara(i);
      const u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-NZ';
      u.rate = RATES[rate];
      u.onend = next;
      u.onerror = (e) => { if (run.current === my && (e as SpeechSynthesisErrorEvent).error !== 'interrupted' && (e as SpeechSynthesisErrorEvent).error !== 'canceled') next(); };
      // If this browser's speech engine refuses, stop quietly rather than break the story view.
      try { synth.speak(u); } catch { run.current += 1; setSpeaking('idle'); setPara(-1); }
    };
    wantPlay.current = false;
    setSpeaking('playing');
    next();
  }, [canSpeak, full, body0, stories, index, rate]);

  // The next story has loaded while we're still reading: carry on.
  useEffect(() => { if (wantPlay.current && full && full.slug === slug) play(-1); }, [full, slug, play]);
  // Keep the paragraph being read in view.
  useEffect(() => { if (para >= 0) panel.current?.querySelector(`[data-para="${para}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [para]);

  const pause = () => { if (!canSpeak) return; if (speaking === 'playing') { window.speechSynthesis.pause(); setSpeaking('paused'); } else if (speaking === 'paused') { window.speechSynthesis.resume(); setSpeaking('playing'); } };
  const changeRate = () => { const r = (rate + 1) % RATES.length; setRate(r); if (speaking !== 'idle') setTimeout(() => play(para), 0); };

  if (!slug) return null;
  const setFont = (s: number) => { setSize(s); try { localStorage.setItem('wf-reader-size', String(s)); } catch {} };
  const storyUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`;
  const title = full?.title || meta?.title || '';
  const date = full?.publishedAt ? new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Pacific/Auckland' }).format(new Date(full.publishedAt)) : '';
  const image = full?.image || meta?.image;
  const body = body0;

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
        <button type="button" onClick={() => { stopSpeech(); onClose(); }} className={styles.close} aria-label="Back to the page">×</button>
        <span className={styles.where}>{meta?.section || editionLabel}{index >= 0 ? ` · ${index + 1} of ${stories.length}` : ''}</span>
        {canSpeak && full ? (speaking === 'idle'
          ? <button type="button" className={styles.listen} onClick={() => play(-1)}>▶ Listen</button>
          : <span className={styles.listenGroup} role="group" aria-label="Listening">
              <button type="button" className={styles.listen} onClick={pause} aria-label={speaking === 'playing' ? 'Pause' : 'Resume'}>{speaking === 'playing' ? '❚❚' : '▶'}</button>
              <button type="button" className={styles.listenSmall} onClick={changeRate} aria-label="Reading speed">{RATES[rate]}×</button>
              <button type="button" className={styles.listenSmall} onClick={stopSpeech} aria-label="Stop">■</button>
            </span>) : null}
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
          : body.map((b, i) => b.k === 'h' ? <h2 key={i} data-para={i} className={para === i ? styles.reading : undefined}>{b.t}</h2> : <p key={i} data-para={i} className={para === i ? styles.reading : undefined} onDoubleClick={() => canSpeak && play(i)}>{b.t}</p>)}
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
