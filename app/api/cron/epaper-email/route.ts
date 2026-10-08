import { NextResponse } from 'next/server';
import { featuredEdition, getEdition, getEditionShelf, type Edition } from '@/lib/epaper';
import { resizedImage } from '@/lib/image-url';
import { SITE_NAME, absoluteUrl, articleUrl } from '@/lib/site';
import { alertsTopicId, button, emailFrom, emailShell, esc, resend, senderFooter, subscriberSegmentId } from '@/lib/newsletter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Daily (vercel.json). Emails the live e-paper edition once it has enough
 * stories to open on /epaper, once per edition.
 *
 *   ?preview=1   show the email in the browser, send nothing
 *   ?dry=1       report what would happen, send nothing
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const url = new URL(request.url);
  const preview = url.searchParams.has('preview');
  const dry = url.searchParams.has('dry');
  if (secret && !preview && !dry && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
  }

  const shelf = await getEditionShelf();
  const main = featuredEdition(shelf);
  if (!main) return NextResponse.json({ sent: false, reason: 'No edition.' });
  const edition = await getEdition(main.key);
  if (!edition) return NextResponse.json({ sent: false, reason: 'Edition not found.' });

  const subject = `${edition.title}, ${edition.coverage}: ${headline(edition)}`.slice(0, 140);
  const html = renderEditionEmail(edition);
  if (preview) return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });

  if (!main.isLive) return NextResponse.json({ sent: false, reason: `Current edition isn't ready yet (fewer stories than needed); ${main.title} ${main.coverage} is showing.` });

  const name = `epaper-${edition.key}`;
  const existing = await resend<{ data: Array<{ name: string | null; status: string }> }>('/broadcasts');
  if (existing.data?.some(b => b.name === name)) return NextResponse.json({ sent: false, reason: `${name} already sent.` });
  if (dry) return NextResponse.json({ sent: false, dry: true, wouldSend: name, subject });

  const [segmentId, topicId] = await Promise.all([subscriberSegmentId(), alertsTopicId()]);
  const result = await resend<{ id: string }>('/broadcasts', {
    method: 'POST',
    body: { name, segment_id: segmentId, topic_id: topicId, from: emailFrom(), subject, html, send: true },
  });
  return NextResponse.json({ sent: true, name, id: result.id, subject });
}

function headline(edition: Edition) {
  return edition.sections[0]?.stories[0]?.title || `${edition.storyCount} stories`;
}

function renderEditionEmail(edition: Edition) {
  const lead = edition.sections[0]?.stories[0];
  const desks = edition.sections.slice(1).filter(s => s.stories.length);
  const read = absoluteUrl(edition.href);
  const cover = edition.coverImage ? resizedImage(edition.coverImage, 1104, 70) : null;
  const leadText = lead?.blocks.find(b => b.k === 'p')?.t || '';

  const body = `
<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#c8232c;font-weight:bold">${esc(edition.title)} · No. ${edition.number}</p>
<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b6b6b">${esc(edition.coverage)} · ${edition.storyCount} stories</p>
${cover ? `<a href="${read}"><img src="${cover}" width="552" alt="" style="display:block;width:100%;max-width:552px;height:auto;border:0;margin:0 0 16px"></a>` : ''}
${lead ? `<h1 style="margin:0 0 10px;font-size:28px;line-height:34px"><a href="${read}" style="color:#151515;text-decoration:none">${esc(lead.title)}</a></h1>
<p style="margin:0 0 4px;font-size:17px;line-height:26px">${esc(leadText.split(' ').slice(0, 45).join(' '))}${leadText.split(' ').length > 45 ? '…' : ''}</p>` : ''}
${button(read, 'Read the e-paper')}
${desks.map(d => `<p style="margin:20px 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#c8232c;font-weight:bold;border-top:1px solid #e2ddd2;padding-top:14px">${esc(d.title)}</p>
${d.stories.slice(0, 3).map(s => `<p style="margin:0 0 8px;font-size:17px;line-height:24px"><a href="${articleUrl(s.slug)}" style="color:#151515">${esc(s.title)}</a></p>`).join('')}`).join('')}
<p style="margin:24px 0 0;font-size:15px;line-height:22px">Flip through every page at <a href="${read}" style="color:#c8232c">webfitnews.com/epaper</a>.</p>`;

  return emailShell({
    preheader: lead ? lead.title : `${edition.title}, ${edition.coverage}`,
    body,
    footer: `You get this because you asked for the ${esc(SITE_NAME)} e-paper by email. <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#6b6b6b">Unsubscribe or change your emails</a>.<br>${senderFooter()}`,
  });
}
