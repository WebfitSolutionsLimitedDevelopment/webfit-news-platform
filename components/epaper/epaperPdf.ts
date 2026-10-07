'use client';

/*
 * Turn rendered e-paper pages into a downloadable PDF, entirely in the reader's browser.
 *
 * Each page is redrawn onto a canvas from the live DOM: boxes (backgrounds and
 * borders), photos, and every word at the exact position the browser laid it out
 * (measured with Range rects, so justified columns come out identical). The canvas
 * is saved as a JPEG and placed on an A4 page with pdf-lib.
 *
 * We draw by hand rather than "screenshotting" HTML because Safari blocks the usual
 * SVG/foreignObject trick, and this way works the same on iPhone, Android and desktop.
 */

const SCALE = 2.4; // 560 × 792 page → 1344 × 1901 pixels
const A4: [number, number] = [595.28, 841.89];

type Box = { x: number; y: number; w: number; h: number };

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    }));
  }
  return imageCache.get(src)!;
}

const transparent = (c: string) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);

function rel(r: DOMRect, origin: DOMRect): Box {
  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
}

function drawBorders(ctx: CanvasRenderingContext2D, b: Box, cs: CSSStyleDeclaration) {
  const sides: Array<['Top' | 'Right' | 'Bottom' | 'Left', number, number, number, number]> = [
    ['Top', b.x, b.y, b.x + b.w, b.y],
    ['Bottom', b.x, b.y + b.h, b.x + b.w, b.y + b.h],
    ['Left', b.x, b.y, b.x, b.y + b.h],
    ['Right', b.x + b.w, b.y, b.x + b.w, b.y + b.h],
  ];
  for (const [side, x1, y1, x2, y2] of sides) {
    const width = parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`));
    const style = cs.getPropertyValue(`border-${side.toLowerCase()}-style`);
    const color = cs.getPropertyValue(`border-${side.toLowerCase()}-color`);
    if (!width || style === 'none' || style === 'hidden' || transparent(color)) continue;
    ctx.save();
    ctx.strokeStyle = color;
    if (style === 'double' && width >= 3) {
      const third = width / 3;
      ctx.lineWidth = third;
      const off = side === 'Top' || side === 'Left' ? third / 2 : -third / 2;
      const far = side === 'Top' || side === 'Left' ? width - third / 2 : -(width - third / 2);
      for (const d of [off, far]) {
        ctx.beginPath();
        if (side === 'Top' || side === 'Bottom') { ctx.moveTo(x1, y1 + d); ctx.lineTo(x2, y2 + d); }
        else { ctx.moveTo(x1 + d, y1); ctx.lineTo(x2 + d, y2); }
        ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    ctx.lineWidth = width;
    if (style === 'dotted') ctx.setLineDash([width, width * 1.6]);
    if (style === 'dashed') ctx.setLineDash([width * 3, width * 2]);
    const inset = side === 'Top' || side === 'Left' ? width / 2 : -width / 2;
    ctx.beginPath();
    if (side === 'Top' || side === 'Bottom') { ctx.moveTo(x1, y1 + inset); ctx.lineTo(x2, y2 + inset); }
    else { ctx.moveTo(x1 + inset, y1); ctx.lineTo(x2 + inset, y2); }
    ctx.stroke();
    ctx.restore();
  }
}

function fontOf(cs: CSSStyleDeclaration) {
  return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

/** Draw one text node word by word at the positions the browser chose. */
function drawText(ctx: CanvasRenderingContext2D, node: Text, origin: DOMRect, clip: DOMRect | null) {
  const parent = node.parentElement;
  if (!parent) return;
  const cs = getComputedStyle(parent);
  if (cs.visibility === 'hidden' || cs.display === 'none') return;
  const text = node.data;
  const range = document.createRange();
  ctx.save();
  ctx.font = fontOf(cs);
  ctx.fillStyle = cs.color;
  ctx.textBaseline = 'alphabetic';
  const letterSpacing = parseFloat(cs.letterSpacing) || 0;
  if (letterSpacing && 'letterSpacing' in ctx) (ctx as any).letterSpacing = `${letterSpacing}px`;
  const upper = cs.textTransform === 'uppercase';

  // First letter of a drop-cap paragraph has its own style.
  let start = 0;
  const firstLetter = parent.firstChild === node && /dropcap/.test(parent.className) ? getComputedStyle(parent, '::first-letter') : null;
  if (firstLetter && text.trim()) {
    const i = text.search(/\S/);
    range.setStart(node, i); range.setEnd(node, i + 1);
    const r = range.getBoundingClientRect();
    if (r.width) {
      ctx.save();
      ctx.font = fontOf(firstLetter);
      ctx.fillStyle = firstLetter.color;
      const m = ctx.measureText(text[i]);
      const ascent = m.actualBoundingBoxAscent || parseFloat(firstLetter.fontSize) * 0.72;
      ctx.fillText(text[i], r.left - origin.left, r.top - origin.top + (r.height + ascent) / 2 - (m.actualBoundingBoxDescent || 0) / 2);
      ctx.restore();
    }
    start = i + 1;
  }

  const re = /\S+/g;
  re.lastIndex = start;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    range.setStart(node, m.index);
    range.setEnd(node, m.index + m[0].length);
    const rects = Array.from(range.getClientRects());
    if (!rects.length) continue;
    // A word can wrap with a hyphen across two lines; draw each piece in its own rect.
    if (rects.length === 1) {
      const r = rects[0];
      // Skip words the page hides (overflow): judge by the word's middle, as glyph boxes can be taller than the line.
      if (clip && (r.top + r.height / 2 > clip.bottom || r.top + r.height / 2 < clip.top || r.left + r.width / 2 > clip.right)) continue;
      const word = upper ? m[0].toUpperCase() : m[0];
      const metrics = ctx.measureText('Hg');
      const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
      const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
      const baseline = r.top - origin.top + (r.height - (ascent + descent)) / 2 + ascent;
      ctx.fillText(word, r.left - origin.left, baseline);
    } else {
      let offset = 0;
      for (const r of rects) {
        // Find how many characters fit in this rect.
        let end = m.index + offset + 1;
        while (end < m.index + m[0].length) {
          range.setStart(node, m.index + offset); range.setEnd(node, end + 1);
          const rr = range.getClientRects();
          if (rr.length > 1 || Math.abs(rr[0].top - r.top) > 2) break;
          end += 1;
        }
        let piece = text.slice(m.index + offset, end);
        if (end < m.index + m[0].length) piece += '-';
        if (upper) piece = piece.toUpperCase();
        const metrics = ctx.measureText('Hg');
        const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
        const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
        ctx.fillText(piece, r.left - origin.left, r.top - origin.top + (r.height - (ascent + descent)) / 2 + ascent);
        offset = end - m.index;
      }
    }
  }
  ctx.restore();
}

async function drawElement(ctx: CanvasRenderingContext2D, el: Element, origin: DOMRect, clip: DOMRect | null) {
  const html = el as HTMLElement;
  const cs = getComputedStyle(html);
  if (cs.display === 'none' || cs.visibility === 'hidden') return;
  const box = rel(html.getBoundingClientRect(), origin);

  if (html.tagName === 'IMG') {
    const img = html as HTMLImageElement;
    const src = img.currentSrc || img.src;
    const loaded = src ? await loadImage(src) : null;
    ctx.save();
    if (clip) { ctx.beginPath(); ctx.rect(clip.left - origin.left, clip.top - origin.top, clip.width, clip.height); ctx.clip(); }
    if (loaded && loaded.naturalWidth) {
      const fit = cs.objectFit;
      const iw = loaded.naturalWidth, ih = loaded.naturalHeight;
      let sx = 0, sy = 0, sw = iw, sh = ih, dx = box.x, dy = box.y, dw = box.w, dh = box.h;
      if (fit === 'cover') {
        const s = Math.max(box.w / iw, box.h / ih);
        sw = box.w / s; sh = box.h / s; sx = (iw - sw) / 2; sy = (ih - sh) / 2;
      } else if (fit === 'contain') {
        const s = Math.min(box.w / iw, box.h / ih);
        dw = iw * s; dh = ih * s; dx = box.x + (box.w - dw) / 2; dy = box.y + (box.h - dh) / 2;
      }
      try { ctx.drawImage(loaded, sx, sy, sw, sh, dx, dy, dw, dh); }
      catch { ctx.fillStyle = '#ece7db'; ctx.fillRect(box.x, box.y, box.w, box.h); }
    } else if (box.w && box.h) {
      ctx.fillStyle = '#ece7db';
      ctx.fillRect(box.x, box.y, box.w, box.h);
    }
    ctx.restore();
    return;
  }

  if (!transparent(cs.backgroundColor) && box.w && box.h) {
    ctx.save();
    ctx.fillStyle = cs.backgroundColor;
    const radius = parseFloat(cs.borderTopLeftRadius) || 0;
    ctx.beginPath();
    if (radius && 'roundRect' in ctx) (ctx as any).roundRect(box.x, box.y, box.w, box.h, Math.min(radius, box.h / 2));
    else ctx.rect(box.x, box.y, box.w, box.h);
    ctx.fill();
    ctx.restore();
  }
  // Radial highlight on the "advertise" page.
  if (/radial-gradient/.test(cs.backgroundImage) && box.w && box.h) {
    ctx.save();
    const g = ctx.createRadialGradient(box.x + box.w * 0.85, box.y + box.h * 0.15, 0, box.x + box.w * 0.85, box.y + box.h * 0.15, Math.max(box.w, box.h) * 0.45);
    g.addColorStop(0, 'rgba(200,35,44,.55)');
    g.addColorStop(1, 'rgba(200,35,44,0)');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  }
  drawBorders(ctx, box, cs);

  // Columns and flows clip their contents; respect that so nothing spills.
  const clips = cs.overflow === 'hidden' || cs.overflowY === 'hidden';
  const nextClip = clips ? html.getBoundingClientRect() : clip;

  for (const child of Array.from(html.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      if ((child as Text).data.trim()) drawText(ctx, child as Text, origin, nextClip);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      await drawElement(ctx, child as Element, origin, nextClip);
    }
  }
  // "■" end-of-story marks are ::after content.
  const after = getComputedStyle(html, '::after');
  if (after.content && after.content !== 'none' && /■/.test(after.content) && html.lastChild) {
    const range = document.createRange();
    range.selectNodeContents(html);
    const rects = range.getClientRects();
    const last = rects[rects.length - 1];
    if (last) {
      ctx.save();
      ctx.font = fontOf(after);
      ctx.fillStyle = after.color;
      ctx.fillText(' ■', last.right - origin.left, last.bottom - origin.top - last.height * 0.25);
      ctx.restore();
    }
  }
}

/** Render one page element (unscaled, 560 × 792) to a JPEG. */
async function pageToJpeg(page: HTMLElement): Promise<Uint8Array> {
  const origin = page.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(origin.width * SCALE);
  canvas.height = Math.round(origin.height * SCALE);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, origin.width, origin.height);
  await drawElement(ctx, page, origin, null);
  const blob: Blob = await new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not draw page'))), 'image/jpeg', 0.86));
  return new Uint8Array(await blob.arrayBuffer());
}

/** Build the PDF from rendered pages and hand it to the reader. */
export async function downloadEpaperPdf(pages: HTMLElement[], fileName: string, title: string, onProgress?: (done: number, total: number) => void) {
  const { PDFDocument } = await import('pdf-lib');
  try { await document.fonts?.ready; } catch {}
  // Make sure every photo has arrived before drawing.
  await Promise.all(pages.flatMap(p => Array.from(p.querySelectorAll('img')).map(img => (img.currentSrc || img.src ? loadImage(img.currentSrc || img.src) : null))));

  const pdf = await PDFDocument.create();
  pdf.setTitle(title);
  pdf.setAuthor('Webfit News');
  pdf.setProducer('webfitnews.com');
  pdf.setCreator('Webfit News e-paper');
  for (let i = 0; i < pages.length; i += 1) {
    const jpg = await pdf.embedJpg(await pageToJpeg(pages[i]));
    const page = pdf.addPage(A4);
    page.drawImage(jpg, { x: 0, y: 0, width: A4[0], height: A4[1] });
    onProgress?.(i + 1, pages.length);
    await new Promise(r => setTimeout(r, 0)); // keep the page responsive
  }
  const bytes = await pdf.save();
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return blob.size;
}
