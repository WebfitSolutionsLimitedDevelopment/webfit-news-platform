import { NextResponse } from 'next/server';
import { absoluteUrl } from '@/lib/site';
import { addConfirmedSubscriber, button, emailFrom, emailShell, esc, normaliseEmail, resend, senderFooter } from '@/lib/newsletter';

export const runtime = 'nodejs';

/**
 * One step: the reader asked for the e-paper on /subscribe, so they are
 * subscribed straight away (no confirm email to click) and get a welcome
 * email with a link to this week's edition. Every e-paper email carries a
 * one-tap unsubscribe link.
 */
export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  // Honeypot: real people never fill the hidden "website" field.
  if (body?.website) return NextResponse.json({ ok: true });
  const email = normaliseEmail(body?.email);
  if (!email) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  const firstName = String(body?.firstName || '').trim().replace(/[<>]/g, '').slice(0, 60);

  try {
    await addConfirmedSubscriber(email, firstName);
  } catch (error) {
    console.error('[newsletter] subscribe failed', error);
    return NextResponse.json({ error: 'We couldn’t sign you up just now. Please try again shortly.' }, { status: 502 });
  }

  const html = emailShell({
    preheader: 'You’re subscribed. Here’s this week’s Webfit News e-paper.',
    body: `<h1 style="margin:0 0 12px;font-size:26px;line-height:32px">You’re subscribed</h1>
<p style="margin:0 0 12px;font-size:17px;line-height:26px">${firstName ? `Kia ora ${esc(firstName)},` : 'Kia ora,'}</p>
<p style="margin:0 0 12px;font-size:17px;line-height:26px">Thanks for signing up. Here is this week’s Webfit News e-paper, ready to read now. From now on we’ll email you every Thursday morning when the new weekly edition is out.</p>
${button(absoluteUrl('/epaper'), 'Read this week’s e-paper')}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b6b6b">Didn’t sign up? Every e-paper email has a one-tap unsubscribe link at the bottom.</p>`,
    footer: senderFooter(),
  });
  try {
    await resend('/emails', { method: 'POST', body: { from: emailFrom(), to: [email], subject: 'Your Webfit News e-paper', html } });
  } catch (error) {
    // They are subscribed either way; the welcome email is a courtesy.
    console.error('[newsletter] welcome email failed', error);
  }
  return NextResponse.json({ ok: true });
}
