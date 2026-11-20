import { getCricketBoard } from '@/lib/cricket';
import { CricketBoardCompact, CricketBoardFull } from './cricket/CricketBoard';
import { CricketWidgetFrame } from './cricket/CricketWidgetFrame';

/**
 * Cricket scores for the header strip (compact) and /live-cricket (full).
 * Our own scoreboard from CricketData.org when CRICKETDATA_API_KEY is set and
 * the provider answers; otherwise the old CricTimes widget, so the slot is never empty.
 */
export async function CricketScores({ compact = false }: { compact?: boolean }) {
  const board = await getCricketBoard().catch(() => null);
  if (!board) return <CricketWidgetFrame compact={compact}/>;
  return compact ? <CricketBoardCompact initial={board}/> : <CricketBoardFull initial={board}/>;
}
