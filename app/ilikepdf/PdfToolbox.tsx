'use client';

import { useMemo, useRef, useState } from 'react';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import styles from './ilikepdf.module.css';

type ToolId =
  | 'merge'
  | 'split'
  | 'organize'
  | 'remove'
  | 'rotate'
  | 'numbers'
  | 'watermark'
  | 'image-pdf'
  | 'pdf-jpg'
  | 'pdf-png'
  | 'pdf-text'
  | 'pdf-word'
  | 'word-pdf'
  | 'word-jpg'
  | 'text-pdf'
  | 'compress';

type Tool = {
  id: ToolId;
  title: string;
  short: string;
  icon: string;
  accepts: string;
  multiple?: boolean;
  extra?: 'range' | 'order' | 'remove' | 'rotation' | 'watermark' | 'text';
};

const tools: Tool[] = [
  { id: 'merge', title: 'Merge PDF', short: 'Combine multiple PDF files into one.', icon: '⇄', accepts: 'application/pdf', multiple: true },
  { id: 'split', title: 'Split PDF', short: 'Extract selected pages into a new PDF.', icon: '✂', accepts: 'application/pdf', extra: 'range' },
  { id: 'organize', title: 'Organize PDF', short: 'Reorder pages with a simple page sequence.', icon: '↕', accepts: 'application/pdf', extra: 'order' },
  { id: 'remove', title: 'Remove PDF Pages', short: 'Delete pages you do not need.', icon: '−', accepts: 'application/pdf', extra: 'remove' },
  { id: 'rotate', title: 'Rotate PDF', short: 'Rotate every page by 90, 180 or 270 degrees.', icon: '↻', accepts: 'application/pdf', extra: 'rotation' },
  { id: 'numbers', title: 'Add Page Numbers', short: 'Number every page automatically.', icon: '#', accepts: 'application/pdf' },
  { id: 'watermark', title: 'Watermark PDF', short: 'Add a text watermark across every page.', icon: 'W', accepts: 'application/pdf', extra: 'watermark' },
  { id: 'compress', title: 'Compress PDF', short: 'Reduce image-heavy PDFs by flattening pages.', icon: '⇲', accepts: 'application/pdf' },
  { id: 'image-pdf', title: 'JPG / PNG to PDF', short: 'Turn one or more images into a PDF.', icon: '▧', accepts: 'image/jpeg,image/png', multiple: true },
  { id: 'pdf-jpg', title: 'PDF to JPG', short: 'Export PDF pages as JPG files in a ZIP.', icon: 'J', accepts: 'application/pdf' },
  { id: 'pdf-png', title: 'PDF to PNG', short: 'Export PDF pages as PNG files in a ZIP.', icon: 'P', accepts: 'application/pdf' },
  { id: 'pdf-text', title: 'PDF to Text', short: 'Extract readable text from a PDF.', icon: 'T', accepts: 'application/pdf' },
  { id: 'pdf-word', title: 'PDF to Word', short: 'Create an editable DOCX from extracted text.', icon: 'D', accepts: 'application/pdf' },
  { id: 'word-pdf', title: 'Word to PDF', short: 'Convert DOCX text into a clean PDF.', icon: 'W', accepts: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { id: 'word-jpg', title: 'Word to JPG', short: 'Render DOCX text as a high-resolution JPG.', icon: 'J', accepts: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { id: 'text-pdf', title: 'Text to PDF', short: 'Paste text and download it as a PDF.', icon: 'Aa', accepts: '', extra: 'text' },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadBytes(bytes: Uint8Array, filename: string, type = 'application/pdf') {
  downloadBlob(new Blob([bytes as BlobPart], { type }), filename);
}

function parsePages(input: string, pageCount: number) {
  const result = new Set<number>();
  for (const part of input.split(',').map((v) => v.trim()).filter(Boolean)) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      if (!Number.isInteger(a) || !Number.isInteger(b)) continue;
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      for (let i = start; i <= end; i += 1) if (i >= 1 && i <= pageCount) result.add(i - 1);
    } else {
      const n = Number(part);
      if (Number.isInteger(n) && n >= 1 && n <= pageCount) result.add(n - 1);
    }
  }
  return [...result];
}

function parseOrder(input: string, pageCount: number) {
  return input
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= pageCount)
    .map((n) => n - 1);
}

