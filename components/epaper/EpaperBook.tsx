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

function img(src: string, alt: string, width: number, ratio?: [number, number]) {
  const node = document.createElement('img');
  // Intrinsic size up front so the space is reserved before the photo loads (older Safari ignores aspect-ratio).
  if (ratio) { node.width = ratio[0]; node.height = ratio[1]; }
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
      fig.append(img(item.story.image!, item.story.imageAlt, item.wide ? 1100 : 520, item.wide ? [1200, 500] : [400, 300]));
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
        box.append(el('span', styles.houseTextSm, 'Full and half pages in every edition, next to the stories Kiwi-Indian families read.'));
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

/* --------------------------------------------------------------- pagination
 *
 * Each page is a vertical stack of:
 *   - full-width pieces (headline, wide photo, half-page ad), and
 *   - "bands" of three fixed-height columns holding a story's text.
 * Every column is its own box with a fixed height, and we check it with
 * scrollHeight — no CSS multi-column, which Safari measures and draws
 * differently (that is what cropped text at the foot of columns).
 */

const COLS = 3;
const MIN_TEXT_AFTER_HEAD = 50;

function storyItems(story: EpaperFullStory, isSectionLead: boolean, isFront: boolean): Item[] {
  const items: Item[] = [{ t: 'head', story, lead: isSectionLead }];
  if (story.image) items.push({ t: 'photo', story, wide: isSectionLead || isFront });
  const blocks = story.blocks.length ? story.blocks : [{ k: 'p', t: 'Read this story at webfitnews.com.' }];
  blocks.forEach((b, i) => items.push({ t: 'text', story, k: b.k, text: b.t, first: i === 0, last: i === blocks.length - 1, cont: false }));
  return items;
}

const isSpan = (it: Item) => it.t === 'head' || it.t === 'half' || (it.t === 'photo' && it.wide);
const overflows = (node: HTMLElement) => node.scrollHeight > node.clientHeight + 1;

type Flowed = { band: HTMLElement; rest: Item[]; endsStory: boolean };

/** Pour column items into three columns of height h. Splits paragraphs between columns. */
function flowColumns(items: Item[], h: number, parent: HTMLElement): Flowed {
  const band = el('div', styles.band);
  band.style.height = `${h}px`;
  parent.append(band); // must be in the document to be measured
  const cols = Array.from({ length: COLS }, () => { const c = el('div', styles.col); c.style.height = `${h}px`; band.append(c); return c; });
  const queue = [...items];
  let ci = 0;
  let lastPlaced: Item | null = null;
  while (queue.length && ci < COLS) {
    const col = cols[ci];
    const item = queue[0];
    const node = build(item);
    col.append(node);
    if (!overflows(col)) { queue.shift(); lastPlaced = item; continue; }
    node.remove();
    if (item.t === 'text') {
      const words = item.text.split(' ');
      let lo = 1, hi = words.length - 1, best = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const trial = build({ ...item, text: words.slice(0, mid).join(' '), last: false });
        col.append(trial);
        const ok = !overflows(col);
        trial.remove();
        if (ok) { best = mid; lo = mid + 1; } else hi = mid - 1;
      }
      if (best >= 3 && words.length - best >= 2) {
        col.append(build({ ...item, text: words.slice(0, best).join(' '), last: false }));
        queue[0] = { ...item, text: words.slice(best).join(' '), first: false, cont: true };
        lastPlaced = null;
      }
    } else if (!col.children.length && ci === COLS - 1 && h >= 300) {
      // A photo taller than a whole column: shrink it into the column rather than loop.
      node.style.maxHeight = `${h}px`;
      node.style.marginBottom = '0';
      col.append(node);
      queue.shift();
      lastPlaced = item;
    }
    ci += 1;
  }
  band.remove();
  return { band, rest: queue, endsStory: !queue.length && Boolean(lastPlaced && lastPlaced.t === 'text' && lastPlaced.last) };
}

