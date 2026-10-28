/*
 * Clean-up for text pasted into the CMS from chat tools, documents and markdown.
 * Used by the website (sanitizeArticleHtml, on save and on display) and the e-paper (htmlToBlocks).
 *
 *   - Formatting codes some tools leave behind as visible text, e.g. <text color="default">…</text>
 *     or <text weight="medium">…</text> (stored escaped, so readers saw the code). The words are kept.
 *   - Research citation codes such as <Cite refs={["turn158707search3"]}/>: removed entirely.
 *   - Markdown headings typed as text ("## What went wrong?") become real subheadings.
 *   - Tables pasted as lines like "Date| Development" / "21 October 2026| NZQA issues…", one line
 *     per row: two or more consecutive lines with the same number of "|" become a real table,
 *     first line as the header. Markdown divider lines (---|---) are dropped.
 */

/** Remove leftover tool formatting codes (escaped or real), keeping the text inside. */
export function stripPastedCodes(html: string): string {
  return html
    .replace(/\s?&lt;Cite\b[^&]*?\/&gt;/g, '').replace(/\s?<Cite\b[^>]*\/>/g, '')
    .replace(/&lt;\/?(?:text|mark|font|color|highlight)(?:\s[^&]*?)?&gt;/gi, '')
    .replace(/<\/?(?:text|color|highlight)(?:\s[^>]*)?>/gi, '');
}

const BLOCK = /<(div|p)\b[^>]*>((?:(?!<\/?(?:div|p)\b)[\s\S])*?)<\/\1>/gi;
const cellsOf = (inner: string) => {
  const plain = inner.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (!plain.includes('|')) return null;
  const parts = inner.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
  return parts.length >= 2 && parts.every(p => p.replace(/<[^>]+>/g, '').trim().length <= 160) ? parts : null;
};
const isDivider = (cells: string[]) => cells.every(c => /^:?-{2,}:?$/.test(c.replace(/<[^>]+>/g, '').trim()));

/** Turn runs of "a| b" lines into a proper <table>. Leaves single lines and everything else untouched. */
export function pipeLinesToTables(html: string): string {
  const out: string[] = [];
  let last = 0;
  let run: Array<{ start: number; end: number; cells: string[] }> = [];
  const flush = () => {
    const rows = run.filter(r => !isDivider(r.cells));
    const width = rows[0]?.cells.length;
    if (rows.length >= 2 && rows.every(r => r.cells.length === width)) {
      out.push(html.slice(last, run[0].start));
      const [head, ...body] = rows;
      out.push(`<table><thead><tr>${head.cells.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${body.map(r => `<tr>${r.cells.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      last = run[run.length - 1].end;
    }
    run = [];
  };
  for (const m of html.matchAll(BLOCK)) {
    const start = m.index!, end = start + m[0].length;
    const cells = cellsOf(m[2]);
    if (cells && run.length && html.slice(run[run.length - 1].end, start).trim() === '') run.push({ start, end, cells });
    else { if (run.length) flush(); if (cells) run.push({ start, end, cells }); }
  }
  if (run.length) flush();
  out.push(html.slice(last));
  return out.join('');
}

/** "## Heading" / "### Heading" typed as a paragraph becomes a real h2 / h3. */
export function markdownHeadings(html: string): string {
  return html.replace(/<(p|div)>\s*(#{2,3})\s+([^<#][^<]*?)\s*<\/\1>/g, (_, _t, hashes: string, text: string) => (hashes.length === 2 ? `<h2>${text}</h2>` : `<h3>${text}</h3>`));
}

export function cleanPastedText(html: string): string {
  return pipeLinesToTables(markdownHeadings(stripPastedCodes(html || '')));
}
