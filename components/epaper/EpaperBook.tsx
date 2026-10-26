'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import type { Edition, EditionSection, EpaperAd, EpaperFullStory, EditionSummary } from '@/lib/epaper';
import { resizedImage } from '@/lib/image-url';
import { EpaperViewer, PAGE_H, PAGE_W } from './EpaperViewer';
import { StoryReader, type ReaderStory } from './StoryReader';
import { Puzzles } from './Puzzles';
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

const FRONT_FLOW_H = 534; // leaves room for the "Inside this week" teasers under the masthead
const PAGE_FLOW_H = 668;
const HOUSE_HALF_LIMIT = 2;

type Item =
  | { t: 'head'; story: EpaperFullStory; lead: boolean; front?: boolean }
  | { t: 'photo'; story: EpaperFullStory; wide: boolean; front: boolean }
  | { t: 'text'; story: EpaperFullStory; k: string; text: string; first: boolean; last: boolean; cont: boolean }
  | { t: 'half'; ad: EpaperAd | null }
  | { t: 'note'; text: string; author: string | null };

type FlowPage = { kind: 'flow'; front: boolean; section: EditionSection; html: string; lastStoryId: string | null; startsWithContinuation: boolean; endsMidStory: boolean; newsH: number };
type BookPage = FlowPage | { kind: 'house' } | { kind: 'shared'; ads: EpaperAd[] } | { kind: 'almanac' } | { kind: 'back' };

/*
 * Paid ads sit inside news pages, the way a printed paper does it: the ad takes
 * the lower part of the page and the stories run above it and beside it.
 *   - Every ad sits in a framed box across the foot of the page, news above it.
 *   - One poster is centred in the box; two posters (shared bookings) sit side by side.
 * One ad block per page, spread through the news pages. The only full-page ad
 * is our own "Advertise with Webfit News" page on page 2.
 */
/** forFront: the front page's strip of business posters (reserved before the inside pages are paired up). */
type AdBlock = { id: string; ads: EpaperAd[]; ratios: number[]; full: boolean; w: number; h: number; artH: number; forFront?: boolean };

const FLOW_W = 516;
const AD_MAX_ART_H = 300; // two tall portrait posters side by side stop here, leaving room for the page's story

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

/** Our own "advertise here" panel, used to fill the second half of the foot of a page. */
const HOUSE_AD: EpaperAd = { assignmentId: 'house', href: '/advertise-media-kit', image: '', alt: 'Advertise in the Webfit News e-paper', advertiser: null, isElectionAd: false, promoterStatement: null, cta: null };

function buildAdBlock(block: AdBlock): HTMLElement {
  // As in a printed paper: the ads fill the foot of the page, each in its own ruled frame.
  const box = el('aside', styles.adBlock);
  box.style.height = `${block.h}px`;
  box.setAttribute('aria-label', block.ads.length > 1 ? 'Advertisements' : 'Advertisement');
  block.ads.forEach((ad, i) => {
    const w = Math.round(block.artH * block.ratios[i]);
    const fig = el('figure', styles.adFrame);
    fig.style.width = `${w + AD_FRAME}px`;
    if (ad.assignmentId === 'house') {
      fig.classList.add(styles.adFrameHouse);
      fig.style.height = `${block.h}px`;
      const inner = el('a', styles.adHouse) as HTMLAnchorElement;
      inner.href = ad.href!;
      inner.append(el('img', '') as HTMLImageElement);
      (inner.firstChild as HTMLImageElement).src = '/icon-192.png';
      (inner.firstChild as HTMLImageElement).alt = '';
      inner.append(el('strong', '', 'Advertise with Webfit News'));
      inner.append(el('span', '', 'Your business could be here, next to the stories our readers come for.'));
      inner.append(el('b', '', 'Book a spot →'));
      fig.append(inner);
      box.append(fig);
      return;
    }
    fig.dataset.adAssignment = ad.assignmentId;
    const a = el(ad.href ? 'a' : 'div', styles.adBlockArt) as HTMLAnchorElement;
    if (ad.href) { a.href = ad.href; a.target = '_blank'; a.rel = 'sponsored noopener'; }
    const im = img(ad.image, ad.alt, 900);
    im.style.height = `${block.artH}px`;
    im.style.width = `${w}px`;
    a.append(im);
    fig.append(a);
    if (ad.isElectionAd && ad.promoterStatement) fig.append(el('span', styles.promoter, ad.promoterStatement));
    box.append(fig);
  });
  return box;
}

/**
 * Size an ad block from the artwork's real shape (posters are never cropped).
 * Like the printed papers: a landscape ad runs the full width of the page foot;
 * portrait posters go two side by side, filling the width.
 */
const AD_FRAME = 10; // 4px padding + 1px rule, each side
const AD_GAP = 12;
function makeBlock(ads: EpaperAd[], ratios: number[], maxArtH?: number): AdBlock {
  const hasPromoter = ads.some(a => a.isElectionAd && a.promoterStatement);
  const extra = AD_FRAME + (hasPromoter ? 18 : 0);
  const each = (FLOW_W - AD_GAP * (ads.length - 1)) / ads.length - AD_FRAME;
  const cap = maxArtH ?? (ads.length === 1 ? 300 : AD_MAX_ART_H);
  const artH = Math.round(Math.min(cap, ...ratios.map(r => each / r)));
  return { id: ads.map(a => a.assignmentId).join('+'), ads, ratios, full: true, w: FLOW_W, h: artH + extra, artH };
}

function artRatio(src: string): Promise<number> {
  return new Promise(resolve => {
    const im = new Image();
    const done = (r: number) => { clearTimeout(t); resolve(r); };
    const t = setTimeout(() => done(0.8), 4000);
    im.onload = () => done(im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 0.8);
    im.onerror = () => done(0.8);
    im.src = resizedImage(src, 900, 82);
  });
}

/**
 * Paid bookings as ad blocks, most important first. A landscape ad gets the page
 * foot to itself; portrait posters are paired two to a page (never two election
 * ads together), and a poster left over is paired with our own "advertise here" panel.
 */
const political = (b: AdBlock) => b.ads.some(a => a.isElectionAd);

