/**
 * Where the logo goes on a photo. Shared by the browser preview and the
 * server, so what people see before they press the button is what they get.
 */
export type LogoCorner = 'tl' | 'tr' | 'bl' | 'br' | 'bc';
export const LOGO_CORNERS: LogoCorner[] = ['tl', 'tr', 'bc', 'bl', 'br'];
export const LOGO_SIZE_MIN = 8;
export const LOGO_SIZE_MAX = 35;
export const LOGO_SIZE_DEFAULT = 18;
export const DAILY_LOGO_LIMIT = 5;
export const LOGO_KEEP_DAYS = 30;

export function placeLogo(imgW: number, imgH: number, logoW: number, logoH: number, corner: LogoCorner, sizePct: number) {
  const pct = Math.min(LOGO_SIZE_MAX, Math.max(LOGO_SIZE_MIN, sizePct || LOGO_SIZE_DEFAULT));
  let w = Math.max(1, Math.round(imgW * pct / 100));
  let h = Math.max(1, Math.round(w * logoH / logoW));
  const maxH = Math.round(imgH * 0.4); // tall logos never cover more than 40% of the height
  if (h > maxH) { h = maxH; w = Math.max(1, Math.round(h * logoW / logoH)); }
  const m = Math.round(Math.max(8, Math.min(imgW, imgH) * 0.03));
  const left = corner === 'tl' || corner === 'bl' ? m : corner === 'bc' ? Math.round((imgW - w) / 2) : imgW - w - m;
  const top = corner === 'tl' || corner === 'tr' ? m : imgH - h - m;
  return { left, top, width: w, height: h };
}

export function isCorner(v: unknown): v is LogoCorner {
  return typeof v === 'string' && (LOGO_CORNERS as string[]).includes(v);
}