function paginate(edition: Edition, host: HTMLElement): { pages: FlowPage[]; dropped: Array<{ title: string; slug: string }> } {
  const pages: FlowPage[] = [];
  let halfIndex = 0;
  let houseHalves = 0;
  const placed = new Set<string>();
  const shortTries = new Map<string, number>();

  // 12 pages in all: front, desk pages, full-page ads, back.
  const STORY_PAGES = EDITION_PAGES - 2 - adPlan(edition).length;
  // Page quota per desk: STORY_PAGES shared out in proportion to each desk's stories (at least one each).
  const deskSizes = edition.sections.map((sec, i) => (i === 0 ? 0 : sec.stories.length));
  const totalStories = deskSizes.reduce((a, b) => a + b, 0) || 1;
  const quotas = edition.sections.map((_, i) => (i === 0 ? 1 : 1));
  let left = STORY_PAGES - (edition.sections.length - 1);
  const want = deskSizes.map(n => (STORY_PAGES * n) / totalStories - 1);
  while (left > 0) {
    let best = -1;
    want.forEach((w, i) => { if (i > 0 && (best < 0 || w - quotas[i] > want[best] - quotas[best])) best = i; });
    if (best < 0) break;
    quotas[best] += 1;
    left -= 1;
  }

  edition.sections.forEach((section, sIndex) => {
    const quota = quotas[sIndex];
    let pageNo = 0;
    let snap: { children: number; page: number; storyId: string } | null = null;
    const isFront = sIndex === 0;
    const queue: Item[] = [];
    section.stories.forEach((story, i) => queue.push(...storyItems(story, i === 0, isFront)));

    let frontUsed = !isFront;
    let flow!: HTMLElement;
    let H = PAGE_FLOW_H;
    let startsWithContinuation = false;
    let lastStoryId: string | null = null;

    const open = (continuation: boolean) => {
      const front = !frontUsed;
      frontUsed = true;
      H = front ? FRONT_FLOW_H : PAGE_FLOW_H;
      flow = el('div', styles.flow);
      flow.style.height = `${H}px`;
      flow.dataset.front = front ? '1' : '';
      host.replaceChildren(flow);
      startsWithContinuation = continuation;
    };
    const used = () => Array.from(flow.children).reduce((sum, c) => {
      const cs = getComputedStyle(c as HTMLElement);
      return sum + (c as HTMLElement).offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
    }, 0);
    const close = (endsMidStory: boolean) => {
      if (!flow.children.length) return;
      pages.push({ kind: 'flow', front: flow.dataset.front === '1', section, html: flow.innerHTML, lastStoryId, startsWithContinuation, endsMidStory });
    };

    // Move to the next page of this desk. On the desk's last page, a story that
    // started on this page is taken out again (it goes to the back-page list).
    const nextPage = (midStory: boolean) => {
      if (pageNo + 1 >= quota) {
        if (snap && snap.page === pageNo && snap.children > 0) {
          while (flow.children.length > snap.children) flow.lastElementChild!.remove();
          placed.delete(snap.storyId);
          const id = snap.storyId;
          const story = section.stories.find(st => st.id === id)!;
          let firstIdx = queue.findIndex(q => (q as any).story?.id === id);
          for (let i = queue.length - 1; i >= 0; i -= 1) if ((queue[i] as any).story?.id === id) queue.splice(i, 1);
          if (firstIdx < 0) firstIdx = 0;
          snap = null;
          // Room left on the page: print a shorter version of the story there instead of leaving it blank.
          const tries = (shortTries.get(id) || 0) + 1;
          shortTries.set(id, tries);
          const textBlocks = story.blocks.filter(bk => !/^Read the full story at /.test(bk.t));
          const keep = Math.max(1, Math.floor(textBlocks.length / (2 ** tries)));
          if (H - used() >= 150 && tries <= 4) {
            const short: EpaperFullStory = { ...story, image: tries > 1 ? null : story.image, blocks: [...textBlocks.slice(0, keep), { k: 'p' as const, t: `Read the full story at webfitnews.com/${story.slug}` }] };
            queue.splice(firstIdx, 0, ...storyItems(short, false, false));
          }
          return 'skip' as const;
        }
        if (pageNo + 1 >= quota + 1) { queue.length = 0; return false; }
      }
      close(midStory);
      pageNo += 1;
      open(midStory);
      return true;
    };

    open(false);
    let guard = 0;
    while (queue.length && guard++ < 5000) {
      const item = queue[0];
      if (item.t === 'head') {
        if (pageNo >= quota) break; // spilled past the quota finishing a story: start nothing new
        snap = { children: flow.children.length, page: pageNo, storyId: item.story.id };
        placed.add(item.story.id);
      }

      if (isSpan(item)) {
        // Headline (with its wide photo) must have room for some text under it.
        const group: Item[] = [item];
        if (item.t === 'head' && queue[1]?.t === 'photo' && (queue[1] as any).wide) group.push(queue[1]);
        const nodes = group.map(g => { const n = build(g); flow.append(n); return n; });
        const needsText = item.t === 'head';
        // A narrow photo follows in the first column: keep room for it plus a few lines.
        const narrowPhotoNext = queue[group.length]?.t === 'photo';
        const minAfter = narrowPhotoNext ? 175 : MIN_TEXT_AFTER_HEAD;
        let fits = !overflows(flow) && (!needsText || H - used() >= minAfter);
        if (!fits && narrowPhotoNext && !overflows(flow) && H - used() >= MIN_TEXT_AFTER_HEAD + 30) {
          // Not enough room for the photo up top: start the text here and run the photo further down.
          const photoAt = group.length;
          const [photo] = queue.splice(photoAt, 1);
          let at = photoAt, paras = 0;
          while (at < queue.length && queue[at].t === 'text' && paras < 2) { at += 1; paras += 1; }
          queue.splice(at, 0, photo);
          fits = true;
        }
        if (fits || flow.children.length === nodes.length) {
          if (!fits) nodes.forEach(n => { n.style.maxHeight = `${Math.max(60, H - 120)}px`; n.style.overflow = 'hidden'; });
          queue.splice(0, group.length);
          if (item.t !== 'half') lastStoryId = item.story.id;
          continue;
        }
        nodes.forEach(n => n.remove());
        const r1 = nextPage(false);
        if (!r1) break;
        continue;
      }

      // A run of column items: one story's body (and its narrow photo).
      let n = 0;
      while (n < queue.length && !isSpan(queue[n])) n += 1;
      const run = queue.slice(0, n);
      const R = Math.floor(H - used()) - 2;
      if (R < 40) { const r2 = nextPage(true); if (!r2) break; continue; }

      const full = flowColumns(run, R, flow);
      if (full.rest.length) {
        flow.append(full.band);
        lastStoryId = run[0].t === 'half' ? lastStoryId : (run[0] as any).story.id;
        queue.splice(0, n, ...full.rest);
        const r3 = nextPage(true);
        if (!r3) break;
        continue;
      }
      // It all fits: find the shortest column height that still holds it (balanced columns).
      let lo = 20, hi = R, best = full;
      while (hi - lo > 3) {
        const mid = Math.floor((lo + hi) / 2);
        const trial = flowColumns(run, mid, flow);
        if (trial.rest.length) lo = mid + 1; else { hi = mid; best = trial; }
      }
      best.band.classList.add(styles.bandEnd);
      flow.append(best.band);
      lastStoryId = (run[0] as any).story?.id || lastStoryId;
      queue.splice(0, n);
    }

    // Fill the space after the section's last story with a half-page ad, if it fits.
    const ad = edition.halfPageAds.length ? edition.halfPageAds[halfIndex % edition.halfPageAds.length] : null;
    if (ad || houseHalves < HOUSE_HALF_LIMIT) {
      const node = build({ t: 'half', ad });
      flow.append(node);
      if (!overflows(flow)) { if (ad) halfIndex += 1; else houseHalves += 1; }
      else node.remove();
    }
    close(false);
  });
  const dropped = edition.sections.flatMap(sec => sec.stories).filter(st => !placed.has(st.id)).map(st => ({ title: st.title, slug: st.slug }));
  return { pages, dropped };
}

