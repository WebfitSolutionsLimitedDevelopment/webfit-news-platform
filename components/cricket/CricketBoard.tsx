'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CricInnings, CricketBoard as Board, CricMatch, CricTeam } from '@/lib/cricket';
import s from './CricketBoard.module.css';

const POLL_MS = 60_000;

/** Keeps the board fresh while the tab is visible. The server caches, so this never adds provider calls. */
function useLiveBoard(initial: Board) {
  const [board, setBoard] = useState(initial);
  useEffect(() => {
    let timer = 0;
    const tick = async () => {
      if (!document.hidden) {
        try {
          const r = await fetch('/api/cricket');
          const d = await r.json();
          if (d?.available) setBoard(d.board);
        } catch { /* keep what we have */ }
      }
      timer = window.setTimeout(tick, POLL_MS);
    };
    timer = window.setTimeout(tick, POLL_MS);
    return () => window.clearTimeout(timer);
  }, []);
  return board;
}

function nzWhen(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Pacific/Auckland' }).format(d);
}

function nzTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en-NZ', { hour: 'numeric', minute: '2-digit', timeZone: 'Pacific/Auckland' }).format(d);
}

function Badge({ team, size = 28 }: { team: CricTeam; size?: number }) {
  const [broken, setBroken] = useState(false);
  return team.img && !broken
    ? <img className={s.badge} src={team.img} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)}/>
    : <span className={s.badgeText} style={{ width: size, height: size }} aria-hidden="true">{team.short.slice(0, 3)}</span>;
}

function State({ m }: { m: CricMatch }) {
  if (m.state === 'live') return <span className={`${s.pill} ${s.pillLive}`}>Live</span>;
  if (m.state === 'result') return <span className={s.pill}>Result</span>;
  return <span className={s.pill}>{nzWhen(m.startsAt) || 'Upcoming'}</span>;
}

function TeamRow({ team, big }: { team: CricTeam; big?: boolean }) {
  return <div className={big ? `${s.team} ${s.teamBig}` : s.team}>
    <Badge team={team} size={big ? 34 : 24}/>
    <span className={s.teamName}><span className={s.long}>{team.name}</span><span className={s.short}>{team.short}</span></span>
    <span className={s.teamScore}>{team.score || (big ? 'Yet to bat' : '')}</span>
  </div>;
}

function MatchRow({ m }: { m: CricMatch }) {
  return <li className={s.row}>
    <div className={s.rowHead}><span>{m.series || m.matchType.toUpperCase()}</span><State m={m}/></div>
    <TeamRow team={m.teams[0]}/>
    <TeamRow team={m.teams[1]}/>
    {m.status && m.state !== 'fixture' ? <p className={s.rowStatus}>{m.status}</p> : null}
  </li>;
}

function BattingTable({ inn, onlyNotOut }: { inn: CricInnings; onlyNotOut?: boolean }) {
  const rows = onlyNotOut ? inn.batting.filter(b => b.notOut) : inn.batting;
  if (!rows.length) return null;
  return <table className={s.table}>
    <thead><tr><th>{onlyNotOut ? 'Batting' : 'Batter'}</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
    <tbody>{rows.map((b, i) => <tr key={i}>
      <td><b>{b.name}{b.notOut ? '*' : ''}</b>{!onlyNotOut && b.dismissal ? <small>{b.dismissal}</small> : null}</td>
      <td className={s.strong}>{b.r}</td><td>{b.b}</td><td>{b.fours}</td><td>{b.sixes}</td><td>{b.sr}</td>
    </tr>)}</tbody>
  </table>;
}

function BowlingTable({ inn }: { inn: CricInnings }) {
  if (!inn.bowling.length) return null;
  return <table className={s.table}>
    <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
    <tbody>{inn.bowling.map((w, i) => <tr key={i}><td><b>{w.name}</b></td><td>{w.o}</td><td>{w.m}</td><td>{w.r}</td><td className={s.strong}>{w.w}</td><td>{w.econ}</td></tr>)}</tbody>
  </table>;
}

