'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Edition, EditionSection, EpaperAd, EpaperFullStory, EditionSummary } from '@/lib/epaper';
import { resizedImage } from '@/lib/image-url';
import { EpaperViewer, PAGE_H, PAGE_W } from './EpaperViewer';
import styles from './Epaper.module.css';

/*
 * Lays every story out in full across fixed-size newspaper pages.
 *
 * Each section starts on a new page. Inside a page the text runs in three
 * balanced columns; each story's headline (and a section lead's photo) runs
 * across all columns. Text that does not fit continues on the next page, split
 * mid-paragraph if needed, with "continued on / from page N" in the page
 * furniture. The browser measures the real text, so nothing is cut off.
 *
 * Measuring happens once, off-screen, at the design size (PAGE_W × PAGE_H). The
 * finished HTML of each page is then shown by the viewer, which only scales it.
 */

const FRONT_FLOW_H = 560;
const PAGE_FLOW_H = 668;
const FULL_PAGE_AD_EVERY = 4;
const HOUSE_HALF_LIMIT = 2;

type Item =
  | { t: 'head'; story: EpaperFullStory; lead: boolean }
  | { t: 'photo'; story: EpaperFullStory; wide: boolean }
  | { t: 'text'; story: EpaperFullStory; k: string; text: string; first: boolean; last: boolean; cont: boolean }
  | { t: 'half'; ad: EpaperAd | null };

type FlowPage = { kind: 'flow'; front: boolean; section: EditionSection; html: string; lastStoryId: string | null; startsWithContinuation: boolean; endsMidStory: boolean };
type BookPage = FlowPage | { kind: 'ad'; ad: EpaperAd | null } | { kind: 'back' };

const dateLabel = (iso: string) => new Intl.DateTimeFormat('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Pacific/Auckland' }).format(new Date(iso));

/* --------------------------------------------------------------- DOM builders (used for measuring and for the final HTML) */

function el(tag: string, cls: string, text?: string) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function img(src: string, alt: string, width: number) {
  const node = document.createElement('img');
  node.src = resizedImage(src, width, 72);
  node.alt = alt;
  node.loading = 'lazy';
  node.decoding = 'async';
  return node;
}

function build(item: Item): HTMLElement {
  switch (item.t) {
    case 'head': {
      const box = el('div', `${styles.it} ${styles.head} ${item.lead ? styles.headLead : ''}`);
      if (item.story.categoryName) box.append(el('span', styles.kick, item.story.categoryName));
      const h = el('h3', styles.headTitle);
      const a = el('a', '', item.story.title) as HTMLAnchorElement;
      a.href = `/${item.story.slug}`;
      h.append(a);
      box.append(h);
      box.append(el('span', styles.by, [item.story.author ? `By ${item.story.author}` : 'Webfit News', dateLabel(item.story.published_at)].join(' · ')));
      return box;
    }
    case 'photo': {
      const fig = el('figure', `${styles.it} ${item.wide ? styles.photoWide : styles.photo}`);
      fig.append(img(item.story.image!, item.story.imageAlt, item.wide ? 1100 : 520));
      return fig;
    }
    case 'text': {
      const tag = item.k === 'h' ? 'h4' : item.k === 'quote' ? 'blockquote' : 'p';
      const cls = [styles.it, styles[`tx_${item.k}`] || styles.tx_p];
      if (item.first && !item.cont) cls.push(styles.dropcap);
      if (item.cont) cls.push(styles.cont);
      if (item.last) cls.push(styles.end);
      return el(tag, cls.join(' '), item.k === 'li' ? `• ${item.text}` : item.text);
    }
    case 'half': {
      if (!item.ad) {
        const box = el('div', `${styles.it} ${styles.halfSlot} ${styles.houseHalfIn}`);
        box.append(el('span', styles.houseKicker, 'Advertise in the e-paper'));
        box.append(el('strong', styles.houseTitleSm, 'Your business could be on this page'));
        box.append(el('span', styles.houseTextSm, 'Full and half pages in every weekly edition, next to the stories Kiwi-Indian families read.'));
        const a = el('a', styles.houseButton, 'Book a page') as HTMLAnchorElement;
        a.href = '/advertise-media-kit';
        box.append(a);
        return box;
      }
      const box = el('div', `${styles.it} ${styles.halfSlot}`);
      box.dataset.adAssignment = item.ad.assignmentId;
      box.append(el('span', styles.adLabel, `Advertisement${item.ad.advertiser ? ` · ${item.ad.advertiser}` : ''}`));
      const a = el('a', styles.adLink) as HTMLAnchorElement;
      a.href = item.ad.href; a.target = '_blank'; a.rel = 'sponsored noopener';
      a.append(img(item.ad.image, item.ad.alt, 1000));
      box.append(a);
      if (item.ad.isElectionAd && item.ad.promoterStatement) box.append(el('span', styles.promoter, item.ad.promoterStatement));
      return box;
    }
  }
}

