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
  | { t: 'photo'; story: EpaperFullStory; wide: boolean; front: boolean }
  | { t: 'text'; story: EpaperFullStory; k: string; text: string; first: boolean; last: boolean; cont: boolean }
  | { t: 'half'; ad: EpaperAd | null };

type FlowPage = { kind: 'flow'; front: boolean; section: EditionSection; html: string; lastStoryId: string | null; startsWithContinuation: boolean; endsMidStory: boolean };
type BookPage = FlowPage | { kind: 'house' } | { kind: 'shared'; ads: EpaperAd[] } | { kind: 'back' };

/*
 * Paid ads sit inside news pages, the way a printed paper does it: the ad takes
 * the lower part of the page and the stories run above it and beside it.
 *   - One portrait or square poster: bottom of columns 2–3, column 1 keeps running.
 *   - Two posters (shared bookings) or a landscape ad: across the bottom, full width.
 * One ad block per page, spread through the news pages. The only full-page ad
 * is our own "Advertise with Webfit News" page on page 2.
 */
type AdBlock = { id: string; ads: EpaperAd[]; ratios: number[]; full: boolean; w: number; h: number; artH: number };

const FLOW_W = 516;
const COL_W = 167;
const GUTTER = 15; // 7px margin + 7px padding + 1px rule
const SIDE_AD_W = FLOW_W - COL_W - GUTTER; // columns 2–3
const AD_LABEL_H = 16;
const AD_CTA_H = 27;
const AD_MAX_ART_H = 372;

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

function buildAdBlock(block: AdBlock): HTMLElement {
  const box = el('aside', `${styles.adBlock} ${block.full ? styles.adBlockFull : styles.adBlockSide}`);
  box.style.width = `${block.w}px`;
  box.style.height = `${block.h}px`;
  box.append(el('span', styles.adLabel, block.ads.length > 1 ? 'Advertisements' : `Advertisement${block.ads[0].advertiser ? ` · ${block.ads[0].advertiser}` : ''}`));
  const row = el('div', styles.adBlockRow);
  block.ads.forEach((ad, i) => {
    const fig = el('figure', styles.adBlockItem);
    fig.dataset.adAssignment = ad.assignmentId;
    const a = el('a', styles.adBlockArt) as HTMLAnchorElement;
    a.href = ad.href; a.target = '_blank'; a.rel = 'sponsored noopener';
    const im = img(ad.image, ad.alt, 900);
    im.style.height = `${block.artH}px`;
    im.style.width = `${Math.round(block.artH * block.ratios[i])}px`;
    a.append(im);
    fig.append(a);
    if (ad.cta) { const c = el('a', styles.adBlockCta, `${ad.cta} →`) as HTMLAnchorElement; c.href = ad.href; c.target = '_blank'; c.rel = 'sponsored noopener'; fig.append(c); }
    if (ad.isElectionAd && ad.promoterStatement) fig.append(el('span', styles.promoter, ad.promoterStatement));
    row.append(fig);
  });
  box.append(row);
  return box;
}

