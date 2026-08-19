'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './RichArticleEditor.module.css';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const ALLOWED_TAGS = new Set([
  'P','H2','H3','H4','STRONG','B','EM','I','U','A','UL','OL','LI','BLOCKQUOTE','TABLE','THEAD','TBODY','TFOOT','TR','TH','TD','BR','HR','FIGURE','FIGCAPTION','IMG','IFRAME','DIV',
]);

function cleanPlainText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\r\n?/g, '\n');
}

function escapeHtml(value: string) {
  return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function youtubeId(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
    if (url.hostname.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v') || '';
      const parts = url.pathname.split('/').filter(Boolean);
      if (['shorts','embed','live'].includes(parts[0])) return parts[1] || '';
    }
  } catch {}
  return '';
}

function youtubeEmbed(value: string) {
  const id = youtubeId(value);
  if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return '';
  return `<figure class="article-embed article-embed-youtube"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></figure><p><br></p>`;
}

function inlinePlain(value: string) {
  let output = escapeHtml(value.trim());
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  output = output.replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1<em>$2</em>');
  return output;
}

function splitTableRow(line: string) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
}

function isTableDivider(line: string) {
  const cells = splitTableRow(line);
  return cells.length > 1 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function plainTextToHtml(value: string) {
  const lines = cleanPlainText(value).split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i += 1; continue; }

    const embed = youtubeEmbed(line);
    if (embed) { out.push(embed); i += 1; continue; }

    if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      out.push(`<table><thead><tr>${headers.map(cell => `<th>${inlinePlain(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map((_, index) => `<td>${inlinePlain(row[index] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table><p><br></p>`);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      out.push(`<${heading[1].length <= 2 ? 'h2' : 'h3'}>${inlinePlain(heading[2])}</${heading[1].length <= 2 ? 'h2' : 'h3'}>`);
      i += 1;
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i += 1;
      }
      out.push(`<ul>${items.map(item => `<li>${inlinePlain(item)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i += 1;
      }
      out.push(`<ol>${items.map(item => `<li>${inlinePlain(item)}</li>`).join('')}</ol>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote><p>${items.map(inlinePlain).join('<br>')}</p></blockquote>`);
      continue;
    }

    const paragraph: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim()) {
      const next = lines[i].trim();
      if (/^(#{1,4})\s+/.test(next) || /^[-*•]\s+/.test(next) || /^\d+[.)]\s+/.test(next) || /^>\s?/.test(next)) break;
      if (next.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) break;
      if (youtubeEmbed(next)) break;
      paragraph.push(next);
      i += 1;
    }
    out.push(`<p>${paragraph.map(inlinePlain).join(' ')}</p>`);
  }
  return out.join('');
}

function unwrap(element: Element) {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  parent.removeChild(element);
}

const BLOCK_TAGS = new Set(['P','H1','H2','H3','H4','UL','OL','LI','BLOCKQUOTE','TABLE','THEAD','TBODY','TFOOT','TR','TH','TD','FIGURE','DIV']);

function containsBlockChild(element: Element): boolean {
  return Array.from(element.children).some(child => BLOCK_TAGS.has(child.tagName.toUpperCase()) || containsBlockChild(child));
}

function normalizeBroadInlineWrappers(doc: Document) {
  for (const element of Array.from(doc.body.querySelectorAll('b,strong,em,i'))) {
    if (containsBlockChild(element)) unwrap(element);
  }
}

function normalizeWordHeadings(doc: Document) {
  for (const paragraph of Array.from(doc.body.querySelectorAll('p'))) {
    const className = (paragraph.getAttribute('class') || '').toLowerCase();
    const style = (paragraph.getAttribute('style') || '').toLowerCase();
    let level = 0;

    const classMatch = className.match(/(?:mso)?heading\s*([1-4])/i);
    const styleMatch = style.match(/mso-style-name\s*:\s*['"]?heading\s*([1-4])/i);
    const outlineMatch = style.match(/mso-outline-level\s*:\s*([0-3])/i);

    if (classMatch) level = Number(classMatch[1]);
    else if (styleMatch) level = Number(styleMatch[1]);
    else if (outlineMatch) level = Number(outlineMatch[1]) + 1;

    if (!level) continue;
    const heading = doc.createElement(level <= 2 ? 'h2' : 'h3');
    while (paragraph.firstChild) heading.appendChild(paragraph.firstChild);
    paragraph.replaceWith(heading);
  }
}

function removeLeadingListMarker(element: Element) {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const first = walker.nextNode();
  if (!first) return;
  first.textContent = (first.textContent || '').replace(/^\s*(?:[•·▪◦o]|\d+[.)])\s*/, '');
}

function normalizeWordLists(doc: Document) {
  const children = Array.from(doc.body.children);
  let currentList: HTMLElement | null = null;
  let currentType = '';

  for (const element of children) {
    if (element.tagName.toUpperCase() !== 'P') {
      currentList = null;
      currentType = '';
      continue;
    }

    const className = (element.getAttribute('class') || '').toLowerCase();
    const style = (element.getAttribute('style') || '').toLowerCase();
    const isWordList = className.includes('msolistparagraph') || style.includes('mso-list');
    if (!isWordList) {
      currentList = null;
      currentType = '';
      continue;
    }

    const marker = element.querySelector('[style*="mso-list:Ignore" i]');
    const markerText = marker?.textContent?.trim() || element.textContent?.trim().slice(0, 8) || '';
    const type = /^\d+[.)]/.test(markerText) ? 'ol' : 'ul';
    if (marker) marker.remove();
    removeLeadingListMarker(element);

    if (!currentList || currentType !== type) {
      currentList = doc.createElement(type);
      currentType = type;
      element.parentNode?.insertBefore(currentList, element);
    }

    const item = doc.createElement('li');
    while (element.firstChild) item.appendChild(element.firstChild);
    currentList.appendChild(item);
    element.remove();
  }
}

function sanitizePastedHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  normalizeWordHeadings(doc);
  normalizeWordLists(doc);
  normalizeBroadInlineWrappers(doc);

  const elements = Array.from(doc.body.querySelectorAll('*'));

  for (const element of elements.reverse()) {
    const tag = element.tagName.toUpperCase();
    if (['SCRIPT','STYLE','META','LINK','SVG','FORM','BUTTON','INPUT'].includes(tag)) {
      element.remove();
      continue;
    }

    if (tag === 'H1') {
      const h2 = doc.createElement('h2');
      while (element.firstChild) h2.appendChild(element.firstChild);
      element.replaceWith(h2);
      continue;
    }

    if (tag === 'SPAN') {
      const style = (element.getAttribute('style') || '').toLowerCase();
      const normalWeight = /font-weight\s*:\s*(normal|[1-5]00)(?:\s|;|$)/.test(style);
      const bold = /font-weight\s*:\s*(bold|[6-9]00)(?:\s|;|$)/.test(style);
      const normalStyle = /font-style\s*:\s*normal(?:\s|;|$)/.test(style);
      const italic = /font-style\s*:\s*italic(?:\s|;|$)/.test(style);

      if (normalWeight || normalStyle || bold || italic) {
        let replacement: HTMLElement;

        if (normalWeight || normalStyle) {
          replacement = doc.createElement('span');
          const classes = [];
          if (normalWeight) classes.push('article-normal-weight');
          if (normalStyle) classes.push('article-normal-style');
          replacement.setAttribute('class', classes.join(' '));
          while (element.firstChild) replacement.appendChild(element.firstChild);

          if (italic && !normalStyle) {
            const em = doc.createElement('em');
            while (replacement.firstChild) em.appendChild(replacement.firstChild);
            replacement.appendChild(em);
          }
          if (bold && !normalWeight) {
            const strong = doc.createElement('strong');
            while (replacement.firstChild) strong.appendChild(replacement.firstChild);
            replacement.appendChild(strong);
          }
        } else {
          replacement = doc.createElement(bold ? 'strong' : 'em');
          while (element.firstChild) replacement.appendChild(element.firstChild);
          if (bold && italic) {
            const em = doc.createElement('em');
            while (replacement.firstChild) em.appendChild(replacement.firstChild);
            replacement.appendChild(em);
          }
        }

        element.replaceWith(replacement);
      } else {
        unwrap(element);
      }
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      unwrap(element);
      continue;
    }

    const keep: Record<string, Set<string>> = {
      A: new Set(['href','target','rel','title']),
      IMG: new Set(['src','alt','title','width','height']),
      IFRAME: new Set(['src','title','allow','allowfullscreen','width','height','loading']),
      TH: new Set(['colspan','rowspan','scope']),
      TD: new Set(['colspan','rowspan']),
      FIGURE: new Set(['class']),
      DIV: new Set(['class']),
    };
    const allowed = keep[tag] || new Set<string>();
    for (const attribute of Array.from(element.attributes)) {
      if (!allowed.has(attribute.name.toLowerCase())) element.removeAttribute(attribute.name);
    }

    if (tag === 'A') {
      const href = element.getAttribute('href') || '';
      if (!/^(https?:|mailto:|tel:|\/)/i.test(href)) element.removeAttribute('href');
      else {
        element.setAttribute('rel','noopener noreferrer');
        if (/^https?:/i.test(href)) element.setAttribute('target','_blank');
      }
    }

    if (tag === 'IFRAME') {
      const src = element.getAttribute('src') || '';
      try {
        const url = new URL(src);
        if (!['www.youtube.com','youtube.com','www.youtube-nocookie.com','player.vimeo.com'].includes(url.hostname)) element.remove();
      } catch { element.remove(); }
    }
  }

  return doc.body.innerHTML;
}


type MediaItem = {
  id: string;
  public_url: string | null;
  alt_text: string | null;
  caption?: string | null;
  credit?: string | null;
  filename: string | null;
  width: number | null;
  height: number | null;
};

type MediaMode = 'image' | 'gallery';

export function RichArticleEditor({ value, onChange, placeholder = 'Write or paste the article here' }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastValue = useRef(value);

  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaMode>('image');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaMessage, setMediaMessage] = useState('');
  const [galleryIds, setGalleryIds] = useState<string[]>([]);
  const [editorNotice, setEditorNotice] = useState('');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastValue.current) return;
    if (document.activeElement !== editor) editor.innerHTML = value || '';
    lastValue.current = value;
  }, [value]);

  function emit() {
    const html = editorRef.current?.innerHTML || '';
    lastValue.current = html;
    onChange(html);
  }

  function command(name: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(name, false, value);
    emit();
  }

  function rememberSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || !selection.rangeCount) {
      savedRangeRef.current = null;
      return;
    }
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer as Element
      : range.commonAncestorContainer.parentElement;
    savedRangeRef.current = container && editor.contains(container) ? range.cloneRange() : null;
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    if (savedRangeRef.current) {
      try {
        selection.addRange(savedRangeRef.current);
        return;
      } catch {}
    }
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.addRange(range);
  }

  function insertHtml(html: string) {
    const editor = editorRef.current;
    if (!editor || !html) return;

    let range = savedRangeRef.current?.cloneRange() || null;
    const rangeContainer = range
      ? (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? range.commonAncestorContainer as Element
          : range.commonAncestorContainer.parentElement)
      : null;

    if (!range || !rangeContainer || !editor.contains(rangeContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    // Block media should sit between paragraphs rather than becoming an invalid
    // child of a paragraph, heading or list item.
    const isBlockInsert = /^\s*<(figure|div\s+class=["']article-gallery|table|iframe|hr)\b/i.test(html);
    if (isBlockInsert) {
      const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer as Element
        : range.startContainer.parentElement;
      const block = startElement?.closest('p,li,h2,h3,h4,blockquote');
      if (block && editor.contains(block)) {
        range.setStartAfter(block);
        range.collapse(true);
      }
    }

    const template = document.createElement('template');
    template.innerHTML = html;
    const fragment = template.content;
    const lastInserted = fragment.lastChild;

    range.deleteContents();
    range.insertNode(fragment);

    const selection = window.getSelection();
    if (selection && lastInserted && lastInserted.parentNode) {
      const after = document.createRange();
      after.setStartAfter(lastInserted);
      after.collapse(true);
      selection.removeAllRanges();
      selection.addRange(after);
      savedRangeRef.current = after.cloneRange();
    } else {
      savedRangeRef.current = null;
    }

    editor.normalize();
    emit();
  }

  function addLink() {
    const href = window.prompt('Paste the link URL');
    if (!href) return;
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
      window.alert('Use a full URL beginning with https://, mailto: or tel:.');
      return;
    }
    command('createLink', href);
    const selection = window.getSelection();
    const node = selection?.anchorNode?.parentElement?.closest('a');
    if (node) { node.setAttribute('target','_blank'); node.setAttribute('rel','noopener noreferrer'); emit(); }
  }

  function addYoutube() {
    const url = window.prompt('Paste a YouTube URL');
    if (!url) return;
    const embed = youtubeEmbed(url);
    if (!embed) { window.alert('That does not look like a valid YouTube URL.'); return; }
    rememberSelection();
    insertHtml(embed);
  }

  function addTable() {
    const rows = Math.min(20, Math.max(2, Number(window.prompt('Number of rows', '3')) || 3));
    const columns = Math.min(10, Math.max(2, Number(window.prompt('Number of columns', '3')) || 3));
    const header = `<thead><tr>${Array.from({length:columns},(_,index)=>`<th>Heading ${index+1}</th>`).join('')}</tr></thead>`;
    const body = `<tbody>${Array.from({length:rows-1},()=>`<tr>${Array.from({length:columns},()=>'<td><br></td>').join('')}</tr>`).join('')}</tbody>`;
    rememberSelection();
    insertHtml(`<table>${header}${body}</table><p><br></p>`);
  }

  async function loadMedia(q = '') {
    setMediaBusy(true);
    setMediaMessage('');
    try {
      const response = await fetch(`/api/admin/media?q=${encodeURIComponent(q)}&limit=100`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load media library.');
      setMediaItems(data.media || []);
    } catch (error: any) {
      setMediaMessage(error.message || 'Could not load media library.');
    } finally {
      setMediaBusy(false);
    }
  }

  async function openMedia(mode: MediaMode) {
    rememberSelection();
    setMediaMode(mode);
    setGalleryIds([]);
    setMediaMessage('');
    setMediaOpen(true);
    if (!mediaItems.length) await loadMedia('');
  }

  function newInlineInstance() {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `inline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function imageHtml(item: MediaItem) {
    if (!item.public_url) return '';
    const inlineInstance = newInlineInstance();
    const alt = escapeHtml(item.alt_text || item.filename || '');
    const caption = (item.caption || '').trim();
    const credit = (item.credit || '').trim();
    const captionText = [caption, credit ? `Credit: ${credit}` : ''].filter(Boolean).join(' ');
    return `<figure class="article-inline-image" data-inline-instance="${escapeHtml(inlineInstance)}"><img data-media-id="${escapeHtml(item.id)}" src="${escapeHtml(item.public_url)}" alt="${alt}" loading="lazy" decoding="async">${captionText ? `<figcaption>${escapeHtml(captionText)}</figcaption>` : ''}</figure><p><br></p>`;
  }

  function galleryHtml(items: MediaItem[]) {
    const inlineInstance = newInlineInstance();
    const figures = items
      .filter(item => item.public_url)
      .map(item => {
        const alt = escapeHtml(item.alt_text || item.filename || '');
        const caption = (item.caption || '').trim();
        const credit = (item.credit || '').trim();
        const captionText = [caption, credit ? `Credit: ${credit}` : ''].filter(Boolean).join(' ');
        return `<figure class="article-gallery-item"><img data-media-id="${escapeHtml(item.id)}" src="${escapeHtml(item.public_url!)}" alt="${alt}" loading="lazy" decoding="async">${captionText ? `<figcaption>${escapeHtml(captionText)}</figcaption>` : ''}</figure>`;
      })
      .join('');
    return figures ? `<div class="article-gallery" data-inline-instance="${escapeHtml(inlineInstance)}">${figures}</div><p><br></p>` : '';
  }

  function chooseImage(item: MediaItem) {
    if (mediaMode === 'image') {
      const html = imageHtml(item);
      if (html) {
        insertHtml(html);
        setEditorNotice('Image inserted into the article body. Save or update the article to publish this change.');
      }
      setMediaOpen(false);
      return;
    }
    setGalleryIds(current => {
      if (current.includes(item.id)) return current.filter(id => id !== item.id);
      if (current.length >= 20) {
        setMediaMessage('A gallery can contain up to 20 images.');
        return current;
      }
      return [...current, item.id];
    });
  }

  function insertSelectedGallery() {
    const selected = galleryIds
      .map(id => mediaItems.find(item => item.id === id))
      .filter(Boolean) as MediaItem[];
    if (!selected.length) {
      setMediaMessage('Select at least one image for the gallery.');
      return;
    }
    const html = galleryHtml(selected);
    if (html) {
      insertHtml(html);
      setEditorNotice(`${selected.length} images inserted as a gallery. Save or update the article to publish this change.`);
    }
    setMediaOpen(false);
    setGalleryIds([]);
  }

  async function uploadMediaFiles() {
    const files = Array.from(mediaFileRef.current?.files || []);
    if (!files.length) {
      setMediaMessage('Choose one or more image files first.');
      return;
    }
    if (mediaMode === 'image' && files.length > 1) {
      setMediaMessage('Choose one image for a full-width inline image, or use Gallery for multiple images.');
      return;
    }
    if (mediaMode === 'gallery' && files.length + galleryIds.length > 20) {
      setMediaMessage('A gallery can contain up to 20 images.');
      return;
    }

    setMediaBusy(true);
    setMediaMessage('');
    const uploaded: MediaItem[] = [];
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
        const form = new FormData();
        form.set('file', file);
        form.set('alt_text', file.name.replace(/\.[^.]+$/,'').replaceAll('-',' ').replaceAll('_',' '));
        const response = await fetch('/api/admin/media', { method: 'POST', body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Could not upload ${file.name}.`);
        uploaded.push(data.media);
      }

      setMediaItems(current => [...uploaded, ...current.filter(item => !uploaded.some(upload => upload.id === item.id))]);

      if (mediaMode === 'image') {
        const html = imageHtml(uploaded[0]);
        if (html) {
          insertHtml(html);
          setEditorNotice('Image uploaded and inserted into the article body. Save or update the article to publish this change.');
        }
        setMediaOpen(false);
      } else {
        setGalleryIds(current => [...current, ...uploaded.map(item => item.id)].slice(0, 20));
        setMediaMessage(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded and selected.`);
      }
      if (mediaFileRef.current) mediaFileRef.current.value = '';
    } catch (error: any) {
      setMediaMessage(error.message || 'Image upload failed.');
    } finally {
      setMediaBusy(false);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    const singleYoutube = text.trim() && !text.trim().includes('\n') ? youtubeEmbed(text.trim()) : '';
    event.preventDefault();
    rememberSelection();
    if (singleYoutube) insertHtml(singleYoutube);
    else if (html) insertHtml(sanitizePastedHtml(html));
    else insertHtml(plainTextToHtml(text));
  }

  function toolbarButton(label: string, action: () => void, title?: string) {
    return <button type="button" title={title || label} onMouseDown={event=>{event.preventDefault();action();}}>{label}</button>;
  }

  return <div className={styles.wrapper}>
    <div className={styles.toolbar} role="toolbar" aria-label="Article formatting">
      <div className={styles.group}>
        {toolbarButton('Paragraph',()=>command('formatBlock','p'))}
        {toolbarButton('Heading',()=>command('formatBlock','h2'))}
        {toolbarButton('Subheading',()=>command('formatBlock','h3'))}
      </div>
      <div className={styles.group}>
        {toolbarButton('B',()=>command('bold'),'Bold')}
        {toolbarButton('I',()=>command('italic'),'Italic')}
        {toolbarButton('Link',addLink)}
      </div>
      <div className={styles.group}>
        {toolbarButton('Bullets',()=>command('insertUnorderedList'))}
        {toolbarButton('Numbers',()=>command('insertOrderedList'))}
        {toolbarButton('Quote',()=>command('formatBlock','blockquote'))}
      </div>
      <div className={styles.group}>
        {toolbarButton('Image',()=>openMedia('image'),'Insert an image at the cursor')}
        {toolbarButton('Gallery',()=>openMedia('gallery'),'Insert up to 20 images as a gallery')}
        {toolbarButton('Table',addTable)}
        {toolbarButton('YouTube',addYoutube)}
        {toolbarButton('Line',()=>command('insertHorizontalRule'))}
      </div>
      <div className={styles.group}>
        {toolbarButton('Undo',()=>command('undo'))}
        {toolbarButton('Redo',()=>command('redo'))}
        {toolbarButton('Clear',()=>command('removeFormat'),'Clear inline formatting')}
      </div>
    </div>
    <div className={styles.hint}>Use Image for a full article image exactly where the cursor is placed. Use Gallery to select or upload up to 20 images. Word formatting, tables, lists, quotes, links and YouTube embeds remain supported.</div>
    {editorNotice && <div className={styles.mediaMessage} role="status" aria-live="polite">{editorNotice}</div>}
    <div
      ref={editorRef}
      className={styles.editor}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={emit}
      onBlur={emit}
      onPaste={handlePaste}
      dangerouslySetInnerHTML={{__html:value || ''}}
    />

    <div className={styles.quickMedia} aria-label="Quick article media controls">
      <button type="button" title="Insert image at the current article position" onMouseDown={event=>{event.preventDefault();openMedia('image')}}>+ Image</button>
      <button type="button" title="Insert image gallery at the current article position" onMouseDown={event=>{event.preventDefault();openMedia('gallery')}}>Gallery</button>
    </div>

    {mediaOpen && <div className={styles.mediaModal}>
      <button type="button" className={styles.mediaBackdrop} aria-label="Close image library" onClick={()=>setMediaOpen(false)}/>
      <div className={styles.mediaDialog}>
        <header className={styles.mediaHeader}>
          <div>
            <span>ARTICLE MEDIA</span>
            <h3>{mediaMode === 'gallery' ? 'Build image gallery' : 'Insert image'}</h3>
            <p>{mediaMode === 'gallery' ? `${galleryIds.length}/20 selected. Images will appear where your cursor was.` : 'Choose or upload an image. It will be inserted where your cursor was.'}</p>
          </div>
          <button type="button" onClick={()=>setMediaOpen(false)}>Close</button>
        </header>

        <div className={styles.mediaUpload}>
          <div><strong>Upload {mediaMode === 'gallery' ? 'images' : 'image'}</strong><small>JPG, PNG, WebP or AVIF. Maximum 20 MB each.</small></div>
          <input ref={mediaFileRef} type="file" accept="image/*" multiple={mediaMode === 'gallery'}/>
          <button type="button" disabled={mediaBusy} onClick={uploadMediaFiles}>{mediaBusy ? 'Uploading...' : 'Upload'}</button>
        </div>

        <div className={styles.mediaSearch}>
          <input value={mediaSearch} onChange={event=>setMediaSearch(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')loadMedia(mediaSearch)}} placeholder="Search filename, caption or alt text"/>
          <button type="button" disabled={mediaBusy} onClick={()=>loadMedia(mediaSearch)}>Search</button>
        </div>

        {mediaMessage && <div className={styles.mediaMessage}>{mediaMessage}</div>}

        {mediaBusy && !mediaItems.length ? <div className={styles.mediaLoading}>Loading images...</div> :
          <div className={styles.mediaGrid}>
            {mediaItems.map(item => {
              const selected = galleryIds.includes(item.id);
              return <button
                type="button"
                key={item.id}
                className={selected ? styles.mediaSelected : ''}
                onClick={()=>chooseImage(item)}
              >
                <span>{item.public_url ? <img src={item.public_url} alt={item.alt_text || item.filename || ''}/> : null}</span>
                <strong>{item.filename || 'Untitled image'}</strong>
                <small>{item.width && item.height ? `${item.width} x ${item.height}` : 'Image'}</small>
                {mediaMode === 'gallery' && <b>{selected ? 'Selected' : 'Select'}</b>}
              </button>;
            })}
          </div>
        }

        {mediaMode === 'gallery' && <footer className={styles.mediaFooter}>
          <span>{galleryIds.length} image{galleryIds.length === 1 ? '' : 's'} selected</span>
          <button type="button" disabled={!galleryIds.length || mediaBusy} onClick={insertSelectedGallery}>Insert gallery</button>
        </footer>}
      </div>
    </div>}
  </div>;
}
