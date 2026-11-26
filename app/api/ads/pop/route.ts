import { NextResponse } from 'next/server';
import { getLiveAds } from '@/lib/ads';

/**
 * Live pop-in video ads for components/VideoPopIn.tsx:
 *  - now:   slot SITE_VIDEO_POP_NOW, shown as soon as a page opens
 *  - later: slot SITE_VIDEO_POP, shown after a minute on the site
 */
export const revalidate = 300;

export async function GET() {
  const live = await getLiveAds();
  return NextResponse.json(
    { now: live['SITE_VIDEO_POP_NOW'] || [], later: live['SITE_VIDEO_POP'] || [] },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}