/* --------------------------------------------------------------- pagination */

function storyItems(story: EpaperFullStory, isSectionLead: boolean, isFront: boolean): Item[] {
  const items: Item[] = [{ t: 'head', story, lead: isSectionLead }];
  if (story.image) items.push({ t: 'photo', story, wide: isSectionLead || isFront });
  const blocks = story.blocks.length ? story.blocks : [{ k: 'p', t: 'Read this story at webfitnews.com.' }];
  blocks.forEach((b, i) => items.push({ t: 'text', story, k: b.k, text: b.t, first: i === 0, last: i === blocks.length - 1, cont: false }));
  return items;
}

function paginate(edition: Edition, host: HTMLElement): FlowPage[] {
  const pages: FlowPage[] = [];
  let halfIndex = 0;
  let houseHalves = 0;

  edition.sections.forEach((section, sIndex) => {
    const isFront = sIndex === 0;
    const queue: Item[] = [];
    section.stories.forEach((story, i) => queue.push(...storyItems(story, i === 0, isFront)));

    let frontUsed = !isFront;
    let box!: HTMLElement;
    let startsWithContinuation = false;

    const open = () => {
      const front = !frontUsed;
      frontUsed = true;
      box = el('div', `${styles.flow}`);
      box.style.height = `${front ? FRONT_FLOW_H : PAGE_FLOW_H}px`;
      box.dataset.front = front ? '1' : '';
      host.replaceChildren(box);
    };
    const fits = () => box.scrollHeight <= box.clientHeight + 1 && box.scrollWidth <= box.clientWidth + 1;
    const close = () => {
      // Never leave a headline (or headline + photo) stranded at the foot of a page.
      const carried: Item[] = [];
      const kids = Array.from(box.children) as HTMLElement[];
      while (kids.length > 1) {
        const last = kids[kids.length - 1];
        const kind = last.dataset.kind;
        if (kind === 'head' || kind === 'photo') {
          carried.unshift(JSON.parse(last.dataset.item!));
          last.remove();
          kids.pop();
        } else break;
      }
      const children = Array.from(box.children) as HTMLElement[];
      const lastStory = [...children].reverse().find(c => c.dataset.story)?.dataset.story || null;
      // Strip measuring-only attributes from the stored HTML.
      for (const c of children) { delete c.dataset.item; delete c.dataset.kind; delete c.dataset.story; }
      pages.push({ kind: 'flow', front: box.dataset.front === '1', section, html: box.innerHTML, lastStoryId: lastStory, startsWithContinuation, endsMidStory: false });
      return carried;
    };

    const stories = new Map(section.stories.map(s => [s.id, s]));
    const revive = (raw: any): Item => ({ ...raw, story: stories.get(raw.storyId)! });
    const place = (item: Item) => {
      const node = build(item);
      if (item.t !== 'half') {
        node.dataset.story = item.story.id;
        node.dataset.kind = item.t;
        if (item.t !== 'text') node.dataset.item = JSON.stringify({ ...item, story: undefined, storyId: item.story.id });
      }
      box.append(node);
      return node;
    };

    open();
    let i = 0;
    let guard = 0;
    while (i < queue.length && guard++ < 20000) {
      const item = queue[i];
      const node = place(item);
      if (fits()) { i += 1; continue; }
      node.remove();
      const onlyItem = box.children.length === 0;

      if (item.t === 'text') {
        const words = item.text.split(' ');
        let lo = 0, hi = words.length - 1, best = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          const trial = place({ ...item, text: words.slice(0, mid).join(' '), last: false });
          const ok = mid > 0 && fits();
          trial.remove();
          if (ok) { best = mid; lo = mid + 1; } else hi = mid - 1;
        }
        if (best >= 4 && words.length - best >= 3) {
          place({ ...item, text: words.slice(0, best).join(' '), last: false });
          const carried = close().map(revive);
          queue.splice(i, 1, ...carried, { ...item, text: words.slice(best).join(' '), first: false, cont: true });
          startsWithContinuation = true;
          open();
          continue;
        }
      }
      if (onlyItem) { place(item); i += 1; continue; } // too big for any page: let it clip rather than loop
      const midStory = item.t === 'text' && !item.first;
      const carried = close().map(revive);
      if (carried.length) queue.splice(i, 0, ...carried);
      startsWithContinuation = midStory;
      open();
    }

    // Fill the space after the section's last story with a half-page ad, if it fits.
    const ad = edition.halfPageAds.length ? edition.halfPageAds[halfIndex % edition.halfPageAds.length] : null;
    if (ad || houseHalves < HOUSE_HALF_LIMIT) {
      const node = place({ t: 'half', ad });
      if (fits()) { if (ad) halfIndex += 1; else houseHalves += 1; }
      else node.remove();
    }
    close();
    startsWithContinuation = false;
  });
  // A page ends mid-story when the next page of the same section picks the story up.
  pages.forEach((p, i) => { const next = pages[i + 1]; p.endsMidStory = Boolean(next && next.section === p.section && next.startsWithContinuation); });
  return pages;
}

