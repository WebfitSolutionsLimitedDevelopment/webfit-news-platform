import { NextRequest } from 'next/server';
import { getVisaDefinition, getVisaSnapshot } from '@/lib/immigration';

function ascii(value: string) {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/[()\\]/g, (m) => `\\${m}`);
}

function wrap(text: string, width = 78) {
  const words = ascii(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width && line) { lines.push(line); line = word; } else { line = next; }
  }
  if (line) lines.push(line);
  return lines;
}

type PdfBlock =
  | { type: 'title'; text: string }
  | { type: 'subtitle'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'body'; text: string }
  | { type: 'check'; text: string }
  | { type: 'meta'; text: string }
  | { type: 'space' };

function buildPdf(blocks: PdfBlock[]) {
  const pageWidth = 612;
  const pageHeight = 792;
  const left = 54;
  const right = 54;
  const top = 58;
  const bottom = 54;

  const pages: PdfBlock[][] = [];
  let current: PdfBlock[] = [];
  let used = 0;

  function blockHeight(block: PdfBlock) {
    const widths = block.type === 'title' ? 54 : block.type === 'heading' ? 70 : 78;
    const count = block.type === 'space' ? 1 : wrap(block.text, widths).length;
    const line = block.type === 'title' ? 22 : block.type === 'subtitle' ? 17 : block.type === 'heading' ? 18 : 14;
    const extra = block.type === 'heading' ? 10 : block.type === 'space' ? 8 : 4;
    return count * line + extra;
  }

  for (const block of blocks) {
    const h = blockHeight(block);
    if (current.length && used + h > pageHeight - top - bottom - 26) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push(block);
    used += h;
  }
  if (current.length) pages.push(current);

  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageObjectNumbers: number[] = [];
  const contentObjectNumbers: number[] = [];
  for (let i = 0; i < pages.length; i += 1) { pageObjectNumbers.push(5 + i * 2); contentObjectNumbers.push(6 + i * 2); }
  objects.push(`<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  pages.forEach((pageBlocks, index) => {
    const contentNo = contentObjectNumbers[index];
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNo} 0 R >>`);
    let y = pageHeight - top;
    const c: string[] = [];

    c.push('0.08 0.11 0.16 rg');
    c.push(`0 ${pageHeight - 42} ${pageWidth} 42 re f`);
    c.push('1 1 1 rg');
    c.push('BT /F2 15 Tf');
    c.push(`1 0 0 1 ${left} ${pageHeight - 27} Tm (WEBFIT NEWS) Tj ET`);
    c.push('0.72 0.52 0.16 rg');
    c.push(`${left} ${pageHeight - 46} ${pageWidth - left - right} 2 re f`);

    for (const block of pageBlocks) {
      if (block.type === 'space') { y -= 8; continue; }
      const maxWidth = block.type === 'title' ? 54 : block.type === 'heading' ? 70 : 78;
      const lines = wrap(block.text, maxWidth);
      let font = '/F1';
      let size = 10.5;
      let leading = 14;
      if (block.type === 'title') { font = '/F2'; size = 19; leading = 22; }
      if (block.type === 'subtitle') { font = '/F1'; size = 11.5; leading = 17; }
      if (block.type === 'heading') { font = '/F2'; size = 12.5; leading = 18; y -= 4; }
      if (block.type === 'meta') { size = 9; leading = 12; }
      if (block.type === 'check') { size = 10.5; leading = 14; }

      c.push(block.type === 'meta' ? '0.35 0.38 0.43 rg' : '0.08 0.10 0.13 rg');
      c.push(`BT ${font} ${size} Tf`);
      lines.forEach((line, lineIndex) => {
        const prefix = block.type === 'check' && lineIndex === 0 ? '[ ] ' : block.type === 'check' ? '    ' : '';
        c.push(`1 0 0 1 ${left} ${y} Tm (${ascii(prefix + line)}) Tj`);
        y -= leading;
      });
      c.push('ET');
      y -= block.type === 'heading' ? 5 : 4;
    }

    c.push('0.75 0.77 0.80 RG');
    c.push(`${left} 42 m ${pageWidth - right} 42 l S`);
    c.push('0.35 0.38 0.43 rg');
    c.push('BT /F1 8.5 Tf');
    c.push(`1 0 0 1 ${left} 27 Tm (webfitnews.com  |  General information only  |  Page ${index + 1} of ${pages.length}) Tj ET`);

    const stream = c.join('\n');
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, index) => { offsets[index + 1] = Buffer.byteLength(pdf, 'utf8'); pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`; });
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const visa = getVisaDefinition(slug);
  if (!visa) return new Response('Not found', { status: 404 });

  const snapshot = await getVisaSnapshot(slug);
  const checked = snapshot?.checkedAt ? new Date(snapshot.checkedAt).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' }) : 'Unavailable';

  const blocks: PdfBlock[] = [
    { type: 'title', text: visa.name },
    { type: 'subtitle', text: 'New Zealand Visa Information Checklist' },
    { type: 'meta', text: `Source: Immigration New Zealand` },
    { type: 'meta', text: `Last checked: ${checked}` },
    { type: 'meta', text: `Official page: ${visa.officialUrl}` },
    { type: 'space' },
    { type: 'heading', text: 'Visa summary' },
    { type: 'body', text: visa.summary },
    ...(snapshot?.lengthOfStay ? [{ type: 'body', text: `Length of stay: ${snapshot.lengthOfStay}` } as PdfBlock] : []),
    ...(snapshot?.cost ? [{ type: 'body', text: `Cost: ${snapshot.cost}` } as PdfBlock] : []),
    ...(snapshot?.processingTime ? [{ type: 'body', text: `Processing time: ${snapshot.processingTime}` } as PdfBlock] : []),
    { type: 'space' },
    { type: 'heading', text: 'General requirements' },
    ...(snapshot?.applyRequirements.length ? snapshot.applyRequirements.map((item) => ({ type: 'check', text: item } as PdfBlock)) : [{ type: 'body', text: 'Check the official Immigration New Zealand page for current eligibility requirements.' } as PdfBlock]),
    { type: 'space' },
    { type: 'heading', text: 'Documents and evidence' },
    ...(snapshot?.documentGuidance.length ? snapshot.documentGuidance.map((item) => ({ type: 'check', text: item } as PdfBlock)) : [{ type: 'body', text: 'Check the official Immigration New Zealand page for the documents and evidence required for your circumstances.' } as PdfBlock]),
    { type: 'space' },
    { type: 'heading', text: 'Important information' },
    { type: 'body', text: 'This checklist is general information only and is not immigration advice. Requirements can vary by applicant and can change. Always confirm the current official requirements with Immigration New Zealand before applying.' },
  ];

  const pdf = buildPdf(blocks);
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${slug}-checklist.pdf"`,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=21600',
    },
  });
}
