import 'regenerator-runtime/runtime';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';

export type AgreementBlock = { title: string; paragraphs: string[] };

import { volunteerLogo } from './volunteer-agreement';
const headingColor = rgb(0.07, 0.14, 0.2);
const bodyColor = rgb(0.19, 0.25, 0.3);
const gold = rgb(0.72, 0.51, 0.14);
const width = 595.28;
const height = 841.89;
const margin = 49;
const contentWidth = width - 2 * margin;
const typeSize = 10.6;
const lineHeight = 15;
const nameFontFiles = [
  'noto-sans-latin-ext-400-normal.woff',
  'noto-sans-vietnamese-400-normal.woff',
  'noto-sans-devanagari-400-normal.woff',
  'noto-sans-cyrillic-400-normal.woff',
  'noto-sans-cyrillic-ext-400-normal.woff',
  'noto-sans-greek-400-normal.woff',
  'noto-sans-greek-ext-400-normal.woff',
];

export async function createVolunteerPdf(version: string, reference: string, blocks: AgreementBlock[], branding?: { title: string; kicker: string; subtitle: string }) {
  // Stable bytes keep Resend's request body identical when the same signature is retried.
  const pdf = await PDFDocument.create({ updateMetadata: false });
  pdf.setTitle(branding?.title ?? 'Webfit News Volunteer Media Agreement and NDA');
  pdf.setAuthor('Webfit News');
  pdf.setSubject(`Agreement version ${version} | Reference ${reference}`);
  pdf.registerFontkit(fontkit);

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const headline = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const logo = await pdf.embedJpg(await readFile(path.join(process.cwd(), 'public', volunteerLogo)));
  const latin = new Set(regular.getCharacterSet());
  const needsNameFonts = blocks.some(({ paragraphs }) =>
    paragraphs.some(paragraph => Array.from(paragraph).some(char => !latin.has(char.codePointAt(0)!))),
  );
  const supplemental: Array<{ font: PDFFont; characters: Set<number> }> = [];
  if (needsNameFonts) {
    const files = await Promise.all(nameFontFiles.map(filename =>
      readFile(path.join(process.cwd(), 'node_modules', '@fontsource/noto-sans/files', filename)),
    ));
    for (const file of files) {
      const font = await pdf.embedFont(file, { subset: true });
      supplemental.push({ font, characters: new Set(font.getCharacterSet()) });
    }
  }
  let hasUnsupportedCharacters = false;

  function runs(text: string, defaultFont: PDFFont) {
    const result: Array<{ text: string; font: PDFFont }> = [];
    for (const char of text) {
      const code = char.codePointAt(0)!;
      const font = latin.has(code) ? defaultFont : supplemental.find(entry => entry.characters.has(code))?.font;
      if (!font) hasUnsupportedCharacters = true;
      const value = font ? char : `[U+${code.toString(16).toUpperCase()}]`;
      const selected = font ?? defaultFont;
      const last = result.at(-1);
      if (last?.font === selected) last.text += value;
      else result.push({ text: value, font: selected });
    }
    return result;
  }

  function measure(text: string) {
    return runs(text, regular).reduce((sum, run) => sum + run.font.widthOfTextAtSize(run.text, typeSize), 0);
  }

  function wrap(text: string) {
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(/\s+/u)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= contentWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      for (const char of word) {
        if (line && measure(line + char) > contentWidth) {
          lines.push(line);
          line = '';
        }
        line += char;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function addPage(first = false) {
    const page = pdf.addPage([width, height]);
    const top = height - margin;
    page.drawImage(logo, { x: margin, y: top - (first ? 62 : 31), width: first ? 62 : 31, height: first ? 62 : 31 });
    page.drawText(branding?.kicker ?? 'WEBFIT NEWS  /  VOLUNTEER ONBOARDING', {
      x: margin + (first ? 76 : 44), y: top - 16, size: 9, font: bold, color: headingColor,
    });
    if (first) {
      page.drawText(branding?.title ?? 'Volunteer Media Agreement and NDA', {
        x: margin + 76, y: top - 42, size: 23, font: headline, color: headingColor,
      });
      page.drawText(branding?.subtitle ?? `Signed copy  |  Version ${version}`, {
        x: margin + 76, y: top - 59, size: 10, font: regular, color: bodyColor,
      });
    }
    const rule = top - (first ? 77 : 40);
    page.drawLine({ start: { x: margin, y: rule }, end: { x: width - margin, y: rule }, thickness: 1.4, color: gold });
    return { page, y: rule - 24 };
  }

  let current = addPage(true);

  function drawLine(page: PDFPage, text: string, y: number) {
    let x = margin;
    for (const run of runs(text, regular)) {
      page.drawText(run.text, { x, y, size: typeSize, font: run.font, color: bodyColor });
      x += run.font.widthOfTextAtSize(run.text, typeSize);
    }
  }

  for (const { title, paragraphs } of blocks) {
    const firstLines = wrap(paragraphs[0]).length;
    if (current.y - 21 - firstLines * lineHeight < margin) current = addPage();
    current.page.drawText(title, { x: margin, y: current.y, size: 12.2, font: bold, color: headingColor });
    current.y -= 19;
    for (const paragraph of paragraphs) {
      const lines = wrap(paragraph);
      if (current.y - (lines.length - 1) * lineHeight < margin + 4) current = addPage();
      for (const line of lines) {
        if (current.y < margin + 4) current = addPage();
        drawLine(current.page, line, current.y);
        current.y -= lineHeight;
      }
      current.y -= 6;
    }
    current.y -= 5;
  }

  if (needsNameFonts) {
    if (hasUnsupportedCharacters) {
      if (current.y < margin + 4) current = addPage();
      drawLine(current.page, 'The embedded UTF-8 record preserves the exact spelling of names.', current.y);
    }
    await pdf.attach(new TextEncoder().encode(blocks.map(({ title, paragraphs }) =>
      [title, ...paragraphs].join('\n'),
    ).join('\n\n')), 'exact-signed-agreement.txt', { mimeType: 'text/plain' });
  }

  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    page.drawText(`Webfit News  |  ${reference}  |  ${index + 1} of ${pages.length}`, {
      x: margin, y: 29, size: 8.5, font: regular, color: bodyColor,
    });
  });
  return pdf.save();
}
