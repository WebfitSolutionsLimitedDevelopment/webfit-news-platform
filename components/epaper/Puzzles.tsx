'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { WordSearch } from '@/lib/epaper-puzzles';
import styles from './Puzzles.module.css';

/*
 * Play this week's puzzles on screen: the sudoku printed on page 19 and a word search
 * made from the words in this week's news. Progress is saved on the reader's device
 * (localStorage, per edition), so they can come back to it. Nothing is sent anywhere.
 */

const load = <T,>(key: string, fallback: T): T => { try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } };
const save = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function Puzzles({ editionKey, sudoku, wordSearch, onClose, start = 'sudoku' }: { editionKey: string; sudoku: number[] | null; wordSearch: WordSearch | null; onClose: () => void; start?: 'sudoku' | 'words' }) {
  const [tab, setTab] = useState<'sudoku' | 'words'>(sudoku ? start : 'words');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  return <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="This week's puzzles" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className={styles.panel}>
      <div className={styles.bar}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Back to the paper">×</button>
        <div className={styles.tabs} role="tablist">
          {sudoku ? <button type="button" role="tab" aria-selected={tab === 'sudoku'} className={tab === 'sudoku' ? styles.on : ''} onClick={() => setTab('sudoku')}>Sudoku</button> : null}
          {wordSearch ? <button type="button" role="tab" aria-selected={tab === 'words'} className={tab === 'words' ? styles.on : ''} onClick={() => setTab('words')}>Word search</button> : null}
        </div>
      </div>
      {tab === 'sudoku' && sudoku ? <SudokuGame key={`s${editionKey}`} editionKey={editionKey} puzzle={sudoku}/> : null}
      {tab === 'words' && wordSearch ? <WordSearchGame key={`w${editionKey}`} editionKey={editionKey} ws={wordSearch}/> : null}
    </div>
  </div>;
}

/* ------------------------------------------------------------------ sudoku */

function conflicts(v: number[]): Set<number> {
  const bad = new Set<number>();
  for (let i = 0; i < 81; i += 1) {
    if (!v[i]) continue;
    const r = Math.floor(i / 9), c = i % 9;
    for (let j = 0; j < 81; j += 1) {
      if (j === i || v[j] !== v[i]) continue;
      const r2 = Math.floor(j / 9), c2 = j % 9;
      if (r === r2 || c === c2 || (Math.floor(r / 3) === Math.floor(r2 / 3) && Math.floor(c / 3) === Math.floor(c2 / 3))) { bad.add(i); break; }
    }
  }
  return bad;
}

function SudokuGame({ editionKey, puzzle }: { editionKey: string; puzzle: number[] }) {
  const storeKey = `wf-sudoku-${editionKey}`;
  const [vals, setVals] = useState<number[]>(() => puzzle.slice());
  const [secs, setSecs] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const started = useRef(false);
  useEffect(() => {
    const saved = load<{ v: number[]; s: number } | null>(storeKey, null);
    if (saved?.v?.length === 81) { setVals(saved.v.map((x, i) => puzzle[i] || x)); setSecs(saved.s || 0); started.current = saved.v.some((x, i) => x && !puzzle[i]); }
  }, [storeKey, puzzle]);
  const bad = useMemo(() => conflicts(vals), [vals]);
  const solved = vals.every(Boolean) && bad.size === 0;
  useEffect(() => {
    if (solved || !started.current) return;
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [solved, vals]);
  useEffect(() => { save(storeKey, { v: vals, s: secs }); }, [storeKey, vals, secs]);

  const put = (n: number) => {
    if (sel == null || puzzle[sel] || solved) return;
    started.current = true;
    setVals(v => { const next = v.slice(); next[sel] = n; return next; });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sel == null) return;
      if (/^[1-9]$/.test(e.key)) put(Number(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') put(0);
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const d = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key as 'ArrowUp'] || 0;
        setSel(s => (s == null ? 0 : Math.min(80, Math.max(0, s + d))));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
  const reset = () => { if (window.confirm('Clear your numbers and start again?')) { setVals(puzzle.slice()); setSecs(0); started.current = false; } };
  const peer = (i: number) => sel != null && (Math.floor(i / 9) === Math.floor(sel / 9) || i % 9 === sel % 9 || (Math.floor(i / 27) === Math.floor(sel / 27) && Math.floor((i % 9) / 3) === Math.floor((sel % 9) / 3)));
  const left = vals.filter(x => !x).length;

  return <div className={styles.game}>
    <p className={styles.status}>{solved ? <b>Solved in {clock(secs)}. Well done!</b> : <>Medium · {left} squares to go · {clock(secs)}</>}</p>
    <div className={styles.sudoku} role="grid" aria-label="Sudoku">
      {vals.map((v, i) => <button key={i} type="button" role="gridcell" data-c={i % 9} data-r={Math.floor(i / 9)}
        className={[puzzle[i] ? styles.given : '', sel === i ? styles.sel : peer(i) ? styles.peer : '', sel != null && v && vals[sel] === v ? styles.same : '', bad.has(i) && !puzzle[i] ? styles.bad : ''].join(' ')}
        onClick={() => setSel(i)} aria-label={`Row ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1}${v ? `, ${v}` : ', empty'}`}>{v || ''}</button>)}
    </div>
    <div className={styles.pad}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <button key={n} type="button" onClick={() => put(n)} disabled={sel == null || !!puzzle[sel] || solved}>{n}</button>)}
      <button type="button" onClick={() => put(0)} disabled={sel == null || !!puzzle[sel] || solved} aria-label="Clear square">⌫</button>
    </div>
    <p className={styles.help}>Tap a square, then a number. Every row, column and 3×3 box needs 1 to 9 once. Numbers that clash show in red. <button type="button" className={styles.link} onClick={reset}>Start again</button></p>
  </div>;
}

