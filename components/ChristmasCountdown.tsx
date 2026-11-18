'use client';

import { useEffect, useState } from 'react';
import { christmasCountdownActive, christmasEnd, christmasStart, nzYear } from '../lib/christmas';
import s from './HeaderExtras.module.css';

type Left = { days: number; hours: number; minutes: number; seconds: number; today: boolean; done: boolean };

function timeLeft(now: Date): Left {
  const year = nzYear(now);
  const ms = christmasStart(year).getTime() - now.getTime();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, today: now < christmasEnd(year), done: now >= christmasEnd(year) };
  const secs = Math.floor(ms / 1000);
  return {
    days: Math.floor(secs / 86400),
    hours: Math.floor((secs % 86400) / 3600),
    minutes: Math.floor((secs % 3600) / 60),
    seconds: secs % 60,
    today: false,
    done: false,
  };
}

const BULB = ['#ff5f57', '#ffd45c', '#62d3ff', '#ff8fd8', '#7fe39a'];

/** Fairy lights strung across the top of the card. */
function LightString() {
  const bulbs: { x: number; y: number; c: string; d: number }[] = [];
  for (let k = 0; k < 8; k++) {
    for (const t of [0.22, 0.5, 0.78]) {
      bulbs.push({ x: k * 80 + 80 * t, y: 6 + 44 * t * (1 - t), c: BULB[bulbs.length % BULB.length], d: (bulbs.length * 0.37) % 2.4 });
    }
  }
  const wire = Array.from({ length: 8 }, (_, k) => `Q${k * 80 + 40} 28 ${k * 80 + 80} 6`).join(' ');
  return <svg className={s.lights} viewBox="0 0 640 40" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
    <path d={`M0 6 ${wire}`} fill="none" stroke="#0b2419" strokeWidth="1.6"/>
    {bulbs.map((b, i) => <g key={i} transform={`translate(${b.x} ${b.y})`}>
      <rect x="-2.2" y="-1" width="4.4" height="3.6" rx="1" fill="#0b2419"/>
      <ellipse className={s.bulb} cx="0" cy="7.4" rx="3.6" ry="5.2" fill={b.c} style={{ color: b.c, animationDelay: `${b.d}s` }}/>
    </g>)}
  </svg>;
}