/**
 * Full-page ads sit at fixed page numbers: the highest-priority booking on page 2,
 * the next on page 6. With no bookings, one "advertise here" page goes on page 6.
 */
const AD_PAGE_NUMBERS = [2, 6];
/** Pages in every edition, counting the front page, ad pages and back page. */
const EDITION_PAGES = 12;

function adPlan(edition: Edition): Array<{ at: number; ad: EpaperAd | null }> {
  const booked = edition.fullPageAds.slice(0, AD_PAGE_NUMBERS.length);
  if (!booked.length) return [{ at: AD_PAGE_NUMBERS[AD_PAGE_NUMBERS.length - 1], ad: null }];
  return booked.map((ad, i) => ({ at: AD_PAGE_NUMBERS[i], ad }));
}

function assemble(edition: Edition, flow: FlowPage[]): BookPage[] {
  const out: BookPage[] = [...flow];
  for (const { at, ad } of adPlan(edition)) out.splice(Math.min(at - 1, out.length), 0, { kind: 'ad', ad });
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
          <span>{edition.dateline} · Twice weekly</span>
          <span>{edition.isLive ? 'Live edition · updating as we publish' : edition.title}</span>
          <span>Vol. 1 · No. {edition.number} · Free</span>
        </div>
        <img className={styles.logo} src="/webfit-news-logo-400.webp" alt="Webfit News"/>
        <div className={styles.tagline}>Independent New Zealand journalism · {edition.storyCount} stories in this edition</div>
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
      <p className={styles.houseText}>A full page in the Webfit News e-paper, read twice a week by Kiwi-Indian and wider New Zealand communities. Full pages, half pages, section sponsorship and community notices.</p>
      <a href="/advertise-media-kit" className={styles.houseButton}>Book a page</a>
    </div>}
    <Folio n={n} label="Advertisement" edition={edition}/>
  </div>;
}

