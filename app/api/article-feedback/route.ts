import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { createClient } from '../../../lib/supabase-server';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(req.url).host; } catch { return false; }
}

/** One-way hash of the reader's network address, used only for the spam brake. Never stored in plain form. */
function networkHash(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || '';
  if (!ip) return null;
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_URL || 'webfit';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/** Private "Was this article useful?" answers. Results are visible only in the newsroom admin. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (body?.website) return NextResponse.json({ ok: true }); // honeypot: bots fill hidden fields

  const articleId = String(body?.articleId || '');
  const visitorId = String(body?.visitorId || '');
  const helpful = body?.helpful;
  const comment = typeof body?.comment === 'string' ? body.comment.replace(/[<>]/g, '').slice(0, 1000) : null;
  if (!UUID.test(articleId) || typeof helpful !== 'boolean' || visitorId.length < 8 || visitorId.length > 64) {
    return NextResponse.json({ ok: false }, { status: 422 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('submit_article_feedback', {
    p_article_id: articleId,
    p_visitor_id: visitorId,
    p_helpful: helpful,
    p_comment: comment,
    p_ip_hash: networkHash(req),
  });
  if (error) {
    console.error('[article-feedback] write failed', error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: data === true });
}
