import sharp from 'sharp';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { DAILY_LOGO_LIMIT, LOGO_KEEP_DAYS, placeLogo, type LogoCorner } from '@/lib/logo-placement';

export const LOGO_BUCKET = 'logo-studio';

/** The signed-in reader, or null. Any Google or email account works; no newsroom role needed. */
export async function logoStudioUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
}

/** Start of today in New Zealand, as a UTC instant. */
export function nzDayStart(now = new Date()) {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  // Find the UTC instant of NZ midnight by checking both possible offsets (+12 and +13).
  for (const off of ['+13:00', '+12:00']) {
    const t = new Date(`${ymd}T00:00:00${off}`);
    const back = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).format(t);
    if (back.endsWith('00')) return t;
  }
  return new Date(`${ymd}T00:00:00+12:00`);
}

export async function usedToday(userId: string) {
  const db = createAdminClient();
  const { count } = await db.from('logo_studio_jobs').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).gte('created_at', nzDayStart().toISOString());
  return count ?? 0;
}

export function remainingToday(used: number) {
  return Math.max(0, DAILY_LOGO_LIMIT - used);
}

/** Photo + logo in, finished JPEG out. Photo keeps its own size; EXIF rotation is applied. */
export async function stampLogo(photo: Buffer, logo: Buffer, corner: LogoCorner, sizePct: number) {
  const base = sharp(photo, { failOn: 'none' }).rotate();
  const meta = await base.metadata();
  const turned = (meta.orientation ?? 1) >= 5;
  const W = (turned ? meta.height : meta.width) ?? 0;
  const H = (turned ? meta.width : meta.height) ?? 0;
  if (!W || !H) throw new Error('The photo could not be read.');
  const lm = await sharp(logo).metadata();
  if (!lm.width || !lm.height) throw new Error('The logo could not be read.');
  const spot = placeLogo(W, H, lm.width, lm.height, corner, sizePct);
  const mark = await sharp(logo).resize(spot.width, spot.height, { fit: 'fill' }).png().toBuffer();
  const out = await base
    .flatten({ background: '#ffffff' })
    .composite([{ input: mark, left: spot.left, top: spot.top }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
  return { out, width: W, height: H };
}

/** Small preview stored next to each finished photo, for the history grid. */
export function thumbPath(outputPath: string) {
  return outputPath.replace(/\.jpg$/, '-thumb.jpg');
}

export async function makeThumb(jpeg: Buffer) {
  return sharp(jpeg).resize({ width: 480, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();
}

export function downloadName(original: string | null) {
  const base = (original || 'photo').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'photo';
  return `${base}-with-logo.jpg`;
}

/** The reader's saved photos (last 30 days), with one-hour download links. */
export async function listJobs(userId: string) {
  const db = createAdminClient();
  const since = new Date(Date.now() - LOGO_KEEP_DAYS * 86400000).toISOString();
  const { data } = await db.from('logo_studio_jobs').select('id,created_at,output_path,filename,width,height')
    .eq('user_id', userId).eq('status', 'ready').gte('created_at', since).order('created_at', { ascending: false }).limit(60);
  const rows = data ?? [];
  const bucket = db.storage.from(LOGO_BUCKET);
  return Promise.all(rows.map(async r => {
    const name = downloadName(r.filename);
    const [dl, view] = await Promise.all([
      bucket.createSignedUrl(r.output_path!, 3600, { download: name }),
      bucket.createSignedUrl(thumbPath(r.output_path!), 3600),
    ]);
    return {
      id: r.id, createdAt: r.created_at, filename: name, width: r.width, height: r.height,
      download: dl.data?.signedUrl ?? null,
      thumb: view.data?.signedUrl ?? dl.data?.signedUrl ?? null,
      expiresAt: new Date(new Date(r.created_at).getTime() + LOGO_KEEP_DAYS * 86400000).toISOString(),
    };
  }));
}

/** One-hour link to the reader's saved logo, if they have one. */
export async function savedLogoUrl(userId: string) {
  const db = createAdminClient();
  const { data } = await db.storage.from(LOGO_BUCKET).createSignedUrl(`logos/${userId}.png`, 3600);
  return data?.signedUrl ?? null;
}

/** Accounts the newsroom has blocked from the tool (CMS → Logo uploads). */
export async function isBlocked(userId: string) {
  const db = createAdminClient();
  const { data } = await db.from('logo_studio_blocked').select('user_id').eq('user_id', userId).maybeSingle();
  return !!data;
}

/** Deletes one finished photo and its preview. */
export async function deleteJob(id: string) {
  const db = createAdminClient();
  const { data } = await db.from('logo_studio_jobs').select('id,output_path').eq('id', id).maybeSingle();
  if (!data) return false;
  if (data.output_path) await db.storage.from(LOGO_BUCKET).remove([data.output_path, thumbPath(data.output_path)]);
  await db.from('logo_studio_jobs').delete().eq('id', id);
  return true;
}

/** Deletes everything an account has made, and its saved logo. */
export async function deleteAllForUser(userId: string) {
  const db = createAdminClient();
  const { data } = await db.from('logo_studio_jobs').select('id,output_path').eq('user_id', userId);
  const paths = (data ?? []).flatMap(r => r.output_path ? [r.output_path, thumbPath(r.output_path)] : []);
  paths.push(`logos/${userId}.png`);
  for (let i = 0; i < paths.length; i += 100) await db.storage.from(LOGO_BUCKET).remove(paths.slice(i, i + 100));
  await db.from('logo_studio_jobs').delete().eq('user_id', userId);
  return data?.length ?? 0;
}

export type AdminLogoJob = {
  id: string; userId: string; email: string | null; createdAt: string; filename: string;
  width: number | null; height: number | null; bytes: number | null;
  thumb: string | null; full: string | null; logo: string | null; blocked: boolean;
};

/** Every photo made with the tool, newest first, for the newsroom. Optional filter by email. */
export async function adminListJobs({ page = 1, perPage = 48, email = '' }: { page?: number; perPage?: number; email?: string }) {
  const db = createAdminClient();
  let userIds: string[] | null = null;
  if (email.trim()) {
    const { data: people } = await db.from('profiles').select('id').ilike('email', `%${email.trim().replaceAll(',', ' ')}%`).limit(50);
    userIds = (people ?? []).map(p => p.id);
    if (!userIds.length) return { items: [] as AdminLogoJob[], total: 0, today: 0, accounts: 0 };
  }
  let q = db.from('logo_studio_jobs').select('id,user_id,created_at,output_path,filename,width,height,bytes', { count: 'exact' })
    .eq('status', 'ready').order('created_at', { ascending: false }).range((page - 1) * perPage, page * perPage - 1);
  if (userIds) q = q.in('user_id', userIds);
  const [{ data, count }, { count: today }, { data: everyone }] = await Promise.all([
    q,
    db.from('logo_studio_jobs').select('id', { count: 'exact', head: true }).eq('status', 'ready').gte('created_at', nzDayStart().toISOString()),
    db.from('logo_studio_jobs').select('user_id').eq('status', 'ready').limit(5000),
  ]);
  const rows = data ?? [];
  const ids = [...new Set(rows.map(r => r.user_id))];
  const [{ data: profiles }, { data: blocked }] = await Promise.all([
    ids.length ? db.from('profiles').select('id,email').in('id', ids) : Promise.resolve({ data: [] as { id: string; email: string | null }[] }),
    ids.length ? db.from('logo_studio_blocked').select('user_id').in('user_id', ids) : Promise.resolve({ data: [] as { user_id: string }[] }),
  ]);
  const emailOf = new Map((profiles ?? []).map(p => [p.id, p.email]));
  const blockedSet = new Set((blocked ?? []).map(b => b.user_id));
  const bucket = db.storage.from(LOGO_BUCKET);
  const logoLinks = new Map<string, string | null>();
  await Promise.all(ids.map(async id => {
    const { data: l } = await bucket.createSignedUrl(`logos/${id}.png`, 3600);
    logoLinks.set(id, l?.signedUrl ?? null);
  }));
  const items: AdminLogoJob[] = await Promise.all(rows.map(async r => {
    const [t, f] = await Promise.all([
      bucket.createSignedUrl(thumbPath(r.output_path!), 3600),
      bucket.createSignedUrl(r.output_path!, 3600),
    ]);
    return {
      id: r.id, userId: r.user_id, email: emailOf.get(r.user_id) ?? null, createdAt: r.created_at,
      filename: r.filename || 'photo', width: r.width, height: r.height, bytes: r.bytes,
      thumb: t.data?.signedUrl ?? null, full: f.data?.signedUrl ?? null, logo: logoLinks.get(r.user_id) ?? null,
      blocked: blockedSet.has(r.user_id),
    };
  }));
  return { items, total: count ?? 0, today: today ?? 0, accounts: new Set((everyone ?? []).map(e => e.user_id)).size };
}