/* ------------------------------------------------------------------ word search */

function lineCells(a: number, b: number, size: number): number[] | null {
  const r1 = Math.floor(a / size), c1 = a % size, r2 = Math.floor(b / size), c2 = b % size;
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
  const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
  if (!(r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1))) return null; // straight lines only
  return Array.from({ length: len + 1 }, (_, i) => (r1 + dr * i) * size + (c1 + dc * i));
}

const COLOURS = ['#ffe08a', '#bfe3c0', '#c9d8ff', '#ffc9c9', '#e3ccff', '#ffd8b0', '#c4ece9', '#f5c6e8', '#d8e6a6', '#d6d0c4'];

function WordSearchGame({ editionKey, ws }: { editionKey: string; ws: WordSearch }) {
  const storeKey = `wf-words-${editionKey}`;
  const [found, setFound] = useState<string[]>([]);
  const [start, setStart] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { setFound(load<string[]>(storeKey, [])); }, [storeKey]);
  useEffect(() => { save(storeKey, found); }, [storeKey, found]);

  const colourOf = new Map<number, string>();
  ws.placements.forEach((p, k) => { if (found.includes(p.word) || shown) p.cells.forEach(c => { if (!colourOf.has(c)) colourOf.set(c, COLOURS[k % COLOURS.length]); }); });
  const preview = start != null && hover != null ? new Set(lineCells(start, hover, ws.size) || [start]) : new Set(start != null ? [start] : []);

  const drag = useRef<number | null>(null); // where a finger or mouse went down
  const finish = (from: number, end: number) => {
    const cells = lineCells(from, end, ws.size);
    setStart(null); setHover(null);
    if (!cells || cells.length < 2) return;
    const key = cells.join(','), back = [...cells].reverse().join(',');
    const hit = ws.placements.find(p => !found.includes(p.word) && (p.cells.join(',') === key || p.cells.join(',') === back));
    if (hit) { setFound(f => [...f, hit.word]); setMsg(`Found ${hit.word}!`); }
    else setMsg('Not one of this week’s words. Try again.');
    setTimeout(() => setMsg(null), 1600);
  };
  // Tap first letter then last letter, or drag from one to the other (works with touch too).
  const cellAt = (x: number, y: number) => { const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest('[data-i]'); return el ? Number(el.getAttribute('data-i')) : null; };
  const down = (e: RPointerEvent) => { const i = cellAt(e.clientX, e.clientY); if (i == null) return; drag.current = i; setHover(null); };
  const move = (e: RPointerEvent) => { if (drag.current == null) return; const i = cellAt(e.clientX, e.clientY); if (i != null && i !== drag.current) { setStart(drag.current); setHover(i); } };
  const up = (e: RPointerEvent) => {
    const from = drag.current; drag.current = null;
    const i = cellAt(e.clientX, e.clientY);
    if (from == null || i == null) return;
    if (i !== from) { finish(from, i); return; } // a drag
    if (start == null) setStart(i); else if (start === i) setStart(null); else finish(start, i); // a tap
  };
  const done = found.length === ws.words.length;

  return <div className={styles.game}>
    <p className={styles.status}>{done ? <b>All {ws.words.length} words found. Well done!</b> : msg || <>Find {ws.words.length} words from this week’s news · {found.length} found</>}</p>
    <div className={styles.words} role="grid" aria-label="Word search" style={{ gridTemplateColumns: `repeat(${ws.size}, 1fr)` }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; }}>
      {ws.grid.split('').map((ch, i) => <button key={i} type="button" role="gridcell" data-i={i}
        style={colourOf.has(i) ? { background: colourOf.get(i) } : undefined}
        className={preview.has(i) ? styles.pick : ''}>{ch}</button>)}
    </div>
    <ul className={styles.list}>{ws.words.map(w => <li key={w} className={found.includes(w) ? styles.got : ''}>{w}</li>)}</ul>
    <p className={styles.help}>Tap the first letter of a word, then its last letter (or drag across it). Words run across, down, diagonally and sometimes backwards.
      {' '}<button type="button" className={styles.link} onClick={() => setShown(s => !s)}>{shown ? 'Hide answers' : 'Show answers'}</button>
      {' · '}<button type="button" className={styles.link} onClick={() => { if (window.confirm('Clear the words you found?')) setFound([]); }}>Start again</button></p>
  </div>;
}