function assemble(edition: Edition, flow: FlowPage[]): BookPage[] {
  const out: BookPage[] = [];
  let fullIndex = 0;
  let houseUsed = false;
  flow.forEach((page, i) => {
    out.push(page);
    if (i === 0 || i === flow.length - 1) return;
    if (i % FULL_PAGE_AD_EVERY !== 0) return;
    if (fullIndex < edition.fullPageAds.length) out.push({ kind: 'ad', ad: edition.fullPageAds[fullIndex++] });
    else if (!houseUsed) { houseUsed = true; out.push({ kind: 'ad', ad: null }); }
  });
  out.push({ kind: 'back' });
  return out;
}

/* --------------------------------------------------------------- page chrome (React) */

function Folio({ n, label, note, edition }: { n: number; label: string; note?: string; edition: Edition }) {
  return <div className={styles.folio}>
    <span>{n}</span>
    <span>{note || `Webfit News e-paper · ${label}`}</span>
    <span>{edition.coverage}</span>
  </div>;
}

function FlowPageView({ page, n, edition, contents, nextOf, prevOf }: { page: FlowPage; n: number; edition: Edition; contents: Array<{ title: string; page: number }>; nextOf: number | null; prevOf: number | null }) {
  const continuesTitle = page.endsMidStory && page.lastStoryId ? page.section.stories.find(s => s.id === page.lastStoryId)?.title : null;
  const note = continuesTitle && nextOf ? `“${continuesTitle.length > 48 ? `${continuesTitle.slice(0, 46)}…` : continuesTitle}” continues on page ${nextOf}` : undefined;
  const flow = <div className={styles.flow} style={{ height: page.front ? FRONT_FLOW_H : PAGE_FLOW_H }} dangerouslySetInnerHTML={{ __html: page.html }}/>;

  if (page.front) {
    return <div className={`${styles.page} ${styles.front}`}>
      <header className={styles.masthead}>
        <div className={styles.mastheadTop}>
          <span>{edition.dateline} · Weekly</span>
          <span>{edition.isLive ? 'Live edition · updating as we publish' : edition.title}</span>
          <span>Vol. 1 · No. {edition.number} · Free</span>
        </div>
        <img className={styles.logo} src="/webfit-news-logo-400.webp" alt="Webfit News"/>
        <div className={styles.tagline}>Independent New Zealand journalism · {edition.storyCount} stories this week</div>
        <div className={styles.contentsBar}>
          <strong>Inside</strong>
          {contents.slice(1, 9).map(c => <span key={c.title}>{c.title} <b>{c.page}</b></span>)}
        </div>
      </header>
      {flow}
      <Folio n={n} label="Front page" note={note} edition={edition}/>
    </div>;
  }

  return <div className={styles.page}>
    <header className={styles.pageHead}>
      <span className={styles.pageNo}>{String(n).padStart(2, '0')}</span>
      <div className={styles.pageSection}>
        <strong>{page.section.title}</strong>
        <span>{page.startsWithContinuation && prevOf ? `Continued from page ${prevOf}` : page.section.kicker}</span>
      </div>
      <div className={styles.pageBrand}>
        <img src="/webfit-news-logo-400.webp" alt=""/>
        <span>{edition.dateline}</span>
      </div>
    </header>
    {flow}
    <Folio n={n} label={page.section.title} note={note} edition={edition}/>
  </div>;
}

