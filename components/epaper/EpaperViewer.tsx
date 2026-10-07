'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Epaper.module.css';

/** Pages are laid out at this size, then scaled to fit the screen like a printed page. */
export const PAGE_W = 560;
export const PAGE_H = 792;
const TURN_MS = 650;
const SPREAD_MIN_WIDTH = 900;

type Page = { key: string; label: string; node: ReactNode };
type Spread = { left?: number; right?: number };
type Turn = { dir: 'next' | 'prev'; to: number };

/** Cover on its own on the right, then facing pairs (2–3, 4–5 …), like a magazine. */
function spreadOf(i: number, count: number): Spread {
  if (i <= 0) return { right: 0 };
  const left = i % 2 === 1 ? i : i - 1;
  const right = left + 1 < count ? left + 1 : undefined;
  return { left, right };
}

function sendImpression(assignmentId: string) {
  try {
    const d = window.matchMedia('(max-width: 720px)').matches ? 'mobile' : 'desktop';
    const body = JSON.stringify({ a: assignmentId, e: 'impression', d });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/ads/event', new Blob([body], { type: 'application/json' }));
    else fetch('/api/ads/event', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
  } catch {}
}

export function EpaperViewer({ pages, title }: { pages: Page[]; title: string }) {
  const count = pages.length;
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const seenAds = useRef(new Set<string>());
  const touchX = useRef<number | null>(null);

  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [spreadMode, setSpreadMode] = useState(false);
  const [scale, setScale] = useState(0.6);
  const [zoom, setZoom] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Start on the page in the address bar (#page-4), if any.
  useEffect(() => {
    const m = window.location.hash.match(/^#page-(\d+)$/);
    if (m) setIndex(Math.min(count - 1, Math.max(0, Number(m[1]) - 1)));
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [count]);

  // Fit pages to the screen: two facing pages on wide screens, one on phones.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const width = stage.clientWidth;
      const spread = width >= SPREAD_MIN_WIDTH;
      setSpreadMode(spread);
      const across = spread ? 2 : 1;
      const byWidth = (width - 8) / (PAGE_W * across);
      const maxHeight = Math.max(420, window.innerHeight - 150);
      const byHeight = maxHeight / PAGE_H;
      setScale(spread ? Math.min(byWidth, byHeight) : Math.min(byWidth, 1.4));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const spread = spreadOf(index, count);
  const lastShown = spreadMode ? (spread.right ?? spread.left ?? 0) : index;
  const firstShown = spreadMode ? (spread.left ?? spread.right ?? 0) : index;
  const canNext = lastShown < count - 1;
  const canPrev = firstShown > 0;

  const go = useCallback((dir: 'next' | 'prev') => {
    if (turn) return;
    const to = dir === 'next' ? lastShown + 1 : firstShown - 1;
    if (to < 0 || to >= count) return;
    if (reduceMotion || zoom > 1) { setIndex(to); return; }
    setTurn({ dir, to });
  }, [turn, lastShown, firstShown, count, reduceMotion, zoom]);

  const jump = useCallback((to: number) => {
    if (turn) return;
    setIndex(Math.min(count - 1, Math.max(0, to)));
  }, [turn, count]);

  useEffect(() => {
    if (!turn) return;
    const t = window.setTimeout(() => { setIndex(turn.to); setTurn(null); }, TURN_MS);
    return () => window.clearTimeout(t);
  }, [turn]);

  // Keep the address bar in step, so a page can be shared or reloaded.
  useEffect(() => {
    const hash = index > 0 ? `#page-${index + 1}` : ' ';
    try { window.history.replaceState(null, '', hash === ' ' ? window.location.pathname : hash); } catch {}
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go('next'); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go('prev'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // Count an ad impression the first time its page is on screen.
  useEffect(() => {
    if (turn) return;
    const stage = stageRef.current;
    if (!stage) return;
    stage.querySelectorAll<HTMLElement>('[data-ad-assignment]').forEach(el => {
      const id = el.dataset.adAssignment;
      if (id && !seenAds.current.has(id)) { seenAds.current.add(id); sendImpression(id); }
    });
  }, [index, turn, spreadMode]);

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => {});
  };

  const s = scale * zoom;
  const pageBox = { width: PAGE_W * s, height: PAGE_H * s };

  const renderPage = (i: number | undefined, extra = '') => {
    if (i === undefined || i < 0 || i >= count) return <div className={`${styles.sheet} ${styles.sheetBlank} ${extra}`} style={pageBox}/>;
    return <div className={`${styles.sheet} ${extra}`} style={pageBox} aria-label={`Page ${i + 1}: ${pages[i].label}`}>
      <div className={styles.sheetInner} style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${s})` }}>{pages[i].node}</div>
    </div>;
  };

  const stageContent = (() => {
    if (spreadMode) {
      if (!turn) {
        return <div className={styles.spread}>{renderPage(spread.left, styles.sheetLeft)}{renderPage(spread.right, styles.sheetRight)}</div>;
      }
      const target = spreadOf(turn.to, count);
      if (turn.dir === 'next') {
        return <div className={styles.spread}>
          {renderPage(spread.left, styles.sheetLeft)}
          {renderPage(target.right, styles.sheetRight)}
          <div className={`${styles.leaf} ${styles.leafRight}`} style={{ ...pageBox, animationDuration: `${TURN_MS}ms` }}>
            <div className={styles.leafFace}>{renderPage(spread.right)}</div>
            <div className={`${styles.leafFace} ${styles.leafBack}`}>{renderPage(target.left)}</div>
          </div>
        </div>;
      }
      return <div className={styles.spread}>
        {renderPage(target.left, styles.sheetLeft)}
        {renderPage(spread.right, styles.sheetRight)}
        <div className={`${styles.leaf} ${styles.leafLeft}`} style={{ ...pageBox, animationDuration: `${TURN_MS}ms` }}>
          <div className={styles.leafFace}>{renderPage(spread.left)}</div>
          <div className={`${styles.leafFace} ${styles.leafBackLeft}`}>{renderPage(target.right)}</div>
        </div>
      </div>;
    }
    if (!turn) return <div className={styles.single}>{renderPage(index)}</div>;
    if (turn.dir === 'next') {
      return <div className={styles.single}>
        {renderPage(turn.to)}
        <div className={`${styles.leaf} ${styles.leafSingleOut}`} style={{ ...pageBox, animationDuration: `${TURN_MS}ms` }}>
          <div className={styles.leafFace}>{renderPage(index)}</div>
        </div>
      </div>;
    }
    return <div className={styles.single}>
      {renderPage(index)}
      <div className={`${styles.leaf} ${styles.leafSingleIn}`} style={{ ...pageBox, animationDuration: `${TURN_MS}ms` }}>
        <div className={styles.leafFace}>{renderPage(turn.to)}</div>
      </div>
    </div>;
  })();

  const pageLabel = spreadMode && spread.left !== undefined && spread.right !== undefined
    ? `Pages ${spread.left + 1}–${spread.right + 1} of ${count}`
    : `Page ${(spreadMode ? (spread.right ?? spread.left ?? 0) : index) + 1} of ${count}`;

  return <div ref={wrapRef} className={styles.viewer}>
    <div className={styles.toolbar} role="toolbar" aria-label={`${title} controls`}>
      <button type="button" onClick={() => go('prev')} disabled={!canPrev || !!turn} aria-label="Previous page">‹ <span>Prev</span></button>
      <label className={styles.jump}>
        <span className={styles.srOnly}>Go to page</span>
        <select value={index} onChange={e => jump(Number(e.target.value))}>
          {pages.map((p, i) => <option key={p.key} value={i}>{i + 1} · {p.label}</option>)}
        </select>
      </label>
      <span className={styles.counter} aria-live="polite">{pageLabel}</span>
      <button type="button" onClick={() => setZoom(z => (z > 1 ? 1 : 1.8))} aria-pressed={zoom > 1}>{zoom > 1 ? 'Fit page' : 'Zoom'}</button>
      <button type="button" onClick={toggleFullscreen} className={styles.hideSmall}>Full screen</button>
      <button type="button" onClick={() => go('next')} disabled={!canNext || !!turn} aria-label="Next page"><span>Next</span> ›</button>
    </div>
    <div
      ref={stageRef}
      className={`${styles.stage} ${zoom > 1 ? styles.stageZoomed : ''}`}
      onTouchStart={e => { touchX.current = zoom > 1 ? null : e.touches[0]?.clientX ?? null; }}
      onTouchEnd={e => {
        const start = touchX.current; touchX.current = null;
        const end = e.changedTouches[0]?.clientX;
        if (start == null || end == null) return;
        const dx = end - start;
        if (Math.abs(dx) > 50) go(dx < 0 ? 'next' : 'prev');
      }}
    >
      {canPrev && zoom === 1 ? <button type="button" className={`${styles.edge} ${styles.edgeLeft}`} onClick={() => go('prev')} aria-label="Previous page" tabIndex={-1}/> : null}
      {stageContent}
      {canNext && zoom === 1 ? <button type="button" className={`${styles.edge} ${styles.edgeRight}`} onClick={() => go('next')} aria-label="Next page" tabIndex={-1}/> : null}
    </div>
    <p className={styles.hint}>Swipe or use the arrow keys to turn pages. Tap a headline to read the full story.</p>
  </div>;
}