/** A small lit tree with Santa popping up behind it now and then. */
function TreeScene({ waving }: { waving: boolean }) {
  const lights = [[49, 57], [61, 61], [72, 55], [37, 91], [50, 96], [64, 95], [79, 89], [26, 129], [42, 134], [58, 136], [74, 133], [91, 127]];
  return <div className={s.scene} aria-hidden="true">
    <svg className={`${s.santa} ${waving ? s.santaStay : ''}`} viewBox="0 0 90 100">
      <path d="M8 100 Q13 69 45 67 Q77 69 82 100 Z" fill="#c62f34"/>
      <rect x="41" y="69" width="8" height="31" fill="#fff8ee"/>
      <g className={s.arm}>
        <path d="M71 80 Q83 70 84 54" fill="none" stroke="#c62f34" strokeWidth="10" strokeLinecap="round"/>
        <rect x="76" y="61" width="16" height="6" rx="3" fill="#fff8ee" transform="rotate(-70 84 64)"/>
        <circle cx="84" cy="50" r="6.5" fill="#1d5b39"/>
      </g>
      <circle cx="45" cy="44" r="14" fill="#f4caa8"/>
      <ellipse cx="45" cy="60" rx="19" ry="15" fill="#fff8ee"/>
      <circle cx="32" cy="67" r="7" fill="#fff8ee"/><circle cx="45" cy="72" r="8" fill="#fff8ee"/><circle cx="58" cy="67" r="7" fill="#fff8ee"/>
      <circle cx="35.5" cy="48" r="3" fill="#f09a96" opacity=".75"/><circle cx="54.5" cy="48" r="3" fill="#f09a96" opacity=".75"/>
      <path d="M38 42.5 q2 -2.4 4 0 M48 42.5 q2 -2.4 4 0" fill="none" stroke="#3a2418" strokeWidth="1.8" strokeLinecap="round"/>
      <ellipse cx="40" cy="52" rx="6" ry="3.2" fill="#fff8ee"/><ellipse cx="50" cy="52" rx="6" ry="3.2" fill="#fff8ee"/>
      <circle cx="45" cy="48.5" r="2.7" fill="#e7897a"/>
      <path d="M29 31 Q38 3 67 9 Q60 18 61 31 Z" fill="#c62f34"/>
      <rect x="27" y="28" width="36" height="9" rx="4.5" fill="#fff8ee"/>
      <circle cx="68" cy="10" r="5" fill="#fff8ee"/>
    </svg>
    <svg className={s.tree} viewBox="0 0 120 160">
      <defs>
        <linearGradient id="wf-tree" x1="0" x2="1">
          <stop offset="0" stopColor="#3f9a62"/><stop offset=".5" stopColor="#2f7f4f"/><stop offset=".5" stopColor="#246640"/><stop offset="1" stopColor="#1f5a38"/>
        </linearGradient>
      </defs>
      <rect x="52" y="140" width="16" height="16" rx="2" fill="#6e4528"/>
      <polygon points="60,20 94,70 26,70" fill="url(#wf-tree)"/>
      <polygon points="60,46 104,106 16,106" fill="url(#wf-tree)"/>
      <polygon points="60,78 114,144 6,144" fill="url(#wf-tree)"/>
      <path d="M45 56 Q60 66 75 54 M32 90 Q55 101 83 87 M20 126 Q58 141 96 124" fill="none" stroke="#f3dc93" strokeWidth="1" opacity=".55"/>
      {lights.map(([x, y], i) => <circle key={i} className={s.bulb} cx={x} cy={y} r="3.3" fill={BULB[i % BULB.length]} style={{ color: BULB[i % BULB.length], animationDelay: `${(i * 0.41) % 2.4}s` }}/>)}
      <path className={s.star} d="M60 3 l4.1 8.4 9.2 1.3 -6.7 6.5 1.6 9.2 -8.2 -4.3 -8.2 4.3 1.6 -9.2 -6.7 -6.5 9.2 -1.3 z" fill="#f6cc4e"/>
    </svg>
  </div>;
}

function Tile({ value, label }: { value: number | null; label: string }) {
  const text = value === null ? '--' : String(value).padStart(2, '0');
  return <div className={s.tile}>
    <span className={s.tileFace}><span key={text} className={s.digits}>{text}</span></span>
    <span className={s.tileLabel}>{label}</span>
  </div>;
}

/**
 * Christmas countdown at the top of the public site, first in the strip above
 * the cricket scores. Counts to midnight on 25 December, New Zealand time.
 * The card keeps its size while the numbers load, so nothing moves. Lights
 * twinkle and Santa pops up behind the tree every so often; all motion stops
 * for readers who ask their device to reduce motion.
 */
export function ChristmasCountdown() {
  const [left, setLeft] = useState<Left | null>(null);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      setLeft(timeLeft(new Date()));
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
    return () => window.clearTimeout(id);
  }, []);

  if (left?.done || (left && !christmasCountdownActive(new Date()))) return null;
  const dayWord = new Intl.DateTimeFormat('en-NZ', { weekday: 'long', timeZone: 'Pacific/Auckland' }).format(christmasStart(nzYear()));
  const spoken = left && !left.today
    ? `${left.days} days, ${left.hours} hours and ${left.minutes} minutes until Christmas`
    : 'Countdown to Christmas';

  return <section className={s.xmas} aria-label="Christmas countdown">
    <LightString/>
    <div className={s.copy}>
      {left?.today ? <>
        <h2 className={s.title}>Meri Kirihimete</h2>
        <p className={s.sub}>Merry Christmas from all of us at Webfit News.</p>
      </> : <>
        <h2 className={s.title}>Counting down to Christmas</h2>
        <div className={s.tiles} aria-hidden="true">
          <Tile value={left?.days ?? null} label={left?.days === 1 ? 'day' : 'days'}/>
          <Tile value={left?.hours ?? null} label="hours"/>
          <Tile value={left?.minutes ?? null} label="min"/>
          <Tile value={left?.seconds ?? null} label="sec"/>
        </div>
        <p className={s.sub}>{dayWord} 25 December</p>
        <span className={s.srOnly}>{spoken}</span>
      </>}
    </div>
    <TreeScene waving={!!left?.today}/>
  </section>;
}
