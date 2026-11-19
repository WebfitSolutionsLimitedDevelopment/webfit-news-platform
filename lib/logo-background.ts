/**
 * Takes the plain background off a logo (a white or single-colour box around
 * it, as in most JPEG logos), so only the logo itself goes on the photo.
 *
 * It removes background joined to the edge of the image, plus the holes in
 * letters (o, a, B), while larger white shapes inside the design, such as
 * white lettering in a coloured badge, stay. Soft edges are kept smooth by fading
 * the colour along the border instead of cutting it. Logos that already have a
 * transparent background, or whose edges are not one plain colour (a photo, a
 * gradient), are left as they are.
 */
export type KnockoutResult = 'removed' | 'already-transparent' | 'no-plain-background';

const CLEAR = 42;   // colour distance treated as background
const FRINGE = 110; // up to this distance, edge pixels fade instead of cutting

export function knockOutBackground(data: Uint8ClampedArray, w: number, h: number): KnockoutResult {
  const n = w * h;
  let seeThrough = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 200) seeThrough++;
  if (seeThrough > n * 0.02) return 'already-transparent';

  // The background colour is the most common colour around the edge.
  const border: number[] = [];
  for (let x = 0; x < w; x++) { border.push(x, (h - 1) * w + x); }
  for (let y = 1; y < h - 1; y++) { border.push(y * w, y * w + w - 1); }
  const buckets = new Map<number, number[]>();
  for (const p of border) {
    const o = p * 4;
    const key = (data[o] >> 4) << 8 | (data[o + 1] >> 4) << 4 | (data[o + 2] >> 4);
    const b = buckets.get(key) ?? [0, 0, 0, 0];
    b[0] += data[o]; b[1] += data[o + 1]; b[2] += data[o + 2]; b[3]++;
    buckets.set(key, b);
  }
  let best = [0, 0, 0, 0];
  for (const b of buckets.values()) if (b[3] > best[3]) best = b;
  const bg = [best[0] / best[3], best[1] / best[3], best[2] / best[3]];
  const dist = (o: number) => Math.hypot(data[o] - bg[0], data[o + 1] - bg[1], data[o + 2] - bg[2]);

  let plain = 0;
  for (const p of border) if (dist(p * 4) < CLEAR) plain++;
  if (plain < border.length * 0.7) return 'no-plain-background';

  // Flood in from the edges through anything close to the background colour.
  const seen = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  for (const p of border) if (!seen[p] && dist(p * 4) < CLEAR) { seen[p] = 1; queue[tail++] = p; }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w, y = (p - x) / w;
    const next = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1];
    for (const q of next) {
      if (q < 0 || seen[q]) continue;
      if (dist(q * 4) < CLEAR) { seen[q] = 1; queue[tail++] = q; }
    }
  }
  // Holes inside letters (o, a, d, B) are background-coloured but not joined to the edge.
  // Remove those that sit within a stroke's width of the removed background; keep white shapes
  // deep inside the design (white lettering in a coloured badge), which are much further in.
  const reach = Math.max(6, Math.round(Math.min(w, h) * 0.06));
  const far = new Uint16Array(n).fill(65535);
  head = 0; tail = 0;
  for (let p = 0; p < n; p++) if (seen[p]) { far[p] = 0; queue[tail++] = p; }
  while (head < tail) {
    const p = queue[head++];
    if (far[p] >= reach) continue;
    const x = p % w, y = (p - x) / w;
    for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
      if (q >= 0 && far[q] === 65535) { far[q] = far[p] + 1; queue[tail++] = q; }
    }
  }
  const hole = new Uint8Array(n);
  for (let start = 0; start < n; start++) {
    if (seen[start] || hole[start] || dist(start * 4) >= CLEAR) continue;
    head = 0; tail = 0; queue[tail++] = start; hole[start] = 1;
    let nearest = 65535;
    while (head < tail) {
      const p = queue[head++];
      if (far[p] < nearest) nearest = far[p];
      const x = p % w, y = (p - x) / w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && !seen[q] && !hole[q] && dist(q * 4) < CLEAR) { hole[q] = 1; queue[tail++] = q; }
      }
    }
    if (nearest <= reach) for (let i = 0; i < tail; i++) seen[queue[i]] = 1;
  }
  for (let p = 0; p < n; p++) if (seen[p]) data[p * 4 + 3] = 0;

  // Edge pixels next to the removed area: fade them and take the background colour out of them.
  for (let p = 0; p < n; p++) {
    if (seen[p]) continue;
    const x = p % w, y = (p - x) / w;
    const touches = (x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) || (y > 0 && seen[p - w]) || (y < h - 1 && seen[p + w]);
    if (!touches) continue;
    const o = p * 4, d = dist(o);
    if (d >= FRINGE) continue;
    const a = Math.max(0.05, (d - CLEAR) / (FRINGE - CLEAR));
    for (let c = 0; c < 3; c++) data[o + c] = Math.max(0, Math.min(255, Math.round((data[o + c] - bg[c] * (1 - a)) / a)));
    data[o + 3] = Math.round(data[o + 3] * a);
  }
  return 'removed';
}

/** The box around the visible part of a logo, so empty margins don't make it look smaller. */
export function visibleBounds(data: Uint8ClampedArray, w: number, h: number) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const pad = 2;
  return { x: Math.max(0, x0 - pad), y: Math.max(0, y0 - pad), w: Math.min(w, x1 + pad + 1) - Math.max(0, x0 - pad), h: Math.min(h, y1 + pad + 1) - Math.max(0, y0 - pad) };
}
