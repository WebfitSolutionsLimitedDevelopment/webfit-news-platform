/**
 * Read an image's pixel size from the first bytes of the file (JPEG, PNG,
 * WebP, GIF, AVIF). No dependencies, works on the server and in the browser.
 * Knowing the size lets story pages reserve space for images (no layout
 * jump) and tells Google the image is large enough for Discover.
 */
export type ImageSize = { width: number; height: number };

export function readImageSize(buffer: ArrayBuffer | Uint8Array): ImageSize | null {
  const b = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const ok = (w: number, h: number) => (w > 0 && h > 0 && w < 30000 && h < 30000 ? { width: w, height: h } : null);
  const ascii = (at: number, len: number) => String.fromCharCode(...b.subarray(at, at + len));
  try {
    // PNG
    if (b.length >= 24 && b[0] === 0x89 && ascii(1, 3) === 'PNG') return ok(dv.getUint32(16), dv.getUint32(20));
    // GIF
    if (b.length >= 10 && ascii(0, 3) === 'GIF') return ok(dv.getUint16(6, true), dv.getUint16(8, true));
    // WebP
    if (b.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
      const chunk = ascii(12, 4);
      if (chunk === 'VP8 ') return ok(dv.getUint16(26, true) & 0x3fff, dv.getUint16(28, true) & 0x3fff);
      if (chunk === 'VP8L') {
        const bits = dv.getUint32(21, true);
        return ok((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1);
      }
      if (chunk === 'VP8X') {
        const w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
        const h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
        return ok(w, h);
      }
      return null;
    }
    // JPEG: walk the segments to the frame header
    if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i += 1; continue; }
        const marker = b[i + 1];
        if (marker === 0xff) { i += 1; continue; }
        if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
        const len = dv.getUint16(i + 2);
        const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isFrame) return ok(dv.getUint16(i + 7), dv.getUint16(i + 5));
        i += 2 + len;
      }
      return null;
    }
    // AVIF / HEIF: find the 'ispe' box
    if (b.length >= 12 && ascii(4, 4) === 'ftyp') {
      for (let i = 8; i + 16 < Math.min(b.length, 4096); i++) {
        if (b[i] === 0x69 && ascii(i, 4) === 'ispe') return ok(dv.getUint32(i + 8), dv.getUint32(i + 12));
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Browser helper: read just the start of a File (the size is always near the top). */
export async function readFileImageSize(file: Blob): Promise<ImageSize | null> {
  if (!file.type.startsWith('image/')) return null;
  const head = await file.slice(0, 256 * 1024).arrayBuffer();
  return readImageSize(head);
}
