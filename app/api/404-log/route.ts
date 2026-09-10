import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';

function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const path = typeof payload?.path === 'string' ? payload.path : '';
  const queryString = typeof payload?.queryString === 'string' ? payload.queryString : '';
  const referrer = typeof payload?.referrer === 'string' ? payload.referrer : '';

  if (!path.startsWith('/') || path.length > 2048) {
    return new NextResponse(null, { status: 422 });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('log_not_found_event', {
    p_path: path,
    p_query_string: queryString,
    p_host: req.headers.get('host') || '',
    p_referrer: referrer,
    p_user_agent: req.headers.get('user-agent') || '',
  });

  if (error) {
    console.error('404 monitor write failed', error.message);
    return new NextResponse(null, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
