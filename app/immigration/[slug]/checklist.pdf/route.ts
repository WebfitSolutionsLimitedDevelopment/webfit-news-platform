import { NextRequest } from 'next/server';
import { getVisaDefinition, getVisaSnapshot } from '@/lib/immigration';

function ascii(value: string) {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/[()\\]/g, (m) => `\\${m}`);
}

function wrap(text: string, width = 86) {
  const words = ascii(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildPdf(title: string, lines: string[]) {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 52;
  const lineHeight = 15;
  const contentLines = [title, '', ...lines];
  const pages: string[][] = [];
  let page: string[] = [];
  const maxLines = Math.floor((pageHeight - margin * 2) / lineHeight);
  for (const line of contentLines.flatMap((item) => wrap(item || ' ', 82))) {
    if (page.length >= maxLines) {
      pages.push(page);
      page = [];
    }
    page.push(line);
  }
  if (page.length) pages.push(page);

  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageObjectNumbers: number[] = [];
  const contentObjectNumbers: number[] = [];

  for (let i = 0; i < pages.length; i += 1) {
    pageObjectNumbers.push(4 + i * 2);
    contentObjectNumbers.push(5 + i * 2);
  }

  objects.push(`<< /Type /Pages /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  pages.forEach((pageLines, index) => {
    const pageNo = pageObjectNumbers[index];
    const contentNo = contentObjectNumbers[index];
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNo} 0 R >>`);
    let y = pageHeight - margin;
    const commands = ['BT', '/F1 11 Tf'];
    pageLines.forEach((line, lineIndex) => {
      const size = lineIndex === 0 && index === 0 ? 16 : 11;
      if (size !== 11) commands.push(`/${'F1'} ${size} Tf`);
      commands.push(`1 0 0 1 ${margin} ${y} Tm (${ascii(line)}) Tj`);
      if (size !== 11) commands.push('/F1 11 Tf');
      y -= lineHeight;
    });
    commands.push('ET');
    const stream = commands.join('\n');
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const visa = getVisaDefinition(slug);
  if (!visa) return new Response('Not found', { status: 404 });

  const snapshot = await getVisaSnapshot(slug);
  const checked = snapshot?.checkedAt ? new Date(snapshot.checkedAt).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' }) : 'Unavailable';
  const lines = [
    `Source: Immigration New Zealand`,
    `Official page: ${visa.officialUrl}`,
    `Last source check: ${checked}`,
    '',
    `SUMMARY`,
    visa.summary,
    '',
    ...(snapshot?.lengthOfStay ? [`Length of stay: ${snapshot.lengthOfStay}`] : []),
    ...(snapshot?.cost ? [`Cost: ${snapshot.cost}`] : []),
    ...(snapshot?.processingTime ? [`Processing time: ${snapshot.processingTime}`] : []),
    '',
    'GENERAL REQUIREMENTS FROM THE OFFICIAL SOURCE',
    ...(snapshot?.applyRequirements.length ? snapshot.applyRequirements.map((item) => `[ ] ${item}`) : ['[ ] Check the official Immigration New Zealand page for current eligibility requirements.']),
    '',
    'DOCUMENTS AND EVIDENCE',
    ...(snapshot?.documentGuidance.length ? snapshot.documentGuidance.map((item) => `[ ] ${item}`) : ['[ ] Check the official Immigration New Zealand page for the documents and evidence required for your circumstances.']),
    '',
    'IMPORTANT',
    'This checklist is general information only and is not immigration advice. Requirements can vary by applicant and can change. Always confirm the current official requirements with Immigration New Zealand before applying.',
  ];

  const pdf = buildPdf(`${visa.name} - Webfit News Information Checklist`, lines);
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${slug}-checklist.pdf"`,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=21600',
    },
  });
}
