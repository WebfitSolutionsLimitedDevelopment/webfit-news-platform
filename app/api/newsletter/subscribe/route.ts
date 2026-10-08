import { NextResponse } from 'next/server';
import { absoluteUrl } from '@/lib/site';
import { button, confirmToken, emailFrom, emailShell, esc, normaliseEmail, resend, senderFooter } from '@/lib/newsletter';

export const runtime = 'nodejs';

/** Step 1 of double opt-in: email a confirm link. Nobody is added until they click it. */
export async function POST(request: Request) {
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  // Honeypot: real people never fill the hidden "website" field.
  if (body?.website) return NextResponse.json({ ok: true });
  const email = normaliseEmail(body?.email);
  if (!email) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  const firstName = String(body?.firstName || '').trim().replace(/[<>]/g, '').slice(0, 60);

  const link = `${absoluteUrl('/api/newsletter/confirm')}?t=${confirmToken(email, firstName)}`;
  const html = emailShell({
    preheader: 'Confirm your free Webfit News e-paper emails.',
    body: `<h1 style="margin:0 0 12px;font-size:26px;line-height:32px">Confirm your e-paper emails</h1>
<p style="margin:0 0 12px;font-size:17px;line-height:26px">${firstName ? `Kia ora ${esc(firstName)},` : 'Kia ora,'}</p>
<p style="margin:0 0 12px;font-size:17px;line-height:26px">Tap the button to get the free Webfit News e-paper by email, twice a week, when each Midweek and Weekend edition comes out.</p>
${button(link, 'Yes, send me the e-paper')}
<p style="margin:0;font-size:14px;line-height:22px;color:#6b6b6b">If you didn’t ask for this, ignore this email and you won’t hear from us. The link works for 3 days.</p>`,
    footer: senderFooter(),
  });

  try {
    await resend('/emails', { method: 'POST', body: { from: emailFrom(), to: [email], subject: 'Confirm your Webfit News e-paper emails', html } });
  } catch (error) {
    console.error('[newsletter] confirm email failed', error);
    return NextResponse.json({ error: 'We couldn’t send the confirmation email. Please try again shortly.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