/** The headline match, laid out like a broadcaster's scorecard. */
function Featured({ board }: { board: Board }) {
  const m = board.featured!;
  const card = board.scorecard;
  const [tab, setTab] = useState<'now' | 'card'>('now');
  const current = card?.innings[card.innings.length - 1];
  return <article className={s.featured}>
    <header className={s.featHead}>
      <h2>{m.series || m.name}</h2>
      {card?.venue ? <p>{card.venue}</p> : null}
    </header>
    {card?.tossNote ? <p className={s.toss}>{card.tossNote}</p> : null}
    <div className={s.featTeams}>
      <div><TeamRow team={m.teams[0]} big/><TeamRow team={m.teams[1]} big/></div>
      <State m={m}/>
    </div>
    {m.status ? <p className={s.featStatus}>{m.status}</p> : null}
    {card?.innings.length ? <>
      <div className={s.tabs} role="tablist">
        <button role="tab" aria-selected={tab === 'now'} onClick={() => setTab('now')}>{m.state === 'live' ? 'Now' : 'Last innings'}</button>
        <button role="tab" aria-selected={tab === 'card'} onClick={() => setTab('card')}>Full scorecard</button>
      </div>
      {tab === 'now' && current ? <div className={s.tabBody}>
        <h3>{current.title}{current.total ? <span>{current.total}</span> : null}</h3>
        <BattingTable inn={current} onlyNotOut={m.state === 'live'}/>
        <BowlingTable inn={current}/>
      </div> : null}
      {tab === 'card' ? <div className={s.tabBody}>
        {card.innings.map((inn, i) => <section key={i} className={s.innings}>
          <h3>{inn.title}{inn.total ? <span>{inn.total}</span> : null}</h3>
          <BattingTable inn={inn}/>
          <BowlingTable inn={inn}/>
        </section>)}
      </div> : null}
    </> : null}
  </article>;
}

function List({ title, items }: { title: string; items: CricMatch[] }) {
  if (!items.length) return null;
  return <section className={s.list}><h2>{title}</h2><ul>{items.map(m => <MatchRow key={m.id} m={m}/>)}</ul></section>;
}

/** Full score centre on /live-cricket. */
export function CricketBoardFull({ initial }: { initial: Board }) {
  const board = useLiveBoard(initial);
  const featuredId = board.featured?.id;
  const rest = (xs: CricMatch[]) => xs.filter(m => m.id !== featuredId);
  return <div className={s.full}>
    {board.featured ? <Featured board={board}/> : null}
    <div className={s.lists}>
      <List title="Live now" items={rest(board.live)}/>
      <List title="Recent results" items={rest(board.results)}/>
      <List title="Coming up" items={rest(board.upcoming)}/>
    </div>
    <p className={s.credit}>Scores from CricTimes, checked every minute (last update {nzTime(board.updatedAt)}). Times are New Zealand time.</p>
  </div>;
}

/** Slim version for the header strip: the headline match only. */
export function CricketBoardCompact({ initial }: { initial: Board }) {
  const board = useLiveBoard(initial);
  const m = board.featured;
  const others = board.live.filter(x => x.id !== m?.id).length;
  return <section className={s.compact} aria-label="Cricket scores">
    <div className={s.compactHead}><span>Cricket scores</span><Link href="/live-cricket">Full score centre →</Link></div>
    {m ? <Link href="/live-cricket" className={s.compactBody}>
      <div className={s.rowHead}><span>{m.series || m.name}</span><State m={m}/></div>
      <TeamRow team={m.teams[0]} big/>
      <TeamRow team={m.teams[1]} big/>
      {m.status ? <p className={s.rowStatus}>{m.status}</p> : null}
      <p className={s.more}>{others ? `${others} more live ${others === 1 ? 'match' : 'matches'} · ` : ''}Updated {nzTime(board.updatedAt)}</p>
    </Link> : <p className={s.empty}>No matches right now.</p>}
  </section>;
}
