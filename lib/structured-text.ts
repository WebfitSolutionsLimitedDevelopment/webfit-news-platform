function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\r\n?/g, '\n');
}

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? value : '';
  } catch {
    return '';
  }
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

function inlineMarkdown(value: string) {
  let output = escapeHtml(value.trim());
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, href) => {
    const safe = safeUrl(href);
    return safe ? `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
  });
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  output = output.replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1<em>$2</em>');
  output = output.replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, '$1<em>$2</em>');
  output = output.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, (match, lead, href) => {
    if (match.includes('href=&quot;')) return match;
    const trimmed = href.replace(/[.,;:!?]+$/, '');
    const suffix = href.slice(trimmed.length);
    return `${lead}<a href="${escapeHtml(trimmed)}" target="_blank" rel="noopener noreferrer">${escapeHtml(trimmed)}</a>${escapeHtml(suffix)}`;
  });
  return output;
}

function splitTableRow(line: string) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
}

function isTableDivider(line: string) {
  const cells = splitTableRow(line);
  return cells.length > 1 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function youtubeEmbed(url: string) {
  const id = youtubeId(url);
  if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return '';
  return `<figure class="article-embed article-embed-youtube"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></figure>`;
}

export function structuredTextToHtml(value: string) {
  const lines = cleanText(value).split('\n');
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) { i += 1; continue; }

    if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      const head = `<thead><tr>${headers.map(cell => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead>`;
      const body = rows.length ? `<tbody>${rows.map(row => `<tr>${headers.map((_, index) => `<td>${inlineMarkdown(row[index] || '')}</td>`).join('')}</tr>`).join('')}</tbody>` : '';
      blocks.push(`<table>${head}${body}</table>`);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length <= 2 ? 2 : 3;
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i += 1;
      }
      blocks.push(`<ul>${items.map(item => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i += 1;
      }
      blocks.push(`<ol>${items.map(item => `<li>${inlineMarkdown(item)}</li>`).join('')}</ol>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quotes: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quotes.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push(`<blockquote><p>${quotes.map(inlineMarkdown).join('<br>')}</p></blockquote>`);
      continue;
    }

    const embed = youtubeEmbed(line);
    if (embed) {
      blocks.push(embed);
      i += 1;
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
    blocks.push(`<p>${paragraph.map(inlineMarkdown).join(' ')}</p>`);
  }

  return blocks.join('\n');
}
