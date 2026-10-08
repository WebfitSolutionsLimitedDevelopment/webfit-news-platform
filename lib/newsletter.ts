import { createHmac, timingSafeEqual } from 'node:crypto';
import { SITE_NAME, absoluteUrl } from '@/lib/site';

/**
 * E-paper email alerts, sent with Resend.
 *
 *   Readers sign up at /subscribe (double opt-in: we email a confirm link).
 *   Confirmed readers go into the Resend segment SUBSCRIBER_SEGMENT with the
 *   topic ALERTS_TOPIC switched on.
 *   A daily Vercel cron (/api/cron/epaper-email) sends one broadcast per
 *   edition, once the live edition has enough stories to open on /epaper.
 *   The broadcast name "epaper-<edition key>" stops an edition going out twice.
 *
 * Env: RESEND_API_KEY (required), EPAPER_EMAIL_FROM (optional, defaults below),
 * CRON_SECRET (optional; when set the cron route requires it).
 */

export const SUBSCRIBER_SEGMENT = 'E-paper subscribers';
export const ALERTS_TOPIC = 'E-paper alerts';
const DEFAULT_FROM = `${SITE_NAME} <epaper@webfitnews.com>`;
const CONFIRM_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export function emailFrom() {
  return process.env.EPAPER_EMAIL_FROM?.trim() || DEFAULT_FROM;
}

function apiKey() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) throw new Error('RESEND_API_KEY is not set.');
  return key;
}

export class ResendError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function resend<T = any>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`https://api.resend.com${path}`, {
    method: init.method || 'GET',
    headers: { authorization: `Bearer ${apiKey()}`, 'content-type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) throw new ResendError(data?.message || `Resend ${response.status}`, response.status);
  return data as T;
}

async function findIdByName(path: '/segments' | '/topics', name: string) {
  const list = await resend<{ data: Array<{ id: string; name: string }> }>(`${path}?limit=100`);
  const found = list.data?.find(x => x.name.trim().toLowerCase() === name.toLowerCase());
  if (!found) throw new Error(`Resend ${path.slice(1, -1)} "${name}" not found.`);
  return found.id;
}

export const subscriberSegmentId = () => findIdByName('/segments', SUBSCRIBER_SEGMENT);
export const alertsTopicId = () => findIdByName('/topics', ALERTS_TOPIC);

/* ------------------------------------------------------------ double opt-in */

export function normaliseEmail(value: unknown): string | null {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return email;
}

function signingKey() {
  return createHmac('sha256', apiKey()).update('webfit-news-newsletter-confirm').digest();
}

const b64 = (s: string) => Buffer.from(s).toString('base64url');

export function confirmToken(email: string, firstName = '', now = Date.now()) {
  const payload = b64(JSON.stringify({ e: email, n: firstName.slice(0, 60), t: now }));
  const sig = createHmac('sha256', signingKey()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function readConfirmToken(token: string, now = Date.now()): { email: string; firstName: string } | null {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', signingKey()).update(payload).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { e, n, t } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const email = normaliseEmail(e);
    if (!email || typeof t !== 'number' || now - t > CONFIRM_MAX_AGE_MS || t > now + 60_000) return null;
    return { email, firstName: typeof n === 'string' ? n : '' };
  } catch { return null; }
}

/** Add (or re-add) a confirmed reader: contact, subscriber segment, alerts topic on. */
export async function addConfirmedSubscriber(email: string, firstName: string) {
  const [segmentId, topicId] = await Promise.all([subscriberSegmentId(), alertsTopicId()]);
  try {
    await resend('/contacts', { method: 'POST', body: { email, ...(firstName ? { first_name: firstName } : {}), unsubscribed: false } });
  } catch (error) {
    // Already a contact (e.g. from the directory list): they've just confirmed, so resubscribe them.
    if (!(error instanceof ResendError) || error.status >= 500) throw error;
    await resend(`/contacts/${encodeURIComponent(email)}`, { method: 'PATCH', body: { unsubscribed: false, ...(firstName ? { first_name: firstName } : {}) } });
  }
  await resend(`/contacts/${encodeURIComponent(email)}/segments/${segmentId}`, { method: 'POST' }).catch(error => {
    if (!(error instanceof ResendError) || error.status >= 500) throw error; // already in the segment
  });
  await resend(`/contacts/${encodeURIComponent(email)}/topics`, { method: 'PATCH', body: [{ id: topicId, subscription: 'opt_in' }] });
}

/* ------------------------------------------------------------ email markup */

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string) => s.replace(/[&<>"']/g, c => ENTITIES[c] || c);

export function emailShell(opts: { preheader: string; body: string; footer: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(SITE_NAME)}</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:Georgia,'Times New Roman',serif;color:#151515">
<div style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e2ddd2">
<tr><td align="center" style="padding:20px 24px 14px;border-bottom:3px double #151515">
<a href="${absoluteUrl('/')}"><img src="${absoluteUrl('/webfit-news-logo-email.png')}" width="181" height="77" alt="${esc(SITE_NAME)}" style="display:block;border:0;width:181px;height:auto"></a>
</td></tr>
<tr><td style="padding:24px">${opts.body}</td></tr>
<tr><td style="padding:16px 24px 24px;border-top:1px solid #e2ddd2;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#6b6b6b">${opts.footer}</td></tr>
</table></td></tr></table></body></html>`;
}

export const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td style="border-radius:999px;background:#151515"><a href="${href}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`;

/** Sender details (NZ Unsolicited Electronic Messages Act): who sent it and how to reach us. Override with EPAPER_SENDER_CONTACT. */
export function senderFooter() {
  const contact = process.env.EPAPER_SENDER_CONTACT?.trim() || '022 129 9323 · webfitnews.com';
  return `${esc(SITE_NAME)} · ${esc(contact)}`;
}
