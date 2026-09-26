'use client';

import { createClient } from '@/lib/supabase-browser';

type Any = Record<string, any>;

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 65;

/** Where each position appears, in plain words, for the placement picker. */
export const SLOT_GUIDE: Record<string, { where: string; desktop: string; mobile: string; video?: boolean }> = {
  HEADER_LEADERBOARD: { where: 'Top of homepage and every story', desktop: '970×90 or 970×250', mobile: 'Not shown' },
  HOME_AFTER_HERO: { where: 'Homepage, after the lead stories', desktop: '970×250', mobile: '300×250' },
  HOME_MIDDLE: { where: 'Homepage, mid-page', desktop: '970×250', mobile: '300×250', video: true },
  HOME_SIDEBAR_1: { where: 'Homepage, further down the feed', desktop: 'Not shown', mobile: '300×250' },
  ARTICLE_INLINE_1: { where: 'Every story, after paragraph 3', desktop: '728×90', mobile: '300×250', video: true },
  ARTICLE_INLINE_2: { where: 'Longer stories, after paragraph 8', desktop: '728×90', mobile: '300×250' },
  ARTICLE_BOTTOM: { where: 'End of every story', desktop: '728×90', mobile: '300×250' },
  ARTICLE_RAIL: { where: 'Right-hand column of every story, follows the reader', desktop: '300×600 or 300×250', mobile: 'Not shown', video: true },
  MOBILE_STICKY: { where: 'Bar pinned to the bottom of stories', desktop: 'Not shown', mobile: '320×50' },
  CATEGORY_TOP: { where: 'Top of section pages', desktop: '970×250', mobile: '300×250' },
};

export function fmtDate(v?: string | null) {
  return v ? new Date(v).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Open';
}

export function placementState(a: Any, campaign?: Any) {
  const now = Date.now();
  if (campaign && campaign.status !== 'active') return { label: `Campaign ${campaign.status}`, cls: 'status-draft' };
  if (!a.is_active) return a.ends_at && new Date(a.ends_at).getTime() <= now ? { label: 'Ended', cls: 'status-ended' } : { label: 'Paused', cls: 'status-draft' };
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return { label: 'Scheduled', cls: 'status-scheduled' };
  if (a.ends_at && new Date(a.ends_at).getTime() < now) return { label: 'Ended', cls: 'status-ended' };
  return { label: 'Live', cls: 'status-active' };
}

export function readImageSize(file: File): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

export function readVideoInfo(file: File): Promise<{ seconds: number; w: number; h: number }> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { resolve({ seconds: v.duration, w: v.videoWidth, h: v.videoHeight }); URL.revokeObjectURL(url); };
    v.onerror = () => { resolve({ seconds: 0, w: 0, h: 0 }); URL.revokeObjectURL(url); };
    v.src = url;
  });
}

export async function checkFile(file: File | null, kind: 'image' | 'video'): Promise<string> {
  if (!file) return '';
  if (kind === 'image') {
    if (!IMAGE_TYPES.includes(file.type)) return 'Use a JPG, PNG, WebP or GIF image.';
    if (file.size > IMAGE_MAX_BYTES) return `This image is ${(file.size / 1048576).toFixed(1)} MB. Keep ad images under 1.5 MB.`;
    return '';
  }
  if (file.type !== 'video/mp4') return 'Use an MP4 video (H.264). Export from your editor as MP4.';
  if (file.size > VIDEO_MAX_BYTES) return `This video is ${(file.size / 1048576).toFixed(0)} MB. Keep it under 50 MB (720p is plenty).`;
  const info = await readVideoInfo(file);
  if (info.seconds > VIDEO_MAX_SECONDS) return `This video runs ${Math.round(info.seconds)} seconds. Keep ads to 60 seconds or less.`;
  return '';
}

export async function uploadToMedia(file: File, altText: string): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Your session has expired. Sign in again.');
  const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const d = new Date();
  const path = `ads/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}-${safe}`;
  const { error: uploadError } = await supabase.storage.from('news-media').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
  const { data: pub } = supabase.storage.from('news-media').getPublicUrl(path);
  const { data, error } = await supabase.from('media').insert({
    uploaded_by: user.id, storage_bucket: 'news-media', storage_path: path, public_url: pub.publicUrl,
    filename: file.name, mime_type: file.type, file_size: file.size, alt_text: altText, caption: '', credit: '', migration_status: 'native',
  }).select('id').single();
  if (error) throw new Error(`Saved ${file.name} but could not record it in Media: ${error.message}`);
  return data.id as string;
}


export type Placement = { key: string; device: 'all' | 'desktop' | 'mobile' };

/**
 * Where an ad should go, based on its shape. Tall posters suit the sticky
 * desktop column and the phone story break; wide banners suit the top of the
 * page on desktop; everything else works inside stories on every screen.
 */
export function recommendPlacements(kind: 'image' | 'video', w: number, h: number): Placement[] {
  if (kind === 'video') return [{ key: 'ARTICLE_INLINE_1', device: 'all' }, { key: 'HOME_MIDDLE', device: 'all' }];
  const ratio = w && h ? w / h : 1;
  if (ratio >= 2.5) return [{ key: 'HEADER_LEADERBOARD', device: 'desktop' }, { key: 'HOME_AFTER_HERO', device: 'desktop' }, { key: 'ARTICLE_BOTTOM', device: 'desktop' }];
  if (ratio <= 1.1) return [{ key: 'ARTICLE_RAIL', device: 'desktop' }, { key: 'ARTICLE_INLINE_1', device: 'mobile' }];
  return [{ key: 'ARTICLE_INLINE_1', device: 'all' }, { key: 'HOME_MIDDLE', device: 'all' }];
}

/** Largest ad image we keep: 1.5 megapixels (about 1100 x 1370 for a 4:5 poster) and 1.5 MB. */
export const AD_IMAGE_MAX_PIXELS = 1_500_000;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
}

/**
 * Resize any uploaded image to at most 1.5 megapixels and re-encode it under
 * 1.5 MB, so a 5 MB phone photo or a huge PNG poster uploads fine and pages
 * stay fast. Animated GIFs are left as they are.
 */
export async function prepareAdImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file;
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); } catch { return file; }
  const pixels = bitmap.width * bitmap.height;
  const scale = pixels > AD_IMAGE_MAX_PIXELS ? Math.sqrt(AD_IMAGE_MAX_PIXELS / pixels) : 1;
  if (scale === 1 && file.size <= 400 * 1024) { bitmap.close?.(); return file; }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap.close?.(); return file; }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  const base = file.name.replace(/\.[^.]+$/, '') || 'ad';
  for (const type of ['image/webp', 'image/jpeg']) {
    for (const quality of [0.86, 0.78, 0.7, 0.6]) {
      const blob = await canvasToBlob(canvas, type, quality);
      if (blob && blob.type === type && blob.size <= IMAGE_MAX_BYTES) {
        return new File([blob], `${base}.${type === 'image/webp' ? 'webp' : 'jpg'}`, { type, lastModified: Date.now() });
      }
    }
  }
  return file;
}
