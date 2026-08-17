import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../lib/supabase-server';
import { convertMediaRelease } from '../../../../lib/media-release-converter';

const Input = z.object({
  raw_text: z.string().trim().min(40, 'Paste the full media release.').max(120000, 'Media release is too large.'),
  categories: z.array(z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(120) })).max(250).default([]),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('is_active').eq('id', user.id).maybeSingle();
  if (!profile?.is_active) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = Input.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  return NextResponse.json({ draft: convertMediaRelease(parsed.data.raw_text, parsed.data.categories) });
}