/** Size an ad block from the artwork's real shape (posters are never cropped). */
function makeBlock(ads: EpaperAd[], ratios: number[]): AdBlock {
  const hasCta = ads.some(a => a.cta);
  const extra = AD_LABEL_H + (hasCta ? AD_CTA_H : 0);
  if (ads.length > 1) {
    const each = (FLOW_W - 12) / ads.length;
    const artH = Math.round(Math.min(AD_MAX_ART_H - 20, ...ratios.map(r => each / r)));
    return { id: ads.map(a => a.assignmentId).join('+'), ads, ratios, full: true, w: FLOW_W, h: artH + extra, artH };
  }
  const r = ratios[0];
  if (r >= 1.3) {
    const artH = Math.round(Math.min(300, FLOW_W / r));
    return { id: ads[0].assignmentId, ads, ratios, full: true, w: FLOW_W, h: artH + extra, artH };
  }
  const artH = Math.round(Math.min(AD_MAX_ART_H, (SIDE_AD_W - 8) / r));
  return { id: ads[0].assignmentId, ads, ratios, full: false, w: SIDE_AD_W, h: artH + extra, artH };
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

/** Paid bookings as ad blocks, most important first: full-page bookings, then shared pairs, then half pages. */
async function adBlocks(edition: Edition): Promise<AdBlock[]> {
  const groups: EpaperAd[][] = [
    ...edition.fullPageAds.map(a => [a]),
    ...edition.sharedPageAds.reduce<EpaperAd[][]>((acc, a, i) => { if (i % 2 === 0) acc.push([a]); else acc[acc.length - 1].push(a); return acc; }, []),
    ...edition.halfPageAds.map(a => [a]),
  ];
  return Promise.all(groups.map(async ads => makeBlock(ads, await Promise.all(ads.map(a => artRatio(a.image))))));
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
      const ratio = photoRatio(item.story.imageRatio, item.front ? 'front' : item.wide ? 'wide' : 'narrow');
      const node = img(item.story.image!, item.story.imageAlt, item.wide ? 1100 : 520, [1200, Math.round(1200 / ratio)]);
      node.style.aspectRatio = String(ratio);
      // Only if the frame is shorter than the photo is anything cut, and then mostly from the bottom: heads stay in.
      node.style.objectPosition = '50% 22%';
      fig.append(node);
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
        box.append(el('span', styles.houseTextSm, 'Poster and banner spots in every edition, right next to the stories our readers come for.'));
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

/**
 * Frame shape (width ÷ height) for a story photo: the photo's own shape, so
 * nothing is cropped, kept within limits so a tall photo can't swallow a page.
 * Only photos taller than the limit lose a strip, and objectPosition keeps
 * the top (faces) in view. Unknown size → 16:9 / 4:3.
 */
const PHOTO_LIMITS = { front: [1.75, 2.6], wide: [1.5, 2.6], narrow: [0.9, 1.8] } as const;
function photoRatio(natural: number | null | undefined, kind: keyof typeof PHOTO_LIMITS) {
  const [min, max] = PHOTO_LIMITS[kind];
  const r = natural && Number.isFinite(natural) ? natural : kind === 'narrow' ? 4 / 3 : 16 / 9;
  return Math.min(max, Math.max(min, r));
}

function storyItems(story: EpaperFullStory, isSectionLead: boolean, isFront: boolean): Item[] {
  const items: Item[] = [{ t: 'head', story, lead: isSectionLead }];
  if (story.image) items.push({ t: 'photo', story, wide: isSectionLead || isFront, front: isFront });
  const blocks = story.blocks.length ? story.blocks : [{ k: 'p', t: 'Read this story at webfitnews.com.' }];
  blocks.forEach((b, i) => items.push({ t: 'text', story, k: b.k, text: b.t, first: i === 0, last: i === blocks.length - 1, cont: false }));
  return items;
}

const isSpan = (it: Item) => it.t === 'head' || it.t === 'half' || (it.t === 'photo' && it.wide);
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

function paginate(edition: Edition, host: HTMLElement, blocks: AdBlock[]): { pages: FlowPage[]; dropped: Array<{ title: string; slug: string }>; unplaced: AdBlock[] } {
  const pages: FlowPage[] = [];
  let houseHalves = 0;
  // Which news page each ad block aims for: spread evenly over the desk pages (front page stays clean).
  const targets = blocks.slice(0, NEWS_PAGES).map((b, i) => ({ block: b, at: 1 + Math.floor((i * NEWS_PAGES) / Math.min(blocks.length, NEWS_PAGES)) }));
  const placedBlocks = new Set<string>();
  const placed = new Set<string>();
  const shortTries = new Map<string, number>();

  // 12 pages in all: front, desk pages, full-page ads, back.
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
    section.stories.forEach((story, i) => queue.push(...storyItems(story, i === 0, isFront)));

    let frontUsed = !isFront;
    let flow!: HTMLElement;
    let H = PAGE_FLOW_H;
    let block: AdBlock | null = null;
    let Htop = H; // headlines, wide photos and columns 2–3 stay above this line
    let startsWithContinuation = false;
    let lastStoryId: string | null = null;

    const open = (continuation: boolean) => {
      const front = !frontUsed;
      frontUsed = true;
      H = front ? FRONT_FLOW_H : PAGE_FLOW_H;
      block = front ? null : targets.find(t => t.at <= pages.length && !placedBlocks.has(t.block.id))?.block || null;
      if (block) placedBlocks.add(block.id);
      Htop = block ? H - block.h - 10 : H;
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
      if (!flow.children.length) { if (block) placedBlocks.delete(block.id); return; }
      if (block) flow.append(buildAdBlock(block));
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
          if (Htop - used() >= 150 && tries <= 4) {
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
        let fits = !overflows(flow) && used() <= Htop && (!needsText || Htop - used() >= minAfter);
        if (!fits && group.length > 1) {
          // Headline + wide photo too tall for the space (e.g. above an ad): make the photo frame shorter.
          // The image fills the frame (object-fit: cover) with the top kept, so nothing is chopped off mid-face.
          const photo = nodes[1].querySelector('img') as HTMLImageElement | null;
          const room = Math.floor(Htop - (used() - nodes[1].offsetHeight) - minAfter - 12);
          if (photo && room >= 150) {
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
        if (fits || flow.children.length === nodes.length) {
          if (!fits) nodes.forEach(n => { n.style.maxHeight = `${Math.max(60, Htop - 120)}px`; n.style.overflow = 'hidden'; });
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
      const blk = block as AdBlock | null; // set inside open(); TS can't see that
      const side = blk ? Math.floor(Htop - used()) - 2 : Infinity;
      if (R < 40) { const r2 = nextPage(true); if (!r2) break; continue; }
      if (blk && blk.full && side < 40) { const r2 = nextPage(true); if (!r2) break; continue; }
      // Full-width ad: all three columns stop above it. Side ad: only columns 2–3 do.
      const colsH = blk?.full ? Math.max(0, side) : R;
      const sideLimit = blk?.full ? Infinity : side < 40 ? 0 : side;

      const full = flowColumns(run, colsH, flow, sideLimit);
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

    // The section ended well above its ad: a short tail page. Move the ad to the next full page rather than leave a hole.
    const endBlock = block as AdBlock | null;
    if (endBlock && Htop - used() > 120) { placedBlocks.delete(endBlock.id); block = null; Htop = H; }
    // Space left after the section's last story: our own "advertise here" panel (never on a page that already has an ad).
    if (!block && houseHalves < HOUSE_HALF_LIMIT) {
      const node = build({ t: 'half', ad: null });
      flow.append(node);
      if (!overflows(flow)) houseHalves += 1;
      else node.remove();
    }
    close(false);
  });
  const dropped = edition.sections.flatMap(sec => sec.stories).filter(st => !placed.has(st.id)).map(st => ({ title: st.title, slug: st.slug }));
  return { pages, dropped, unplaced: blocks.filter(b => !placedBlocks.has(b.id)) };
}

/** Our own "Advertise with Webfit News" page. */
const HOUSE_PAGE_NUMBER = 2;
/** News pages after the front page: front + house page + 9 + back = 12 pages. */
const NEWS_PAGES = 9;

function assemble(flow: FlowPage[], unplaced: AdBlock[]): BookPage[] {
  const out: BookPage[] = [...flow];
  out.splice(Math.min(HOUSE_PAGE_NUMBER - 1, out.length), 0, { kind: 'house' });
  // Only if there were fewer news pages than ads (a thin edition): the rest share a page before the back page.
  const rest = unplaced.flatMap(b => b.ads);
  for (let i = 0; i < rest.length; i += 2) out.push({ kind: 'shared', ads: rest.slice(i, i + 2) });
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

const REACH: Array<[string, string]> = [
  ['14.2K', 'website readers a month'],
  ['10K', 'Instagram followers'],
  ['9.4K', 'Facebook followers'],
  ['1K+', 'YouTube subscribers'],
];

/** Page 2: Webfit News selling its own space. The only full-page advertisement in the paper. */
function HousePageView({ n, edition }: { n: number; edition: Edition }) {
  return <div className={`${styles.page} ${styles.housePage}`}>
    <img className={styles.houseLogo} src="/webfit-news-logo-400.webp" alt="Webfit News"/>
    <div className={styles.houseRule}/>
    <span className={styles.houseKicker}>Advertise with Webfit News</span>
    <h2 className={styles.houseHeadline}>Put your business in front of communities across New Zealand</h2>
    <p className={styles.houseLead}>Your ad sits right next to the stories our readers come for, in every e-paper edition, twice a week, and across webfitnews.com and our social channels.</p>
    <div className={styles.houseStats}>{REACH.map(([v, l]) => <div key={l}><strong>{v}</strong><span>{l}</span></div>)}</div>
    <div className={styles.houseOffers}>
      <div><b>E-paper</b><span>Half-page and poster spots on news pages, every Monday and Thursday edition</span></div>
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
        <a href={ad.href} target="_blank" rel="sponsored noopener" className={styles.sharedArt}><img src={resizedImage(ad.image, 900, 82)} alt={ad.alt} loading="lazy"/></a>
        <figcaption>
          <span className={styles.adLabel}>Advertisement{ad.advertiser ? ` · ${ad.advertiser}` : ''}</span>
          {ad.cta ? <a href={ad.href} target="_blank" rel="sponsored noopener" className={styles.sharedCta}>{ad.cta} →</a> : null}
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
      const blocks = await adBlocks(edition);
      if (cancelled) return;
      const { pages: flow, dropped, unplaced } = paginate(edition, host, blocks);
      host.replaceChildren();
      const book = assemble(flow, unplaced);

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
        if (p.kind === 'house') return { key: `p${n}`, label: 'Advertise with us', node: <HousePageView n={n} edition={edition}/> };
        if (p.kind === 'shared') return { key: `p${n}`, label: 'Marketplace', node: <SharedAdPageView ads={p.ads} n={n} edition={edition}/> };
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