function AdPageView({ ad, n, edition }: { ad: EpaperAd | null; n: number; edition: Edition }) {
  return <div className={`${styles.page} ${styles.adPage}`}>
    {ad ? <div className={styles.fullAd} data-ad-assignment={ad.assignmentId}>
      <span className={styles.adLabel}>Advertisement{ad.advertiser ? ` · ${ad.advertiser}` : ''}</span>
      <a href={ad.href} target="_blank" rel="sponsored noopener" className={styles.adLink}><img src={resizedImage(ad.image, 1240, 80)} alt={ad.alt} loading="lazy"/></a>
      {ad.isElectionAd && ad.promoterStatement ? <span className={styles.promoter}>{ad.promoterStatement}</span> : null}
    </div> : <div className={styles.houseFull}>
      <span className={styles.houseKicker}>Advertise in the e-paper</span>
      <strong className={styles.houseTitle}>Your business could own this page</strong>
      <p className={styles.houseText}>A full page in the Webfit News weekly e-paper, read by Kiwi-Indian and wider New Zealand communities. Full pages, half pages, section sponsorship and community notices.</p>
      <a href="/advertise-media-kit" className={styles.houseButton}>Book a page</a>
    </div>}
    <Folio n={n} label="Advertisement" edition={edition}/>
  </div>;
}

function BackPageView({ n, edition, shelf }: { n: number; edition: Edition; shelf: EditionSummary[] }) {
  const others = shelf.filter(e => e.key !== edition.key);
  return <div className={`${styles.page} ${styles.backPage}`}>
    <img className={styles.backLogo} src="/webfit-news-logo-400.webp" alt="Webfit News"/>
    <h2 className={styles.backTitle}>Every story, every day, on webfitnews.com</h2>
    <p className={styles.backText}>This e-paper is built from our live newsroom. The current edition always holds the last seven days of reporting and keeps updating as we publish.</p>
    {others.length ? <div className={styles.backEditions}>
      <strong>Other editions</strong>
      <ul>{others.map(e => <li key={e.key}><a href={e.href}>{e.title}</a><span>{e.storyCount} stories</span></li>)}</ul>
    </div> : null}
    <div className={styles.backActions}>
      <a href="/support-us" className={styles.houseButton}>Support independent journalism</a>
      <a href="/advertise-media-kit" className={styles.backSecondary}>Advertise in the e-paper</a>
    </div>
    <Folio n={n} label="Back page" edition={edition}/>
  </div>;
}

/* --------------------------------------------------------------- component */

export function EpaperBook({ edition, shelf }: { edition: Edition; shelf: EditionSummary[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<Array<{ key: string; label: string; node: ReactNode }> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try { await document.fonts?.ready; } catch {}
      const host = hostRef.current;
      if (!host || cancelled) return;
      const flow = paginate(edition, host);
      host.replaceChildren();
      const book = assemble(edition, flow);

      // Page numbers for contents and "continued" notes.
      const firstPageOfSection = new Map<EditionSection, number>();
      book.forEach((p, i) => { if (p.kind === 'flow' && !firstPageOfSection.has(p.section)) firstPageOfSection.set(p.section, i + 1); });
      const contents = edition.sections.map(s => ({ title: s.title, page: firstPageOfSection.get(s) || 0 }));
      const flowIndexes = book.map((p, i) => (p.kind === 'flow' ? i : -1)).filter(i => i >= 0);
      const nextFlow = (i: number) => flowIndexes.find(x => x > i) ?? null;
      const prevFlow = (i: number) => [...flowIndexes].reverse().find(x => x < i) ?? null;

      const rendered = book.map((p, i) => {
        const n = i + 1;
        if (p.kind === 'flow') {
          const nx = nextFlow(i); const pv = prevFlow(i);
          return { key: `p${n}`, label: p.front ? 'Front page' : p.section.title, node: <FlowPageView page={p} n={n} edition={edition} contents={contents} nextOf={nx == null ? null : nx + 1} prevOf={pv == null ? null : pv + 1}/> };
        }
        if (p.kind === 'ad') return { key: `p${n}`, label: 'Advertisement', node: <AdPageView ad={p.ad} n={n} edition={edition}/> };
        return { key: `p${n}`, label: 'Back page', node: <BackPageView n={n} edition={edition} shelf={shelf}/> };
      });
      if (!cancelled) setPages(rendered);
    };
    run();
    return () => { cancelled = true; };
  }, [edition, shelf]);

  return <>
    {/* Off-screen measuring room: same width and styles as a real page. */}
    <div aria-hidden="true" className={styles.measure} style={{ width: PAGE_W, height: PAGE_H }}><div className={styles.page}><div ref={hostRef}/></div></div>
    {pages ? <EpaperViewer pages={pages} title={edition.title}/> : <div className={styles.setting} role="status">Setting this week’s pages…</div>}
  </>;
}
