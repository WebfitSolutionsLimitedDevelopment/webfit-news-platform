import { NextResponse } from 'next/server';
import { getLiveAds } from '@/lib/ads';

/**
 * The live pop-in video ad(s) (slot SITE_VIDEO_POP). Fetched by components/VideoPopIn.tsx only
 * after a reader has spent a minute on the site, so short visits cost nothing.
 */
export const revalidate = 300;

export async function GET() {
  const ads = (await getLiveAds())['SITE_VIDEO_POP'] || [];
  return NextResponse.json(ads, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
}