async function adBlocks(edition: Edition): Promise<AdBlock[]> {
  const all = [...edition.fullPageAds, ...edition.sharedPageAds, ...edition.halfPageAds];
  const ratios = await Promise.all(all.map(a => artRatio(a.image)));
  const used = new Set<number>();
  const out: AdBlock[] = [];
  // The front page strip comes first: up to three business posters (never election ads), shared-page
  // bookings first, then the rest by priority. Reserved before pairing, so election bookings paired
  // with business posters can't leave the front with only one ad.
  const front: number[] = [];
  for (const ad of [...edition.sharedPageAds, ...edition.fullPageAds, ...edition.halfPageAds]) {
    if (front.length >= 3) break;
    const i = all.indexOf(ad);
    if (i >= 0 && !ad.isElectionAd && ratios[i] < 1.3) front.push(i);
  }
  if (front.length) {
    front.forEach(i => used.add(i));
    out.push({ ...makeBlock(front.map(i => all[i]), front.map(i => ratios[i]), FRONT_AD_ART_H), forFront: true });
  }
  all.forEach((ad, i) => {
    if (used.has(i)) return;
    used.add(i);
    if (ratios[i] >= 1.3) { out.push(makeBlock([ad], [ratios[i]])); return; }
    const j = all.findIndex((o, k) => !used.has(k) && ratios[k] < 1.3 && !(o.isElectionAd && ad.isElectionAd));
    if (j >= 0) { used.add(j); out.push(makeBlock([ad, all[j]], [ratios[i], ratios[j]])); }
    else out.push(makeBlock([ad, HOUSE_AD], [ratios[i], ratios[i]]));
  });
  // Keep election ads apart: never on facing pages, so no two in neighbouring blocks.
  for (let i = 1; i < out.length; i += 1) {
    if (out[i].forFront || out[i - 1].forFront) continue;
    if (!political(out[i]) || !political(out[i - 1])) continue;
    const k = out.findIndex((b, x) => x > i && !political(b));
    if (k > 0) [out[i], out[k]] = [out[k], out[i]];
  }
  return out;
}