function BackPageView({ n, edition, shelf, extra }: { n: number; edition: Edition; shelf: EditionSummary[]; extra: Array<{ title: string; slug: string }> }) {
  const others = shelf.filter(e => e.key !== edition.key);
  const all = [...extra, ...edition.moreStories];
  const more = all.slice(0, 14);
  return <div className={`${styles.page} ${styles.backPage} ${more.length ? styles.backPageList : ''}`}>
    <img className={styles.backLogo} src="/webfit-news-logo-400.webp" alt="Webfit News"/>
    {more.length ? <div className={styles.backMore}>
      <strong>Also this edition on webfitnews.com</strong>
      <ul>{more.map(s => <li key={s.slug}><a href={`/${s.slug}`}>{s.title}</a></li>)}</ul>
      {all.length > more.length ? <span>…and {all.length - more.length} more at webfitnews.com</span> : null}
    </div> : <>
      <h2 className={styles.backTitle}>Every story, every day, on webfitnews.com</h2>
      <p className={styles.backText}>New editions arrive every Monday and Thursday, and the current one keeps updating as we publish.</p>
    </>}
    {others.length ? <div className={styles.backEditions}>
      <strong>Other editions</strong>
      <ul>{others.slice(0, 3).map(e => <li key={e.key}><a href={e.href}>{e.title} · {e.coverage}</a><span>{e.storyCount} stories</span></li>)}</ul>
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
      const { pages: flow, dropped } = paginate(edition, host);
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
        return { key: `p${n}`, label: 'Back page', node: <BackPageView n={n} edition={edition} shelf={shelf} extra={dropped}/> };
      });
      if (!cancelled) setPages(rendered);
    };
    run();
    return () => { cancelled = true; };
  }, [edition, shelf]);

  return <>
    {/* Off-screen measuring room: same width and styles as a real page. */}
    <div aria-hidden="true" className={styles.measure} style={{ width: PAGE_W, height: PAGE_H }}><div className={styles.page}><div ref={hostRef}/></div></div>
    {pages ? <EpaperViewer pages={pages} title={`Webfit News e-paper · ${edition.title} · ${edition.coverage}`} shareHref={edition.href}/> : <div className={styles.setting} role="status">Setting this week’s pages…</div>}
  </>;
}
