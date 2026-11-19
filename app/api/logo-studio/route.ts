import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { createAdminClient } from '@/lib/supabase-admin';
import { DAILY_LOGO_LIMIT, isCorner, LOGO_SIZE_DEFAULT } from '@/lib/logo-placement';
import { LOGO_BUCKET, downloadName, isBlocked, listJobs, logoStudioUser, makeThumb, nzDayStart, remainingToday, savedLogoUrl, stampLogo, thumbPath, usedToday } from '@/lib/logo-studio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PHOTO = 4 * 1024 * 1024; // the page shrinks photos to 3000 px first; Vercel caps requests at 4.5 MB
const MAX_LOGO = 1024 * 1024;

function nextReset() {
  return new Date(nzDayStart().getTime() + 86400000 + 3600000).toISOString(); // a day later, plus slack for DST days
}

/** The reader's photos, today's remaining count and their saved logo. */
export async function GET() {
  const user = await logoStudioUser();
  if (!user) return NextResponse.json({ error: 'Sign in to use Add Your Logo.' }, { status: 401 });
  const [items, used, logo] = await Promise.all([listJobs(user.id), usedToday(user.id), savedLogoUrl(user.id)]);
  return NextResponse.json({ items, remaining: remainingToday(used), limit: DAILY_LOGO_LIMIT, logo }, { headers: { 'Cache-Control': 'private, no-store' } });
}

/**
 * One photo per request: photo (+ logo, unless the saved logo should be used), position, size.
 * Takes one of today's 5 slots before doing any work and gives it back if anything fails.
 */
export async function POST(req: Request) {
  const user = await logoStudioUser();
  if (!user) return NextResponse.json({ error: 'Sign in to use Add Your Logo.' }, { status: 401 });

  if (await isBlocked(user.id)) return NextResponse.json({ error: 'This account can no longer use Add Your Logo.' }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'The upload could not be read. Try again.' }, { status: 400 });
  const photo = form.get('photo');
  const logoFile = form.get('logo');
  const corner = String(form.get('position') || 'br');
  const size = Number(form.get('size') || LOGO_SIZE_DEFAULT);
  if (form.get('rights') !== 'yes') return NextResponse.json({ error: 'Confirm these are your photos, or that you have permission to use them.' }, { status: 422 });
  if (!(photo instanceof File) || !PHOTO_TYPES.has(photo.type)) return NextResponse.json({ error: 'Choose a JPEG, PNG or WebP photo.' }, { status: 422 });
  if (photo.size > MAX_PHOTO) return NextResponse.json({ error: 'That photo is too large. Try a smaller one.' }, { status: 413 });
  if (!isCorner(corner)) return NextResponse.json({ error: 'Choose where the logo goes.' }, { status: 422 });

  const db = createAdminClient();
  const bucket = db.storage.from(LOGO_BUCKET);

  // Logo: a new upload replaces the saved one; otherwise use the saved one.
  let logo: Buffer | null = null;
  if (logoFile instanceof File && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO || !/^image\/(png|jpeg|webp)$/.test(logoFile.type)) return NextResponse.json({ error: 'The logo must be a PNG, JPEG or WebP under 1 MB.' }, { status: 422 });
    try { logo = await sharp(Buffer.from(await logoFile.arrayBuffer())).png().toBuffer(); }
    catch { return NextResponse.json({ error: 'The logo could not be read. Try a PNG.' }, { status: 422 }); }
    await bucket.upload(`logos/${user.id}.png`, logo, { contentType: 'image/png', upsert: true });
  } else {
    const saved = await bucket.download(`logos/${user.id}.png`);
    if (saved.data) logo = Buffer.from(await saved.data.arrayBuffer());
  }
  if (!logo) return NextResponse.json({ error: 'Add your logo first.' }, { status: 422 });

  const { data: jobId, error: claimError } = await db.rpc('claim_logo_slot', { p_user: user.id, p_limit: DAILY_LOGO_LIMIT });
  if (claimError) return NextResponse.json({ error: 'Something went wrong. Try again in a minute.' }, { status: 500 });
  if (!jobId) {
    return NextResponse.json({ error: `You have used today's ${DAILY_LOGO_LIMIT} photos. You can add more after midnight, New Zealand time.`, remaining: 0, resetsAt: nextReset() }, { status: 429 });
  }

  const outPath = `out/${user.id}/${jobId}.jpg`;
  try {
    const { out, width, height } = await stampLogo(Buffer.from(await photo.arrayBuffer()), logo, corner, size);
    const thumb = await makeThumb(out);
    const up = await bucket.upload(outPath, out, { contentType: 'image/jpeg', upsert: false });
    if (up.error) throw up.error;
    await bucket.upload(thumbPath(outPath), thumb, { contentType: 'image/jpeg', upsert: true });
    await db.from('logo_studio_jobs').update({ status: 'ready', output_path: outPath, filename: photo.name.slice(0, 200), width, height, bytes: out.length }).eq('id', jobId);
    const name = downloadName(photo.name);
    const { data: link } = await bucket.createSignedUrl(outPath, 3600, { download: name });
    const used = await usedToday(user.id);
    return NextResponse.json({ id: jobId, filename: name, download: link?.signedUrl ?? null, remaining: remainingToday(used) });
  } catch (e) {
    console.error('add-your-logo failed', e);
    await db.from('logo_studio_jobs').delete().eq('id', jobId); // give the slot back
    await bucket.remove([outPath, thumbPath(outPath)]).catch(() => {});
    return NextResponse.json({ error: 'That photo could not be processed. It has not been counted. Try another.' }, { status: 422 });
  }
}
