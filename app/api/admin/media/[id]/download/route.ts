import { NextResponse } from 'next/server';
import { createClient } from '../../../../../../lib/supabase-server';

/**
 * Download a Media library image as a file. Gives the full HD copy with the
 * Webfit News logo when one was made at upload (Media library uploads from
 * 20 Nov 2026), otherwise the stored web copy. Newsroom accounts only;
 * volunteers can download only their own uploads.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (!profile?.is_active) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: media } = await supabase.from('media')
    .select('id,storage_bucket,storage_path,public_url,filename,mime_type,uploaded_by')
    .eq('id', id).maybeSingle();
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (profile.role === 'volunteer' && media.uploaded_by !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const base = (media.filename || 'image').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'image';
  // Redirect to the storage copy with a download filename, so large files never pass through
  // this function (Vercel caps function responses at 4.5 MB).
  if (media.storage_path) {
    const bucket = supabase.storage.from(media.storage_bucket || 'news-media');
    const hd = bucket.getPublicUrl(`distribution/${media.storage_path}`, { download: `webfit-news-${base}-full-hd.jpg` }).data.publicUrl;
    const head = await fetch(hd, { method: 'HEAD', cache: 'no-store' }).catch(() => null);
    if (head?.ok) return NextResponse.redirect(hd, 302);
    const ext = (media.filename || '').match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || '';
    return NextResponse.redirect(bucket.getPublicUrl(media.storage_path, { download: `webfit-news-${base}${ext}` }).data.publicUrl, 302);
  }
  if (media.public_url) return NextResponse.redirect(media.public_url, 302);
  return NextResponse.json({ error: 'File not available' }, { status: 404 });
}
