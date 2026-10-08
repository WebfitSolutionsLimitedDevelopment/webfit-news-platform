import { NextResponse } from 'next/server';
import { absoluteUrl } from '@/lib/site';
import { addConfirmedSubscriber, readConfirmToken } from '@/lib/newsletter';

export const runtime = 'nodejs';

/** Step 2 of double opt-in: the reader clicked the link in their email. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('t') || '';
  const reader = readConfirmToken(token);
  if (!reader) return NextResponse.redirect(absoluteUrl('/subscribe?status=expired'), 303);
  try {
    await addConfirmedSubscriber(reader.email, reader.firstName);
  } catch (error) {
    console.error('[newsletter] confirm failed', error);
    return NextResponse.redirect(absoluteUrl('/subscribe?status=error'), 303);
  }
  return NextResponse.redirect(absoluteUrl('/subscribe?status=confirmed'), 303);
}
