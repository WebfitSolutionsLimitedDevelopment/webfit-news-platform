import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Stamp the round Webfit News badge into the bottom-right corner of a newsroom
 * image. The badge is about 14% of the image width (64 to 200 px), sits 2.5%
 * in from the edges and is drawn at 85% opacity so it reads without hiding
 * the photo. The image keeps its format and size.
 *
 * Skipped (returned as null) for GIFs, SVGs and images narrower than 400 px,
 * where a badge would cover too much or break animation.
 */
const BADGE = path.join(process.cwd(), 'public', 'brand-watermark.png');
const STAMPABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
let badgeCache: Buffer | null = null;

export function canWatermark(mime: string) {
  return STAMPABLE.has(mime);
}

export async function watermarkImage(input: ArrayBuffer, mime: string): Promise<Buffer | null> {
  if (!canWatermark(mime)) return null;
  const image = sharp(Buffer.from(input), { failOn: 'none' }).rotate();
  const meta = await image.metadata();
  // .rotate() applies EXIF orientation, so swap the sides for rotated photos.
  const turned = (meta.orientation ?? 1) >= 5;
  const width = (turned ? meta.height : meta.width) ?? 0;
  const height = (turned ? meta.width : meta.height) ?? 0;
  if (width < 400 || height < 200) return null;

  badgeCache ??= await readFile(BADGE);
  const size = Math.round(Math.min(200, height * 0.4, Math.max(64, width * 0.14)));
  const margin = Math.round(Math.max(8, width * 0.025));
  const badge = await sharp(badgeCache)
    .resize(size, size)
    .composite([{ input: Buffer.from([255, 255, 255, Math.round(255 * 0.85)]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const stamped = image.composite([{ input: badge, left: width - size - margin, top: height - size - margin }]);
  if (mime === 'image/png') return stamped.png({ compressionLevel: 9 }).toBuffer();
  if (mime === 'image/webp') return stamped.webp({ quality: 82 }).toBuffer();
  if (mime === 'image/avif') return stamped.avif({ quality: 60 }).toBuffer();
  return stamped.jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}