function build(item: Item): HTMLElement {
  switch (item.t) {
    case 'head': {
      // headFront is a class on the headline itself (not a page ancestor), so it measures the same off-screen as on the page.
      const box = el('div', `${styles.it} ${styles.head} ${item.lead ? styles.headLead : ''} ${item.front ? styles.headFront : ''}`);
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
      const ratio = photoRatio(item.story.imageRatio, item.front ? 'front' : item.wide ? 'wide' : 'narrow');
      const node = img(item.story.image!, item.story.imageAlt, item.wide ? 1100 : 520, [1200, Math.round(1200 / ratio)]);
      node.style.aspectRatio = String(ratio);
      // Only if the frame is shorter than the photo is anything cut, and then mostly from the bottom: heads stay in.
      node.style.objectPosition = '50% 22%';
      fig.dataset.story = item.story.id;
      fig.append(node);
      return fig;
    }
    case 'text': {
      const tag = item.k === 'h' ? 'h4' : item.k === 'quote' ? 'blockquote' : 'p';
      const cls = [styles.it, styles[`tx_${item.k}`] || styles.tx_p];
      if (item.first && !item.cont) cls.push(styles.dropcap);
      if (item.cont) cls.push(styles.cont);
      if (item.last) cls.push(styles.end);
      if (/^Read the full story at /.test(item.text)) cls.push(styles.readMore);
      return el(tag, cls.join(' '), item.k === 'li' ? `• ${item.text}` : item.text);
    }
    case 'note': {
      // The editor's weekly note, boxed across the top of page 2.
      const box = el('aside', `${styles.it} ${styles.editorNote}`);
      box.append(el('span', styles.editorNoteLabel, 'From the editor'));
      const body = el('div', styles.editorNoteBody);
      item.text.split(/\n{2,}|\r?\n/).map(t => t.trim()).filter(Boolean).forEach(t => body.append(el('p', '', t)));
      box.append(body);
      if (item.author) box.append(el('span', styles.editorNoteSign, `— ${item.author}`));
      return box;
    }
    case 'half': {
      if (!item.ad) {
        const box = el('div', `${styles.it} ${styles.halfSlot} ${styles.houseHalfIn}`);
        box.append(el('span', styles.houseKicker, 'Advertise in the e-paper'));
        box.append(el('strong', styles.houseTitleSm, 'Your business could be on this page'));
        box.append(el('span', styles.houseTextSm, 'Poster and banner spots in every edition, right next to the stories our readers come for.'));
        const a = el('a', styles.houseButton, 'Book a page') as HTMLAnchorElement;
        a.href = '/advertise-media-kit';
        box.append(a);
        return box;
      }
      const box = el('div', `${styles.it} ${styles.halfSlot}`);
      box.dataset.adAssignment = item.ad.assignmentId;
      box.append(el('span', styles.adLabel, `${item.ad.isElectionAd ? 'Election advertisement' : 'Advertisement'}${item.ad.advertiser ? ` · ${item.ad.advertiser}` : ''}`));
      const a = el(item.ad.href ? 'a' : 'div', styles.adLink) as HTMLAnchorElement;
      if (item.ad.href) { a.href = item.ad.href; a.target = '_blank'; a.rel = 'sponsored noopener'; }
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

/**
 * Frame shape (width ÷ height) for a story photo: the photo's own shape, so
 * nothing is cropped, kept within limits so a tall photo can't swallow a page.
 * Only photos taller than the limit lose a strip, and objectPosition keeps
 * the top (faces) in view. Unknown size → 16:9 / 4:3.
 */
const PHOTO_LIMITS = { front: [2.1, 2.8], wide: [1.5, 2.6], narrow: [0.9, 1.8] } as const;
function photoRatio(natural: number | null | undefined, kind: keyof typeof PHOTO_LIMITS) {
  const [min, max] = PHOTO_LIMITS[kind];
  const r = natural && Number.isFinite(natural) ? natural : kind === 'narrow' ? 4 / 3 : 16 / 9;
  return Math.min(max, Math.max(min, r));
}

function storyItems(story: EpaperFullStory, isSectionLead: boolean, isFront: boolean): Item[] {
  const items: Item[] = [{ t: 'head', story, lead: isSectionLead, front: isFront }];
  if (story.image) items.push({ t: 'photo', story, wide: isSectionLead || isFront, front: isFront });
  const blocks = story.blocks.length ? story.blocks : [{ k: 'p', t: 'Read this story at webfitnews.com.' }];
  blocks.forEach((b, i) => items.push({ t: 'text', story, k: b.k, text: b.t, first: i === 0, last: i === blocks.length - 1, cont: false }));
  return items;
}

const isSpan = (it: Item) => it.t === 'head' || it.t === 'half' || it.t === 'note' || (it.t === 'photo' && it.wide);
const overflows = (node: HTMLElement) => node.scrollHeight > node.clientHeight + 1;

type Flowed = { band: HTMLElement; rest: Item[]; endsStory: boolean };

/** Pour column items into three columns of height h. Splits paragraphs between columns. */
function flowColumns(items: Item[], h: number, parent: HTMLElement, sideLimit = Infinity): Flowed {
  const band = el('div', styles.band);
  band.style.height = `${h}px`;
  parent.append(band); // must be in the document to be measured
  // With an ad in the lower right, columns 2 and 3 stop at the top of the ad.
  const ch = (i: number) => (i === 0 ? h : Math.max(0, Math.min(h, sideLimit)));
  const cols = Array.from({ length: COLS }, (_, i) => { const c = el('div', styles.col); c.style.height = `${ch(i)}px`; band.append(c); return c; });
  const queue = [...items];
  let ci = 0;
  let lastPlaced: Item | null = null;
  while (queue.length && ci < COLS) {
    const col = cols[ci];
    const item = queue[0];
    const node = build(item);
    col.append(node);
    if (!overflows(col)) {
      // A subheading needs a couple of lines under it in the same column, or it moves on.
      const room = ch(ci) - (node.offsetTop - col.offsetTop + node.offsetHeight);
      if (item.t === 'text' && item.k === 'h' && queue.length > 1 && room < 30 && col.children.length > 1) { node.remove(); ci += 1; continue; }
      queue.shift(); lastPlaced = item; continue;
    }
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
      // A paragraph that is only a word or two too long for the column used to be
      // skipped entirely, leaving the column empty. Carry at least two words over instead.
      // Subheadings and the "Read the full story at …" line are never split across columns.
      const take = /^Read the full story at /.test(item.text) || item.k === 'h' ? 0 : Math.min(best, words.length - 2);
      if (take >= 3) {
        col.append(build({ ...item, text: words.slice(0, take).join(' '), last: false }));
        queue[0] = { ...item, text: words.slice(take).join(' '), first: false, cont: true };
        lastPlaced = null;
      }
    } else if (!col.children.length && ci === COLS - 1 && ch(ci) >= 300) {
      // A photo taller than a whole column: shrink it into the column rather than loop.
      node.style.maxHeight = `${ch(ci)}px`;
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

function paginate(edition: Edition, host: HTMLElement, allBlocks: AdBlock[], NEWS_PAGES: number): { pages: FlowPage[]; dropped: Array<{ title: string; slug: string }>; unplaced: AdBlock[] } {
  const pages: FlowPage[] = [];
  let houseHalves = 0;
  // The front page carries a strip of up to three posters at its foot, taken from the most important
  // non-election bookings (election ads stay off the front, next to whatever the lead story is).
  const frontBlock = allBlocks.find(b => b.forFront) || null; // reserved in adBlocks()
  const blocks = allBlocks.filter(b => !b.forFront);
  // Which news page each other ad block aims for: spread evenly over the desk pages.
  // Pages 1 to AD_FREE_PAGES (after the front) are news only; ads are spread over the news pages after them.
  const adPages = NEWS_PAGES + 1 - AD_FREE_PAGES;
  const targets = blocks.slice(0, adPages).map((b, i) => ({ block: b, at: AD_FREE_PAGES + Math.floor((i * adPages) / Math.min(blocks.length, adPages)) }));
  const placedBlocks = new Set<string>();
  // Pages that went out carrying an election ad: the next page never carries another one
  // (every election poster is paired with a business poster, so the block order alone can't keep them apart).
  const electionPages = new Set<number>();
  const placed = new Set<string>();
  const shortTries = new Map<string, number>();

  // TOTAL_PAGES in all: front, desk pages, back page, our advertising page.
  const STORY_PAGES = NEWS_PAGES;
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
    // The editor's note opens the first news page after the front.
    if (sIndex === 1 && edition.front?.note) queue.push({ t: 'note', text: edition.front.note.text, author: edition.front.note.author });
    section.stories.forEach((story, i) => queue.push(...storyItems(story, i === 0, isFront)));

    let frontUsed = !isFront;
    let flow!: HTMLElement;
    let H = PAGE_FLOW_H;
    let block: AdBlock | null = null;
    let Htop = H; // headlines, wide photos and columns 2–3 stay above this line
    let startsWithContinuation = false;
    let lastStoryId: string | null = null;
    let pageLeadDone = false; // the first story to start on a page is that page's main story

    const open = (continuation: boolean) => {
      const front = !frontUsed;
      frontUsed = true;
      H = front ? FRONT_FLOW_H : PAGE_FLOW_H;
      const afterElection = electionPages.has(pages.length - 1);
      block = front ? frontBlock : targets.find(t => t.at <= pages.length && !placedBlocks.has(t.block.id) && !(afterElection && political(t.block)))?.block || null;
      if (block) placedBlocks.add(block.id);
      Htop = block ? H - block.h - 18 : H; // room for the news box rule and a gap above the ads
      flow = el('div', styles.flow);
      flow.style.height = `${H}px`;
      flow.dataset.front = front ? '1' : '';
      host.replaceChildren(flow);
      startsWithContinuation = continuation;
      pageLeadDone = false;
    };
    const used = () => Array.from(flow.children).reduce((sum, c) => {
      const cs = getComputedStyle(c as HTMLElement);
      return sum + (c as HTMLElement).offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
    }, 0);
    const close = (endsMidStory: boolean) => {
      if (!flow.children.length) { if (block) placedBlocks.delete(block.id); return; }
      // The news sits in its own ruled box: down to the ad (or our panel), or to the end of the text.
      const house = flow.querySelector(`.${styles.houseHalfIn}`);
      const textEnd = Array.from(flow.children).filter(c => c !== house).reduce((m, c) => Math.max(m, (c as HTMLElement).offsetTop + (c as HTMLElement).offsetHeight), 0);
      const newsH = block ? Htop : house ? H - 260 : Math.min(H, Math.ceil(textEnd));
      if (block) flow.append(buildAdBlock(block));
      if (block && political(block)) electionPages.add(pages.length);
      pages.push({ kind: 'flow', front: flow.dataset.front === '1', section, html: flow.innerHTML, lastStoryId, startsWithContinuation, endsMidStory, newsH });
    };

    // Move to the next page of this desk. On the desk's last page, a story that
    // started on this page is taken out again (it goes to the back-page list).
    const nextPage = (midStory: boolean) => {
      if (pageNo + 1 >= quota) {
        // The front page always finishes its story on the front: shorten it rather than run on to a near-empty page 2.
        if (snap && snap.page === pageNo && (snap.children > 0 || isFront)) {
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
          // Front page: drop one paragraph at a time and keep the photo. Elsewhere: halve it.
          const keep = isFront ? Math.max(1, textBlocks.length - tries) : Math.max(1, Math.floor(textBlocks.length / (2 ** tries)));
          // Last resort on the front: one paragraph and no photo, so the front never goes out without its story.
          if (Htop - used() >= 150 && tries <= (isFront ? textBlocks.length + 1 : 4)) {
            const dropPhoto = isFront ? tries > textBlocks.length : tries > 1;
            const short: EpaperFullStory = { ...story, image: dropPhoto ? null : story.image, blocks: [...textBlocks.slice(0, keep), { k: 'p' as const, t: `Read the full story at webfitnews.com/${story.slug}` }] };
            queue.splice(firstIdx, 0, ...storyItems(short, isFront, isFront));
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
      let item = queue[0];
      // Page already has its main story and one more: the next story starts a new page (or, on the desk's last page, waits for the back-page list).
      // Counted from the page itself, so a story taken out again (shortened on a desk's last page) doesn't count.
      if (item.t === 'head' && !isFront && flow.querySelectorAll(`:scope > .${styles.head}`).length >= MAX_STORIES_PER_PAGE) {
        if (pageNo + 1 >= quota) break;
        close(false); pageNo += 1; open(false);
        continue;
      }
      // Like a printed weekly: every page opens with one main story, big headline across the top
      // and its photo across all three columns. Stories after it on the same page stay smaller.
      if (item.t === 'head' && !isFront && !pageLeadDone) {
        pageLeadDone = true;
        if (!item.lead) {
          item = queue[0] = { ...item, lead: true };
          const ph = queue[1];
          if (ph?.t === 'photo' && ph.story.id === item.story.id && !ph.wide) queue[1] = { ...ph, wide: true };
        }
      }
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
        // The front story keeps a real block of text under its photo (the ad strip sits below it).
        const minAfter = narrowPhotoNext ? 175 : isFront ? 90 : MIN_TEXT_AFTER_HEAD;
        let fits = !overflows(flow) && used() <= Htop && (!needsText || Htop - used() >= minAfter);
        if (!fits && group.length > 1) {
          // Headline + wide photo too tall for the space (e.g. above an ad): make the photo frame shorter.
          // The image fills the frame (object-fit: cover) with the top kept, so nothing is chopped off mid-face.
          const photo = nodes[1].querySelector('img') as HTMLImageElement | null;
          const room = Math.floor(Htop - (used() - nodes[1].offsetHeight) - minAfter - 12);
          if (photo && room >= (isFront ? 100 : 150)) {
            photo.style.aspectRatio = 'auto';
            photo.style.height = `${room}px`;
            fits = !overflows(flow) && used() <= Htop && Htop - used() >= minAfter;
          }
        }
        if (!fits && narrowPhotoNext && !overflows(flow) && used() <= Htop && Htop - used() >= MIN_TEXT_AFTER_HEAD + 30) {
          // Not enough room for the photo up top: start the text here and run the photo further down.
          const photoAt = group.length;
          const [photo] = queue.splice(photoAt, 1);
          let at = photoAt, paras = 0;
          while (at < queue.length && queue[at].t === 'text' && paras < 2) { at += 1; paras += 1; }
          queue.splice(at, 0, photo);
          fits = true;
        }
        const pageAd = block as AdBlock | null;
        // A wide photo won't fit above this page's ad: run the photo in a column instead of pushing the ad
        // on (tall poster pairs, such as two portrait election posters, otherwise never find a page).
        const ph = queue[1];
        if (!fits && pageAd && !isFront && group.length > 1 && ph?.t === 'photo' && ph.wide) {
          nodes.forEach(n => n.remove());
          queue[1] = { ...ph, wide: false };
          continue;
        }
        // A story that opens a page but has no room for any text above this page's ad:
        // move the ad on to the next page rather than leave a headline with no story under it.
        if (!fits && needsText && flow.children.length === nodes.length && pageAd && !isFront) {
          placedBlocks.delete(pageAd.id);
          block = null;
          Htop = H;
          fits = !overflows(flow) && used() <= Htop && Htop - used() >= minAfter;
        }
        if (fits || flow.children.length === nodes.length) {
          if (!fits) nodes.forEach(n => { n.style.maxHeight = `${Math.max(60, Htop - 120)}px`; n.style.overflow = 'hidden'; });
          queue.splice(0, group.length);
          if ('story' in item) lastStoryId = item.story.id;
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
      let run = queue.slice(0, n);
      const R = Math.floor(H - used()) - 2;
      const blk = block as AdBlock | null; // set inside open(); TS can't see that
      const side = blk ? Math.floor(Htop - used()) - 2 : Infinity;
      if (R < 40) { const r2 = nextPage(true); if (!r2) break; continue; }
      if (blk && blk.full && side < 40) { const r2 = nextPage(true); if (!r2) break; continue; }
      // Full-width ad: all three columns stop above it. Side ad: only columns 2–3 do.
      const colsH = blk?.full ? Math.max(0, side) : R;
      const sideLimit = blk?.full ? Infinity : side < 40 ? 0 : side;

      let full = flowColumns(run, colsH, flow, sideLimit);
      const runStory = (run.find(r => r.t === 'text') as Extract<Item, { t: 'text' }> | undefined)?.story;
      // Only the "Read the full story" line would go overleaf: drop it and end the story here instead.
      const spill = full.rest.length === 1 ? full.rest[0] : null;
      const prevText = run[n - 2];
      if (spill && spill === run[n - 1] && spill.t === 'text' && /^Read the full story at /.test(spill.text) && prevText?.t === 'text') {
        queue.splice(n - 2, 2, { ...prevText, last: true });
        continue;
      }
      // Only a few lines would spill onto the next page: shorten this story's wide photo
      // so the story finishes here, instead of leaving a near-empty page behind it.
      const fig = full.rest.length && runStory ? flow.querySelector<HTMLElement>(`figure[data-story="${runStory.id}"]`) : null;
      const figImg = fig && !fig.dataset.shrunk ? fig.querySelector('img') : null;
      if (fig && figImg) {
        fig.dataset.shrunk = '1';
        const grow = (e: number) => flowColumns(run, colsH + e, flow, sideLimit === Infinity ? Infinity : sideLimit + e);
        const MAX_SHRINK = 160, MIN_PHOTO = 180;
        const maxE = Math.min(MAX_SHRINK, figImg.offsetHeight - MIN_PHOTO);
        if (maxE >= 10 && !grow(maxE).rest.length) {
          let lo = 1, hi = maxE;
          while (hi - lo > 2) { const mid = (lo + hi) >> 1; if (grow(mid).rest.length) lo = mid + 1; else hi = mid; }
          const frameH = figImg.offsetHeight;
          figImg.style.aspectRatio = 'auto';
          figImg.style.height = `${frameH - hi - 2}px`;
          continue; // lay this run out again with the extra room
        }
      }
      // The desk has run out of pages and this story can't continue overleaf: end it on a
      // whole paragraph with a pointer to the full story, rather than stop mid-sentence.
      const lastDeskPage = pageNo >= quota && !(snap && snap.page === pageNo && snap.children > 0);
      if (full.rest.length && lastDeskPage && runStory) {
        const more: Item = { t: 'text', story: runStory, k: 'p', text: `Read the full story at webfitnews.com/${runStory.slug}`, first: false, last: true, cont: false };
        for (let k = n - full.rest.length; k >= 1; k -= 1) {
          const shorter = [...run.slice(0, k), more];
          const trial = flowColumns(shorter, colsH, flow, sideLimit);
          if (!trial.rest.length) { queue.splice(0, n, ...shorter); n = shorter.length; run = shorter; full = trial; break; }
        }
      }
      if (full.rest.length) {
        flow.append(full.band);
        lastStoryId = run[0].t === 'half' ? lastStoryId : (run[0] as any).story.id;
        queue.splice(0, n, ...full.rest);
        const r3 = nextPage(true);
        if (!r3) break;
        continue;
      }
      // It all fits: find the shortest column height that still holds it (balanced columns).
      let lo = 20, hi = colsH, best = full;
      while (hi - lo > 3) {
        const mid = Math.floor((lo + hi) / 2);
        const trial = flowColumns(run, mid, flow, sideLimit);
        if (trial.rest.length) lo = mid + 1; else { hi = mid; best = trial; }
      }
      best.band.classList.add(styles.bandEnd);
      flow.append(best.band);
      lastStoryId = (run[0] as any).story?.id || lastStoryId;
      queue.splice(0, n);
    }

    // The section ended well above its ad: a short tail page. Move the ad to the next full page rather than
    // leave a hole, but only when our small "advertise here" panel can fill most of the space instead.
    // On a tail page with just a few lines of text, the paid ad stays: otherwise most of the page is blank.
    const endBlock = block as AdBlock | null;
    if (endBlock && !isFront && Htop - used() > 120 && H - used() <= 420) { placedBlocks.delete(endBlock.id); block = null; Htop = H; }
    // Space left after the section's last story: our own "advertise here" panel (never on a page that already has an ad).
    if (!block && houseHalves < HOUSE_HALF_LIMIT && pages.length >= AD_FREE_PAGES) {
      const node = build({ t: 'half', ad: null });
      flow.append(node);
      if (!overflows(flow) && used() + 10 <= H) houseHalves += 1;
      else node.remove();
    }
    close(false);
  });
  const dropped = edition.sections.flatMap(sec => sec.stories).filter(st => !placed.has(st.id)).map(st => ({ title: st.title, slug: st.slug }));
  const unplaced = blocks.filter(b => !placedBlocks.has(b.id));
  if (frontBlock && !placedBlocks.has(frontBlock.id)) unplaced.unshift(frontBlock);
  return { pages, dropped, unplaced };
}

/** Page 2 is news only: no paid ads, no "advertise here" panels. (The front page has its own ad strip.) */
const AD_FREE_PAGES = 2;
/** Fonts used inside the pages (Epaper.module.css), loaded before the layout is measured. */
const EPAPER_FONTS = ["700 29px 'WN Section'", "600 22px 'WN Head'", "500 40px 'WN Head'", "400 9.4px 'WN Body'", "700 9.4px 'WN Body'", "italic 400 9.4px 'WN Body'", "italic 800 32px 'WN Display'", "800 40px 'WN Display'"];
/** Like a printed weekly: a page carries its main story and at most one more. The rest go to the back-page list. */
const MAX_STORIES_PER_PAGE = 2;
/** Every edition is this many pages, like the printed community weeklies. */
export const TOTAL_PAGES = 21;
/** Height of the poster art in the front page's ad strip (inside pages allow up to AD_MAX_ART_H). */
const FRONT_AD_ART_H = 190;

function assemble(flow: FlowPage[], unplaced: AdBlock[], almanac: boolean): BookPage[] {
  const out: BookPage[] = [...flow];
  // Only if there were fewer news pages than ads (a thin edition): the rest share a page before the back page.
  const rest = unplaced.flatMap(b => b.ads);
  for (let i = 0; i < rest.length; i += 2) out.push({ kind: 'shared', ads: rest.slice(i, i + 2) });
  // Every weekly edition: "Stars & Week Ahead" (rashifal, what's on, this week in history) before the back page.
  if (almanac) out.push({ kind: 'almanac' });
  out.push({ kind: 'back' });
  // Our own "Advertise with Webfit News" page closes the paper.
  out.push({ kind: 'house' });
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

function FlowPageView({ page, n, edition, contents, nextOf, prevOf, teaserPages }: { page: FlowPage; n: number; edition: Edition; contents: Array<{ title: string; page: number }>; nextOf: number | null; prevOf: number | null; teaserPages?: Map<string, number> }) {
  const continuesTitle = page.endsMidStory && page.lastStoryId ? page.section.stories.find(s => s.id === page.lastStoryId)?.title : null;
  const note = continuesTitle && nextOf ? `“${continuesTitle.length > 48 ? `${continuesTitle.slice(0, 46)}…` : continuesTitle}” continues on page ${nextOf}` : undefined;
  const flow = <div className={styles.flowWrap}>
    <div aria-hidden="true" className={`${styles.newsFrame} ${page.front ? styles.newsFrameFront : ''}`} style={{ height: page.newsH + 14 }}/>
    <div className={styles.flow} style={{ height: page.front ? FRONT_FLOW_H : PAGE_FLOW_H }} dangerouslySetInnerHTML={{ __html: page.html }}/>
  </div>;

  if (page.front) {
    return <div className={`${styles.page} ${styles.front}`}>
      <header className={styles.masthead}>
        <div className={styles.mastheadTop}>
          <span>{edition.dateline} · Weekly, every Thursday</span>
          <span>{edition.released ? edition.title : edition.isLive ? `Preview · out ${edition.dateline}` : edition.title}</span>
          <span>Vol. 1 · No. {edition.number} · Free</span>
        </div>
        <div className={styles.nameplate}>
          <img className={styles.globe} src="/icon-192.png" alt=""/>
          <div className={styles.wordmark} role="img" aria-label="Webfit News"><span>Webfit</span> <b>News</b></div>
          <div className={styles.nameplateSide}>
            <strong>{edition.title}</strong>
            <span>{edition.coverage}</span>
            <span>{edition.storyCount} stories</span>
          </div>
        </div>
        <div className={styles.tagline}>Independent New Zealand journalism · Member, New Zealand Media Council</div>
        <div className={styles.contentsBar}>
          <strong>Inside</strong>
          {contents.slice(1, 9).map(c => <span key={c.title}>{c.title} <b>{c.page}</b></span>)}
        </div>
        {edition.front?.teasers?.length ? <nav className={styles.teasers} aria-label="Inside this week">
          {edition.front.teasers.map(t => <a key={t.slug} href={`/${t.slug}`} className={styles.teaser}>
            {t.image ? <img src={resizedImage(t.image, 160, 70)} alt=""/> : <span className={styles.teaserNoImg}/>}
            <span className={styles.teaserText}>
              <em>{t.section}{teaserPages?.get(t.slug) ? ` · Page ${teaserPages.get(t.slug)}` : ''}</em>
              <b>{t.title}</b>
            </span>
          </a>)}
        </nav> : null}
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
        <div className={styles.pageBrandName}><img src="/icon-192.png" alt=""/><span>Webfit</span> <b>News</b></div>
        <span>{edition.dateline}</span>
      </div>
    </header>
    {flow}
    <Folio n={n} label={page.section.title} note={note} edition={edition}/>
  </div>;
}

/** A 9×9 grid; 0 = empty square. Thicker lines mark the 3×3 boxes. */
function SudokuGrid({ cells, className }: { cells: number[]; className: string }) {
  return <div className={className} role="img" aria-label="Sudoku grid">
    {cells.map((v, i) => <span key={i} data-c={i % 9} data-r={Math.floor(i / 9)}>{v || ''}</span>)}
  </div>;
}

/** Page 19: weekly horoscope, what's on, this week in history and the weekly sudoku (built in lib/epaper-almanac.ts). */
function AlmanacPageView({ n, edition, almanac }: { n: number; edition: Edition; almanac: NonNullable<Edition['almanac']> }) {
  return <div className={`${styles.page} ${styles.almanac}`}>
    <header className={styles.pageHead}>
      <span className={styles.pageNo}>{String(n).padStart(2, '0')}</span>
      <div className={styles.pageSection}>
        <strong>Stars &amp; Week Ahead</strong>
        <span>{almanac.range}</span>
      </div>
      <div className={styles.pageBrand}>
        <div className={styles.pageBrandName}><img src="/icon-192.png" alt=""/><span>Webfit</span> <b>News</b></div>
        <span>{edition.dateline}</span>
      </div>
    </header>
    <section className={styles.rashiSection} aria-label="Weekly horoscope">
      <h3 className={styles.almanacTitle}>Weekly horoscope <span>Find your sign by your birthday. Know your moon sign (janma rashi)? Read that one.</span></h3>
      <div className={styles.rashiGrid}>
        {almanac.rashis.map(r => <article key={r.key} className={styles.rashi}>
          <h4><span className={styles.rashiName}><b aria-hidden="true">{r.symbol}</b> {r.english} <span>{r.name}</span></span>{r.born ? <span className={styles.rashiBorn}>{r.born}</span> : null}</h4>
          <p>{r.text}</p>
          <p className={styles.rashiDays}><strong>Good days:</strong> {r.goodDays}{r.careDays ? <> · <strong>Take care:</strong> {r.careDays}</> : null}</p>
        </article>)}
      </div>
      <p className={styles.moonLine}><strong>Moon this week:</strong> {almanac.moon.join(', ')}.</p>
    </section>
    <div className={styles.almanacCols}>
      <section aria-label="What's on">
        <h3 className={styles.almanacTitle}>What’s on</h3>
        {almanac.events.length ? <ul className={styles.almanacList}>
          {almanac.events.map(e => <li key={e.date + e.title} className={e.local ? styles.almanacLocal : undefined}><b>{e.label}</b> {e.title}{e.note ? <em> {e.note}</em> : null}</li>)}
        </ul> : <p className={styles.almanacEmpty}>No public holidays or major festivals this week.</p>}
      </section>
      <section aria-label="This week in history">
        <h3 className={styles.almanacTitle}>This week in history</h3>
        {almanac.history.length ? <ul className={styles.almanacList}>
          {almanac.history.slice(0, 3).map(h => <li key={h.date}><b>{h.label} {h.year}</b> {h.text}</li>)}
          {almanac.births.slice(0, 1).map(h => <li key={`b${h.date}`}><b>Born {h.label} {h.year}</b> {h.text}</li>)}
        </ul> : <p className={styles.almanacEmpty}>Back next week.</p>}
      </section>
      {almanac.sudoku ? <section aria-label="Weekly sudoku" className={styles.sudokuBox}>
        <h3 className={styles.almanacTitle}>Sudoku <span>Medium</span></h3>
        <button type="button" className={styles.sudokuPlay} onClick={() => window.dispatchEvent(new CustomEvent('wf-open-puzzles', { detail: 'sudoku' }))} aria-label="Play this sudoku on screen">
          <SudokuGrid cells={almanac.sudoku.puzzle} className={styles.sudoku}/>
          <span>Tap to play on screen</span>
        </button>
        <div className={styles.sudokuLast}>
          <p className={styles.sudokuHow}>Fill every row, column and 3×3 box with the numbers 1 to 9.<br/><b>{almanac.sudoku.lastSolution ? 'Last week’s solution:' : 'Solution in next week’s edition.'}</b></p>
          {almanac.sudoku.lastSolution ? <SudokuGrid cells={almanac.sudoku.lastSolution} className={styles.sudokuMini}/> : null}
        </div>
      </section> : null}
    </div>
    <p className={styles.almanacNote}>Horoscope (rashifal) worked out from the planets’ real positions this week, Vedic system, for entertainment. Birthday dates are Vedic, about three weeks later than Western star-sign dates. Festival dates are Indian calendar dates. History: Wikipedia.</p>
    <Folio n={n} label="Stars & Week Ahead" edition={edition}/>
  </div>;
}

const REACH: Array<[string, string]> = [
  ['14.2K', 'website readers a month'],
  ['10K', 'Instagram followers'],
  ['9.4K', 'Facebook followers'],
  ['1K+', 'YouTube subscribers'],
];

/** Last page: Webfit News selling its own space. The only full-page advertisement in the paper. */
function HousePageView({ n, edition }: { n: number; edition: Edition }) {
  return <div className={`${styles.page} ${styles.housePage}`}>
    <img className={styles.houseLogo} src="/webfit-news-logo-400.webp" alt="Webfit News"/>
    <div className={styles.houseRule}/>
    <span className={styles.houseKicker}>Advertise with Webfit News</span>
    <h2 className={styles.houseHeadline}>Put your business in front of communities across New Zealand</h2>
    <p className={styles.houseLead}>Your ad sits right next to the stories our readers come for, in every weekly e-paper edition, and across webfitnews.com and our social channels.</p>
    <div className={styles.houseStats}>{REACH.map(([v, l]) => <div key={l}><strong>{v}</strong><span>{l}</span></div>)}</div>
    <div className={styles.houseOffers}>
      <div><b>E-paper</b><span>Half-page and poster spots on news pages, every weekly edition</span></div>
      <div><b>Website</b><span>Homepage, section and article placements on webfitnews.com</span></div>
      <div><b>Social &amp; sponsored</b><span>Campaigns across our channels and clearly labelled partner stories</span></div>
    </div>
    <div className={styles.houseContact}>
      <span>Talk to Sandy</span>
      <a href="tel:0221299323">022 129 9323</a>
      <a href="mailto:Sandy@WebfitNews.co.nz?subject=Advertising%20in%20the%20Webfit%20News%20e-paper">Sandy@WebfitNews.co.nz</a>
      <a href="/advertise-media-kit" className={styles.houseButton}>See the media kit</a>
    </div>
    <Folio n={n} label="Advertise with us" edition={edition}/>
  </div>;
}

/** Two advertisers side by side on one page (or one, larger, when only one is booked). */
function SharedAdPageView({ ads, n, edition }: { ads: EpaperAd[]; n: number; edition: Edition }) {
  return <div className={`${styles.page} ${styles.sharedPage}`}>
    <header className={styles.sharedHead}>
      <span>Marketplace</span>
      <strong>Local businesses &amp; what’s on</strong>
    </header>
    <div className={`${styles.sharedGrid} ${ads.length === 1 ? styles.sharedOne : ''}`}>
      {ads.map(ad => <figure key={ad.assignmentId} className={styles.sharedCard} data-ad-assignment={ad.assignmentId}>
        {ad.href
          ? <a href={ad.href} target="_blank" rel="sponsored noopener" className={styles.sharedArt}><img src={resizedImage(ad.image, 900, 82)} alt={ad.alt} loading="lazy"/></a>
          : <div className={styles.sharedArt}><img src={resizedImage(ad.image, 900, 82)} alt={ad.alt} loading="lazy"/></div>}
        <figcaption>
          <span className={styles.adLabel}>{ad.isElectionAd ? 'Election advertisement' : 'Advertisement'}{ad.advertiser ? ` · ${ad.advertiser}` : ''}</span>
          {ad.cta && ad.href ? <a href={ad.href} target="_blank" rel="sponsored noopener" className={styles.sharedCta}>{ad.cta} →</a> : null}
          {ad.isElectionAd && ad.promoterStatement ? <span className={styles.promoter}>{ad.promoterStatement}</span> : null}
        </figcaption>
      </figure>)}
    </div>
    <Folio n={n} label="Marketplace" edition={edition}/>
  </div>;
}

function BackPageView({ n, edition, shelf, extra }: { n: number; edition: Edition; shelf: EditionSummary[]; extra: Array<{ title: string; slug: string }> }) {
  const others = shelf.filter(e => e.key !== edition.key);
  const all = [...extra, ...edition.moreStories];
  const more = all.slice(0, 14);
  return <div className={`${styles.page} ${styles.backPage} ${more.length ? styles.backPageList : ''}`}>
    <div className={styles.backNameplate}><img src="/icon-192.png" alt=""/><div className={styles.wordmark} role="img" aria-label="Webfit News"><span>Webfit</span> <b>News</b></div></div>
    {more.length ? <div className={styles.backMore}>
      <strong>Also this edition on webfitnews.com</strong>
      <ul>{more.map(s => <li key={s.slug}><a href={`/${s.slug}`}>{s.title}</a></li>)}</ul>
      {all.length > more.length ? <span>…and {all.length - more.length} more at webfitnews.com</span> : null}
    </div> : <>
      <h2 className={styles.backTitle}>Every story, every day, on webfitnews.com</h2>
      <p className={styles.backText}>A new edition comes out every Thursday morning.</p>
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
      // The newspaper fonts must be loaded before measuring, or the text is laid out with the wrong widths.
      try { await Promise.all(EPAPER_FONTS.map(f => document.fonts.load(f))); await document.fonts?.ready; } catch {}
      const host = hostRef.current;
      if (!host || cancelled) return;
      const blocks = await adBlocks(edition);
      if (cancelled) return;
      // Aim for exactly TOTAL_PAGES. Desk pages are filled to a quota, but a desk can end early or a
      // story can run one page over, so lay out again with the quota corrected (at most 4 passes).
      const hasAlmanac = Boolean(edition.almanac);
      // The front, the Stars & Week Ahead page, the back page and our advertising page are the other pages.
      let newsPages = TOTAL_PAGES - (hasAlmanac ? 4 : 3);
      let best: { flow: FlowPage[]; dropped: Array<{ title: string; slug: string }>; unplaced: AdBlock[]; total: number } | null = null;
      for (let pass = 0; pass < 4 && !cancelled; pass += 1) {
        const r = paginate(edition, host, blocks, newsPages);
        const total = assemble(r.pages, r.unplaced, hasAlmanac).length;
        const better = !best || (total <= TOTAL_PAGES && (best.total > TOTAL_PAGES || total > best.total)) || (best.total > TOTAL_PAGES && total < best.total);
        if (better) best = { flow: r.pages, dropped: r.dropped, unplaced: r.unplaced, total };
        if (total === TOTAL_PAGES) break;
        newsPages += TOTAL_PAGES - total;
        if (newsPages < 1) break;
        await new Promise(res => setTimeout(res, 0)); // let the page breathe between passes
      }
      if (cancelled || !best) return;
      const { flow, dropped, unplaced } = best;
      host.replaceChildren();
      const book = assemble(flow, unplaced, hasAlmanac);

      // Page numbers for contents and "continued" notes.
      const firstPageOfSection = new Map<EditionSection, number>();
      book.forEach((p, i) => { if (p.kind === 'flow' && !firstPageOfSection.has(p.section)) firstPageOfSection.set(p.section, i + 1); });
      const contents = edition.sections.map(s => ({ title: s.title, page: firstPageOfSection.get(s) || 0 }));
      const flowIndexes = book.map((p, i) => (p.kind === 'flow' ? i : -1)).filter(i => i >= 0);
      const nextFlow = (i: number) => flowIndexes.find(x => x > i) ?? null;
      const prevFlow = (i: number) => [...flowIndexes].reverse().find(x => x < i) ?? null;

      // Which page each front-page teaser is printed on.
      const teaserPages = new Map<string, number>();
      for (const t of edition.front?.teasers || []) {
        const at = book.findIndex((p, i) => i > 0 && p.kind === 'flow' && p.html.includes(`href="/${t.slug}"`));
        if (at > 0) teaserPages.set(t.slug, at + 1);
      }
      const rendered = book.map((p, i) => {
        const n = i + 1;
        if (p.kind === 'flow') {
          const nx = nextFlow(i); const pv = prevFlow(i);
          return { key: `p${n}`, label: p.front ? 'Front page' : p.section.title, node: <FlowPageView page={p} n={n} edition={edition} contents={contents} nextOf={nx == null ? null : nx + 1} prevOf={pv == null ? null : pv + 1} teaserPages={teaserPages}/> };
        }
        if (p.kind === 'house') return { key: `p${n}`, label: 'Advertise with us', node: <HousePageView n={n} edition={edition}/> };
        if (p.kind === 'almanac' && edition.almanac) return { key: `p${n}`, label: 'Stars & Week Ahead', node: <AlmanacPageView n={n} edition={edition} almanac={edition.almanac}/> };
        if (p.kind === 'shared') return { key: `p${n}`, label: 'Marketplace', node: <SharedAdPageView ads={p.ads} n={n} edition={edition}/> };
        return { key: `p${n}`, label: 'Back page', node: <BackPageView n={n} edition={edition} shelf={shelf} extra={dropped}/> };
      });
      if (!cancelled) setPages(rendered);
    };
    run();
    return () => { cancelled = true; };
  }, [edition, shelf]);

  // Story view: a tapped headline opens the story as a phone-sized article over the page.
  const readerStories = useMemo<ReaderStory[]>(() => {
    const seen = new Set<string>();
    const list: ReaderStory[] = [];
    edition.sections.forEach((sec, i) => {
      for (const st of sec.stories) if (!seen.has(st.slug)) { seen.add(st.slug); list.push({ slug: st.slug, title: st.title, section: i === 0 ? 'Front page' : sec.title, image: st.image }); }
    });
    for (const st of edition.moreStories) if (!seen.has(st.slug)) { seen.add(st.slug); list.push({ slug: st.slug, title: st.title, section: 'Also this edition', image: null }); }
    return list;
  }, [edition]);
  const [reading, setReading] = useState<string | null>(null);
  const [listenAll, setListenAll] = useState(false);
  const canListen = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [puzzles, setPuzzles] = useState<null | 'sudoku' | 'words'>(null);
  const hasPuzzles = Boolean(edition.almanac?.sudoku || edition.wordSearch);
  // The "Play on screen" button printed by the sudoku on page 19 asks for the puzzles this way.
  useEffect(() => {
    const open = (e: Event) => setPuzzles(((e as CustomEvent).detail as 'sudoku' | 'words') || 'sudoku');
    window.addEventListener('wf-open-puzzles', open);
    return () => window.removeEventListener('wf-open-puzzles', open);
  }, []);
  const openStory = (e: ReactMouseEvent) => {
    const a = (e.target as HTMLElement).closest?.('a[href^="/"]') as HTMLAnchorElement | null;
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const slug = (a.getAttribute('href') || '').slice(1).split(/[?#]/)[0];
    if (!readerStories.some(st => st.slug === slug)) return;
    e.preventDefault();
    setListenAll(false);
    setReading(slug);
  };

  return <>
    {/* Off-screen measuring room: same width and styles as a real page. */}
    <div aria-hidden="true" className={styles.measure} style={{ width: PAGE_W, height: PAGE_H }}><div className={styles.page}><div ref={hostRef}/></div></div>
    {pages && (canListen || hasPuzzles) ? <div className={styles.listenBar}>
      {canListen && readerStories.length ? <button type="button" onClick={() => { setListenAll(true); setReading(readerStories[0].slug); }}>🎧 Listen to this edition</button> : null}
      {hasPuzzles ? <button type="button" className={styles.puzzleButton} onClick={() => setPuzzles('sudoku')}>🧩 Puzzles</button> : null}
      <span>Tap a headline to read or listen to one story.</span>
    </div> : null}
    <div onClickCapture={openStory}>
      {pages ? <EpaperViewer pages={pages} title={`Webfit News e-paper · ${edition.title} · ${edition.coverage}`} shareHref={edition.href}/> : <div className={styles.setting} role="status">Setting this week’s pages…</div>}
    </div>
    {puzzles ? <Puzzles editionKey={edition.key} sudoku={edition.almanac?.sudoku?.puzzle || null} wordSearch={edition.wordSearch} start={puzzles} onClose={() => setPuzzles(null)}/> : null}
    <StoryReader stories={readerStories} openSlug={reading} autoplay={listenAll} onClose={() => { setReading(null); setListenAll(false); }} editionLabel={`${edition.title} · ${edition.coverage}`}/>
  </>;
}
