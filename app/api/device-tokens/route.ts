import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../lib/supabase-server';

const Body = z.object({ token: z.string().trim().min(10) });

// Called by the iOS app right after it registers with Apple for push
// notifications. No login required, this just stores the phone's push token
// so the server can notify it when a new article is published.
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid token' }, { status: 422 });

  const supabase = await createClient();
  const { error } = await supabase
    .from('device_tokens')
    .upsert({ device_token: parsed.data.token, platform: 'ios', updated_at: new Date().toISOString() }, { onConflict: 'device_token' });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
