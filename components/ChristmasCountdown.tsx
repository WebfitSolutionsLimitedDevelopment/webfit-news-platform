'use client';

import { useEffect, useState } from 'react';
import { christmasCountdownActive, christmasEnd, christmasStart, nzYear } from '../lib/christmas';
import styles from './HeaderExtras.module.css';

type Left = { days: number; hours: number; minutes: number; today: boolean; done: boolean };

function timeLeft(now: Date): Left {
  const year = nzYear(now);
  const start = christmasStart(year).getTime();
  const ms = start - now.getTime();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, today: now < christmasEnd(year), done: now >= christmasEnd(year) };
  const mins = Math.floor(ms / 60000);
  return { days: Math.floor(mins / 1440), hours: Math.floor((mins % 1440) / 60), minutes: mins % 60, today: false, done: false };
}

/** Pōhutukawa, New Zealand's summer Christmas tree, drawn as a spray of stamens. */
function Pohutukawa() {
  const rays = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    const r = i % 2 ? 46 : 58;
    return { x: 70 + Math.cos(a) * r, y: 70 + Math.sin(a) * r };
  });
  return <svg className={styles.flower} viewBox="0 0 140 140" aria-hidden="true">
    {rays.map((p, i) => <line key={i} x1="70" y1="70" x2={p.x} y2={p.y} stroke="#d4243a" strokeWidth="2.4" strokeLinecap="round"/>)}
    {rays.map((p, i) => <circle key={`t${i}`} cx={p.x} cy={p.y} r="3.4" fill="#e9c35d"/>)}
    <circle cx="70" cy="70" r="9" fill="#8e1426"/>
  </svg>;
}

/**
 * Christmas countdown beside the header cricket scores. Counts to midnight
 * on 25 December, New Zealand time, updating once a minute. The box keeps its
 * size while the numbers load, so nothing on the page moves.
 */
export function ChristmasCountdown() {
  const [left, setLeft] = useState<Left | null>(null);
  useEffect(() => {
    const tick = () => setLeft(timeLeft(new Date()));
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, []);

  if (left?.done || (left && !christmasCountdownActive(new Date()))) return null;
  const dayWord = new Intl.DateTimeFormat('en-NZ', { weekday: 'long', timeZone: 'Pacific/Auckland' }).format(christmasStart(nzYear()));
  const n = (v: number | undefined) => (v === undefined ? '–' : String(v));

  return <section className={styles.xmas} aria-label="Christmas countdown">
    <Pohutukawa/>
    {left?.today ? <div className={styles.xmasBody}>
      <p className={styles.xmasLabel}>Christmas Day</p>
      <p className={styles.xmasGreeting}>Meri Kirihimete</p>
      <p className={styles.xmasNote}>Merry Christmas from everyone at Webfit News.</p>
    </div> : <div className={styles.xmasBody}>
      <p className={styles.xmasLabel}>Countdown to Christmas</p>
      <div className={styles.xmasCount} role="timer">
        <span className={styles.xmasDays}><b>{n(left?.days)}</b> {left?.days === 1 ? 'day' : 'days'}</span>
        <span className={styles.xmasSmall}><b>{n(left?.hours)}</b> hr <b>{n(left?.minutes)}</b> min</span>
      </div>
      <p className={styles.xmasNote}>{dayWord} 25 December. Meri Kirihimete.</p>
    </div>}
  </section>;
}
