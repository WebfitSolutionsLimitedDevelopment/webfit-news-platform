import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { LOGO_KEEP_DAYS } from '@/lib/logo-placement';
import { LOGO_BUCKET, thumbPath } from '@/lib/logo-studio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Daily (vercel.json). Deletes Add Your Logo photos older than 30 days, and
 * slots left "pending" for over an hour by a request that died mid-way.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
  }
  const db = createAdminClient();
  const bucket = db.storage.from(LOGO_BUCKET);
  const old = new Date(Date.now() - LOGO_KEEP_DAYS * 86400000).toISOString();
  const stale = new Date(Date.now() - 3600000).toISOString();
  let removed = 0;
  for (let round = 0; round < 10; round++) {
    const { data } = await db.from('logo_studio_jobs').select('id,output_path')
      .or(`created_at.lt.${old},and(status.eq.pending,created_at.lt.${stale})`).limit(200);
    if (!data?.length) break;
    const paths = data.flatMap(r => r.output_path ? [r.output_path, thumbPath(r.output_path)] : []);
    if (paths.length) await bucket.remove(paths);
    await db.from('logo_studio_jobs').delete().in('id', data.map(r => r.id));
    removed += data.length;
  }
  return NextResponse.json({ removed });
}
