'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styles from './Epaper.module.css';
import { playFlipSound, saveSoundPreference, soundPreference, unlockFlipSound } from './flipSound';

/** Pages are laid out at this size, then scaled to fit the screen like a printed page. */
export const PAGE_W = 560;
export const PAGE_H = 792;
const TURN_MS = 650;
const SPREAD_MIN_WIDTH = 900;
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.5;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));

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

export function EpaperViewer({ pages, title, fileName }: { pages: Page[]; title: string; fileName: string }) {
  const count = pages.length;
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const seenAds = useRef(new Set<string>());
  const touchX = useRef<number | null>(null);

  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [spreadMode, setSpreadMode] = useState(false);
  const [scale, setScale] = useState(0.6);
  const [zoom, setZoomState] = useState(1);
  const zoomRef = useRef(1);
  /** Point (in stage coordinates) that should stay still while zooming. */
  const focal = useRef<{ x: number; y: number; from: number } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

  const setZoom = useCallback((next: number, at?: { x: number; y: number }) => {
    const stage = stageRef.current;
    const z = clampZoom(next);
    if (z === zoomRef.current) return;
    const point = at || (stage ? { x: stage.clientWidth / 2, y: Math.min(stage.clientHeight, window.innerHeight) / 2 } : { x: 0, y: 0 });
    focal.current = { ...point, from: zoomRef.current };
    zoomRef.current = z;
    setZoomState(z);
  }, []);

  // Keep the point under the fingers (or the centre) in place after a zoom.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const f = focal.current;
    focal.current = null;
    if (!stage || !f) return;
    if (zoom <= 1) { stage.scrollLeft = 0; stage.scrollTop = 0; return; }
    const ratio = zoom / f.from;
    stage.scrollLeft = (stage.scrollLeft + f.x) * ratio - f.x;
    stage.scrollTop = (stage.scrollTop + f.y) * ratio - f.y;
  }, [zoom]);

  // Pinch to zoom and double-tap to zoom, on the paper itself. Native listeners so
  // we can stop the browser zooming the whole website instead.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const local = (x: number, y: number) => { const r = stage.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch.current = { dist: dist(e.touches), zoom: zoomRef.current };
        touchX.current = null;
        e.preventDefault();
      }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinch.current) return;
      e.preventDefault();
      const mid = local((e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2);
      setZoom(pinch.current.zoom * (dist(e.touches) / pinch.current.dist), mid);
    };
    const onEnd = (e: TouchEvent) => {
      if (pinch.current) { if (e.touches.length < 2) pinch.current = null; lastTap.current = null; return; }
      if (e.changedTouches.length !== 1 || e.touches.length) return;
      const t = e.changedTouches[0];
      const now = Date.now();
      const prev = lastTap.current;
      if (prev && now - prev.t < 300 && Math.hypot(t.clientX - prev.x, t.clientY - prev.y) < 30) {
        e.preventDefault();
        lastTap.current = null;
        setZoom(zoomRef.current > 1 ? 1 : 2.5, local(t.clientX, t.clientY));
        return;
      }
      lastTap.current = { t: now, x: t.clientX, y: t.clientY };
    };
    stage.addEventListener('touchstart', onStart, { passive: false });
    stage.addEventListener('touchmove', onMove, { passive: false });
    stage.addEventListener('touchend', onEnd, { passive: false });
    return () => {
      stage.removeEventListener('touchstart', onStart);
      stage.removeEventListener('touchmove', onMove);
      stage.removeEventListener('touchend', onEnd);
    };
  }, [setZoom]);

  // Ctrl/⌘ + scroll wheel (and trackpad pinch on laptops) zooms the paper.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      setZoom(zoomRef.current * Math.exp(-e.deltaY / 300), { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [setZoom]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sound, setSound] = useState(true);
  const [exporting, setExporting] = useState<null | { done: number; total: number }>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setSound(soundPreference()); }, []);
  const soundRef = useRef(true);
  soundRef.current = sound;

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
    if (soundRef.current) playFlipSound(reduceMotion || zoom > 1 ? 450 : TURN_MS);
    if (reduceMotion || zoom > 1) { setIndex(to); return; }
    setTurn({ dir, to });
  }, [turn, lastShown, firstShown, count, reduceMotion, zoom]);

  const jump = useCallback((to: number) => {
    if (turn) return;
    if (soundRef.current && to !== index) playFlipSound(450);
    setIndex(Math.min(count - 1, Math.max(0, to)));
  }, [turn, count, index]);

  useEffect(() => {
    if (!turn) return;
    const t = window.setTimeout(() => { setIndex(turn.to); setTurn(null); }, TURN_MS);
    return () => window.clearTimeout(t);
  }, [turn]);

  // A new page starts at its top-left corner when zoomed in.
  useEffect(() => {
    const stage = stageRef.current;
    if (stage && zoomRef.current > 1) { stage.scrollLeft = 0; stage.scrollTop = 0; }
  }, [index]);

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
      if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(zoomRef.current + ZOOM_STEP); }
      if (e.key === '-' || e.key === '_') { e.preventDefault(); setZoom(zoomRef.current - ZOOM_STEP); }
      if (e.key === '0') { e.preventDefault(); setZoom(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, setZoom]);

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

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    saveSoundPreference(next);
    if (next) { unlockFlipSound(); playFlipSound(450); }
  };

  // PDF: render every page once, off screen, at full size, then draw them into a PDF.
  const downloadPdf = async () => {
    if (exporting) return;
    unlockFlipSound();
    setExportNote(null);
    setExporting({ done: 0, total: count });
    try {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const root = exportRef.current;
      if (!root) throw new Error('not ready');
      const imgs = Array.from(root.querySelectorAll('img'));
      imgs.forEach(img => { img.loading = 'eager'; });
      await Promise.all(imgs.map(img => (img.complete ? null : new Promise(r => { img.onload = img.onerror = () => r(null); setTimeout(r, 8000); }))));
      const pageEls = Array.from(root.querySelectorAll<HTMLElement>('[data-export-page] > *'));
      const { downloadEpaperPdf } = await import('./epaperPdf');
      const size = await downloadEpaperPdf(pageEls, fileName, title, (done, total) => setExporting({ done, total }));
      setExportNote(`Downloaded ${fileName} (${(size / 1_048_576).toFixed(1)} MB). Share it on WhatsApp, email or print it.`);
    } catch {
      setExportNote('Sorry, the PDF could not be made on this device. Please try again, or use a laptop.');
    } finally {
      setExporting(null);
    }
  };

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
      <div className={styles.zoomGroup} role="group" aria-label="Zoom">
        <button type="button" onClick={() => setZoom(zoom - ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out">−</button>
        <button type="button" className={styles.zoomLevel} onClick={() => setZoom(zoom > 1 ? 1 : 2)} aria-label={zoom > 1 ? 'Fit page to screen' : 'Zoom in to 200%'}>{zoom > 1 ? `${Math.round(zoom * 100)}%` : 'Fit'}</button>
        <button type="button" onClick={() => setZoom(zoom + ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in">+</button>
      </div>
      <button type="button" onClick={toggleFullscreen} className={styles.hideSmall}>Full screen</button>
      <button type="button" className={styles.soundButton} onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Turn page sound off' : 'Turn page sound on'} title={sound ? 'Page sound on' : 'Page sound off'}>{sound ? '🔊' : '🔇'}</button>
      <button type="button" className={styles.pdfButton} onClick={downloadPdf} disabled={!!exporting}>{exporting ? `PDF ${exporting.done}/${exporting.total}` : '⬇ PDF'}</button>
      <button type="button" onClick={() => go('next')} disabled={!canNext || !!turn} aria-label="Next page"><span>Next</span> ›</button>
    </div>
    <div
      ref={stageRef}
      className={`${styles.stage} ${zoom > 1 ? styles.stageZoomed : ''}`}
      onTouchStart={e => { touchX.current = zoom > 1 || e.touches.length > 1 ? null : e.touches[0]?.clientX ?? null; }}
      onTouchEnd={e => {
        const start = touchX.current; touchX.current = null;
        if (pinch.current || e.touches.length) return;
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
    {exportNote ? <p className={styles.exportNote} role="status">{exportNote}</p> : null}
    {exporting ? <div ref={exportRef} className={styles.exportStack} aria-hidden="true">
      {pages.map(p => <div key={p.key} data-export-page style={{ width: PAGE_W, height: PAGE_H }}>{p.node}</div>)}
    </div> : null}
    <p className={styles.hint}>{zoom > 1
      ? 'Drag to move around the page. Pinch, double-tap or press Fit to see the whole page again.'
      : 'Swipe to turn pages. Pinch or double-tap to zoom. Tap a headline to read the full story.'}</p>
  </div>;
}
