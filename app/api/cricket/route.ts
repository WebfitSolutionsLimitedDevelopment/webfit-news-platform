import { NextResponse } from 'next/server';
import { getCricketBoard } from '@/lib/cricket';

export const runtime = 'nodejs';

/**
 * Scores for the header strip and /live-cricket. The browser asks every minute;
 * Vercel's edge answers from cache for 60 s and the provider is only called on
 * the timers in lib/cricket.ts, so readers never add to the provider's count.
 */
export async function GET() {
  const board = await getCricketBoard();
  return NextResponse.json(board ? { available: true, board } : { available: false }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
