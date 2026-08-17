import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../../lib/supabase-server';
import { convertMediaRelease, type ConverterCategory } from '../../../../lib/media-release-converter';
import { extractUploadedSource, extractUrlSource } from '../../../../lib/source-ingestion';

export const runtime = 'nodejs';
export const maxDuration = 30;

const Category = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(120) });
const Categories = z.array(Category).max(250).default([]);
const JsonInput = z.object({
  raw_text: z.string().trim().max(120000, 'Media release is too large.').optional().default(''),
  source_url: z.string().trim().max(2048).optional().default(''),
  categories: Categories,
}).refine(value => value.raw_text.length >= 40 || value.source_url.length > 0, 'Paste source text or enter a source URL.');

function parseCategories(raw: FormDataEntryValue | null): ConverterCategory[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = Categories.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new Error('Invalid categories payload.');
    return parsed.data;
  } catch {
    throw new Error('Invalid categories payload.');
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('is_active').eq('id', user.id).maybeSingle();
  if (!profile?.is_active) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a source file first.' }, { status: 422 });
      const categories = parseCategories(form.get('categories'));
      const imported = await extractUploadedSource(file);
      return NextResponse.json({
        draft: convertMediaRelease(imported.text, categories),
        source: { kind: imported.kind, label: imported.label, filename: imported.filename, content_type: imported.contentType, url: imported.url, extracted_text: imported.text },
      });
    }

    const parsed = JsonInput.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    if (parsed.data.source_url) {
      const imported = await extractUrlSource(parsed.data.source_url);
      return NextResponse.json({
        draft: convertMediaRelease(imported.text, parsed.data.categories),
        source: { kind: imported.kind, label: imported.label, filename: imported.filename, content_type: imported.contentType, url: imported.url, extracted_text: imported.text },
      });
    }

    return NextResponse.json({
      draft: convertMediaRelease(parsed.data.raw_text, parsed.data.categories),
      source: { kind: 'paste', label: 'Pasted source', filename: null, content_type: 'text/plain', url: null, extracted_text: parsed.data.raw_text },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read the supplied source.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