function wrapText(text: string, maxChars = 88) {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, '').split('\n')) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }
    const words = paragraph.split(/\s+/);
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function createTextPdf(text: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const width = 595.28;
  const height = 841.89;
  const margin = 48;
  const fontSize = 11;
  const lineHeight = 16;
  let page = pdf.addPage([width, height]);
  let y = height - margin;
  for (const line of wrapText(text)) {
    if (y < margin + lineHeight) {
      page = pdf.addPage([width, height]);
      y = height - margin;
    }
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.08, 0.08, 0.08) });
    y -= lineHeight;
  }
  return pdf.save();
}

async function getPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  }
  return pdfjs;
}

async function extractPdfText(file: File) {
  const pdfjs = await getPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    pages.push(pageText);
  }
  return pages;
}

async function renderPdfPages(file: File, mime: 'image/jpeg' | 'image/png', quality = 0.88) {
  const pdfjs = await getPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const blobs: Blob[] = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not create an image canvas.');
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
    if (!blob) throw new Error('Could not render a PDF page.');
    blobs.push(blob);
  }
  return blobs;
}

async function docxRawText(file: File) {
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value.trim();
}

function ToolInput({ tool, busy, onRun }: { tool: Tool; busy: boolean; onRun: (files: File[], option: string) => Promise<void> }) {
  const [files, setFiles] = useState<File[]>([]);
  const [option, setOption] = useState(tool.extra === 'rotation' ? '90' : '');
  const inputRef = useRef<HTMLInputElement>(null);

  const helper = useMemo(() => {
    if (tool.extra === 'range') return 'Pages to keep, e.g. 1-3,5';
    if (tool.extra === 'order') return 'New page order, e.g. 3,1,2';
    if (tool.extra === 'remove') return 'Pages to remove, e.g. 2,4-6';
    if (tool.extra === 'watermark') return 'Watermark text';
    return '';
  }, [tool.extra]);

  return (
    <div className={styles.runner}>
      {tool.extra === 'text' ? (
        <textarea className={styles.textarea} value={option} onChange={(e) => setOption(e.target.value)} placeholder="Paste or type your text here" rows={10} />
      ) : (
        <>
          <input
            ref={inputRef}
            className={styles.hiddenInput}
            type="file"
            accept={tool.accepts}
            multiple={tool.multiple}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
          <button type="button" className={styles.filePicker} onClick={() => inputRef.current?.click()}>
            <strong>{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Choose files'}</strong>
            <span>{files.length ? files.map((f) => f.name).join(', ') : tool.multiple ? 'Select one or more files' : 'Select a file'}</span>
          </button>
        </>
      )}

      {tool.extra === 'rotation' ? (
        <label className={styles.optionLabel}>Rotation
          <select value={option} onChange={(e) => setOption(e.target.value)}>
            <option value="90">90° clockwise</option>
            <option value="180">180°</option>
            <option value="270">270° clockwise</option>
          </select>
        </label>
      ) : helper ? (
        <label className={styles.optionLabel}>{helper}
          <input value={option} onChange={(e) => setOption(e.target.value)} placeholder={helper} />
        </label>
      ) : null}

      <button
        type="button"
        className={styles.runButton}
        disabled={busy || (tool.extra !== 'text' && files.length === 0) || (tool.extra === 'text' && !option.trim())}
        onClick={() => onRun(files, option)}
      >
        {busy ? 'Processing…' : `Run ${tool.title}`}
      </button>
    </div>
  );
}

export default function PdfToolbox() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Tool | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((tool) => `${tool.title} ${tool.short}`.toLowerCase().includes(q));
  }, [query]);

  async function run(tool: Tool, files: File[], option: string) {
    setBusy(true);
    setMessage('');
    try {
      if (tool.id === 'merge') {
        const out = await PDFDocument.create();
        for (const file of files) {
          const src = await PDFDocument.load(await file.arrayBuffer());
          const copied = await out.copyPages(src, src.getPageIndices());
          copied.forEach((p) => out.addPage(p));
        }
        downloadBytes(await out.save(), 'merged.pdf');
      } else if (tool.id === 'split') {
        const src = await PDFDocument.load(await files[0].arrayBuffer());
        const selected = parsePages(option, src.getPageCount());
        if (!selected.length) throw new Error('Enter at least one valid page or page range.');
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, selected);
        copied.forEach((p) => out.addPage(p));
        downloadBytes(await out.save(), 'split-pages.pdf');
      } else if (tool.id === 'organize') {
        const src = await PDFDocument.load(await files[0].arrayBuffer());
        const order = parseOrder(option, src.getPageCount());
        if (!order.length) throw new Error('Enter a valid page order, for example 3,1,2.');
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, order);
        copied.forEach((p) => out.addPage(p));
        downloadBytes(await out.save(), 'organized.pdf');
      } else if (tool.id === 'remove') {
        const src = await PDFDocument.load(await files[0].arrayBuffer());
        const remove = new Set(parsePages(option, src.getPageCount()));
        const keep = src.getPageIndices().filter((index) => !remove.has(index));
        if (!keep.length) throw new Error('You cannot remove every page.');
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, keep);
        copied.forEach((p) => out.addPage(p));
        downloadBytes(await out.save(), 'pages-removed.pdf');
      } else if (tool.id === 'rotate') {
        const src = await PDFDocument.load(await files[0].arrayBuffer());
        const amount = Number(option) || 90;
        src.getPages().forEach((page) => page.setRotation(degrees((page.getRotation().angle + amount) % 360)));
        downloadBytes(await src.save(), 'rotated.pdf');
      } else if (tool.id === 'numbers') {
        const src = await PDFDocument.load(await files[0].arrayBuffer());
        const font = await src.embedFont(StandardFonts.Helvetica);
        src.getPages().forEach((page, index) => {
          const { width } = page.getSize();
          const label = String(index + 1);
          page.drawText(label, { x: width / 2 - font.widthOfTextAtSize(label, 10) / 2, y: 18, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
        });
        downloadBytes(await src.save(), 'numbered.pdf');
      } else if (tool.id === 'watermark') {
        if (!option.trim()) throw new Error('Enter watermark text.');
        const src = await PDFDocument.load(await files[0].arrayBuffer());
        const font = await src.embedFont(StandardFonts.HelveticaBold);
        src.getPages().forEach((page) => {
          const { width, height } = page.getSize();
          page.drawText(option.slice(0, 80), { x: width * 0.18, y: height * 0.48, size: Math.max(22, width / 15), font, rotate: degrees(35), opacity: 0.18, color: rgb(0.35, 0.35, 0.35) });
        });
        downloadBytes(await src.save(), 'watermarked.pdf');
      } else if (tool.id === 'image-pdf') {
        const out = await PDFDocument.create();
        for (const file of files) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const image = file.type === 'image/png' ? await out.embedPng(bytes) : await out.embedJpg(bytes);
          const { width, height } = image.scale(1);
          const page = out.addPage([width, height]);
          page.drawImage(image, { x: 0, y: 0, width, height });
        }
        downloadBytes(await out.save(), 'images.pdf');
      } else if (tool.id === 'pdf-jpg' || tool.id === 'pdf-png') {
        const mime = tool.id === 'pdf-jpg' ? 'image/jpeg' : 'image/png';
        const ext = tool.id === 'pdf-jpg' ? 'jpg' : 'png';
        const blobs = await renderPdfPages(files[0], mime, 0.9);
        const zip = new JSZip();
        blobs.forEach((blob, index) => zip.file(`page-${index + 1}.${ext}`, blob));
        downloadBlob(await zip.generateAsync({ type: 'blob' }), `pdf-pages-${ext}.zip`);
      } else if (tool.id === 'pdf-text') {
        const pages = await extractPdfText(files[0]);
        downloadBlob(new Blob([pages.map((p, i) => `PAGE ${i + 1}\n${p}`).join('\n\n')], { type: 'text/plain;charset=utf-8' }), 'pdf-text.txt');
      } else if (tool.id === 'pdf-word') {
        const pages = await extractPdfText(files[0]);
        const doc = new Document({ sections: [{ children: pages.flatMap((text, index) => [new Paragraph({ children: [new TextRun({ text: `Page ${index + 1}`, bold: true })] }), ...wrapText(text, 110).map((line) => new Paragraph(line))]) }] });
        downloadBlob(await Packer.toBlob(doc), 'pdf-to-word.docx');
      } else if (tool.id === 'word-pdf') {
        const text = await docxRawText(files[0]);
        if (!text) throw new Error('No readable text was found in this DOCX.');
        downloadBytes(await createTextPdf(text), 'word-to-pdf.pdf');
      } else if (tool.id === 'word-jpg') {
        const text = await docxRawText(files[0]);
        if (!text) throw new Error('No readable text was found in this DOCX.');
        const lines = wrapText(text, 90);
        const width = 1400;
        const margin = 80;
        const lineHeight = 34;
        const height = Math.max(600, margin * 2 + lines.length * lineHeight);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Your browser could not create an image canvas.');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#111111';
        ctx.font = '24px Arial, sans-serif';
        lines.forEach((line, index) => ctx.fillText(line, margin, margin + index * lineHeight));
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        if (!blob) throw new Error('Could not create the JPG.');
        downloadBlob(blob, 'word-to-jpg.jpg');
      } else if (tool.id === 'text-pdf') {
        downloadBytes(await createTextPdf(option), 'text.pdf');
      } else if (tool.id === 'compress') {
        const blobs = await renderPdfPages(files[0], 'image/jpeg', 0.62);
        const src = await PDFDocument.load(await files[0].arrayBuffer());
        const out = await PDFDocument.create();
        for (let i = 0; i < blobs.length; i += 1) {
          const img = await out.embedJpg(new Uint8Array(await blobs[i].arrayBuffer()));
          const srcSize = src.getPage(i).getSize();
          const page = out.addPage([srcSize.width, srcSize.height]);
          page.drawImage(img, { x: 0, y: 0, width: srcSize.width, height: srcSize.height });
        }
        downloadBytes(await out.save(), 'compressed.pdf');
      }
      setMessage('Done. Your file has been prepared and downloaded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong while processing the file.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.toolbox} aria-labelledby="tools-heading">
      <div className={styles.toolHeader}>
        <div>
          <p className={styles.eyebrow}>FREE PDF TOOLS</p>
          <h2 id="tools-heading">Choose a tool</h2>
        </div>
        <input className={styles.search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search PDF tools…" aria-label="Search PDF tools" />
      </div>

      <div className={styles.privacyNote}><span>🔒</span><div><strong>Private by design</strong><p>These tools process your files in your browser. Webfit News does not store your documents for these conversions.</p></div></div>

      <div className={styles.toolGrid}>
        {visible.map((tool) => (
          <button key={tool.id} type="button" className={`${styles.toolCard} ${active?.id === tool.id ? styles.activeCard : ''}`} onClick={() => { setActive(tool); setMessage(''); }}>
            <span className={styles.toolIcon}>{tool.icon}</span>
            <span><strong>{tool.title}</strong><small>{tool.short}</small></span>
          </button>
        ))}
      </div>

      {active ? (
        <div className={styles.toolPanel} id="tool-runner">
          <div className={styles.panelTitle}><span className={styles.toolIcon}>{active.icon}</span><div><h3>{active.title}</h3><p>{active.short}</p></div></div>
          <ToolInput key={active.id} tool={active} busy={busy} onRun={(files, option) => run(active, files, option)} />
          {active.id === 'compress' ? <p className={styles.technicalNote}>Compression flattens pages into images. It can substantially reduce image-heavy files, but searchable text and interactive form fields will not be preserved.</p> : null}
          {(active.id === 'pdf-word' || active.id === 'word-pdf' || active.id === 'word-jpg') ? <p className={styles.technicalNote}>Office conversions are optimised for text-based documents. Complex layouts, tables, forms and embedded objects may not reproduce exactly.</p> : null}
          {message ? <p className={styles.status} role="status">{message}</p> : null}
        </div>
      ) : <p className={styles.selectPrompt}>Select any tool above to start.</p>}
    </section>
  );
}
