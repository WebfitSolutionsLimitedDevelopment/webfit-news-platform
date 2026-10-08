# E-paper and automatic categories (v6.0)

## E-paper (`/epaper`)

- Two editions a week (New Zealand time): **Midweek** (Mon–Wed, out Monday) and **Weekend** (Thu–Sun, out Thursday), at `/epaper/<start date>`. `/epaper` opens the current edition once it has 10 stories, otherwise the previous one. Editions inside the last 15 days stay on the shelf. Fully automatic.
- Each edition has **8 news pages** plus front, back and ad pages (12 with two full-page ads, 14 with two Marketplace pages too) (`NEWS_PAGES` in `EpaperBook.tsx`). Earlier note: front page (the strongest story, trimmed to fit), desk pages, full-page ads on pages 2 and 6, back page (`EDITION_PAGES` in `EpaperBook.tsx`). Desks: Aotearoa Today · Power & Politics (+ opinion) · Desi Diaries (India, community, visas, notices) · Money & World · Style & Sports (`DESKS` in `lib/epaper.ts`). The desk pages (8 with two ads, 9 with one) are shared out in proportion to each desk's stories (at least one each). Stories are trimmed (lead ~260 words, others ~130) and end with "Read the full story at webfitnews.com/…"; if a story won't fit on a desk's last page a shorter version goes in, or it is skipped. Everything not printed is listed on the back page and under the viewer, so every story stays one click away.
- Order: front page (the week's strongest story: hero, breaking, featured, editor's pick, then views) → Aotearoa Today (NZ) → Power & Politics → Visa Desk → Desi Diaries (India & community) → Money Matters → World Window → Style & Living (lifestyle, beauty, health) → Sports Arena → Point of View → Community Board → back page. Empty sections are skipped. Category → section map: `EPAPER_SECTIONS` in `lib/epaper.ts`.
- The server sends the stories as plain text blocks (`lib/epaper-text.ts`: paragraphs, subheadings, lists, quotes, table rows; images and embeds dropped). The reader’s browser lays them out (`components/epaper/EpaperBook.tsx`) into 560 × 792 pages: full-width headlines and lead photos, then three fixed-height columns per story (each column is measured on its own — no CSS multi-column, which Safari clipped), balanced to the shortest height that holds the text, splitting text across pages mid-paragraph and printing "continued on / from page N". Each section starts on a new page.
- Zoom: pinch or double-tap on the paper (phones), the − / Fit / + buttons, Ctrl/⌘ + scroll or + / − / 0 keys (desktop). 100%–400%; drag to move around a zoomed page.
- Page-turn sound: made in the browser with Web Audio (`components/epaper/flipSound.ts`, no audio file). 🔊/🔇 button; the choice is remembered on that device.
- Share ↗: on phones opens the system share sheet (WhatsApp, Messages…); on laptops a menu with WhatsApp, Facebook, X, Email and Copy link. The link opens the same edition at the page being read (`/epaper/<date>#page-N`), as the flipbook. (A PDF download was tried and removed: a PDF can't flip.)
- Only `/epaper` is indexed. Edition pages are `noindex, follow` because every story already has its own page.

## E-paper advertising

Two new positions, booked like any other in Newsroom → Advertisements:

| Key | Where | Artwork |
| --- | --- | --- |
| `EPAPER_FULL_PAGE` | Page 2 (highest priority booking) and page 6 (next). No booking: one house page on page 6. Editions stay 9 pages; desk pages shrink to fit | 1240 × 1754 portrait (A4); square or 4:5 artwork is centred |
| `EPAPER_SHARED_PAGE` | "Marketplace" pages 9 and 12: two posters side by side, paired in priority order (1+2 on page 9, 3+4 on page 12). One poster alone is shown larger. `cta_label` shows as a button under the poster | Portrait poster, ~2:3 |
| `EPAPER_HALF_PAGE` | In the space left at the end of a section, when 250px or more is free | 1240 × 860 landscape |

With nothing booked, each edition shows one "Advertise in the e-paper" house page and up to two house half pages linking to `/advertise-media-kit`. Impressions are counted the first time an ad page is on screen; clicks go through `/api/ads/click` as usual.

## Automatic categories

Migration `supabase/migrations/20261007_auto_categorise_and_epaper.sql`:

- `category_rules`: keyword lists per category, with a weight (topics such as Politics and Sports outrank places such as Auckland and New Zealand).
- Every 10 minutes (`pg_cron` job `auto-categorise-stories`) each published story with **no** categories, published at least 5 minutes earlier, is scored: headline match 3, tag 2, excerpt 1, times the rule weight. The best category becomes primary; a second is added if it scores at least half as well. No match at all → New Zealand.
- Auto-assigned rows have `article_categories.assigned_by = 'auto'`. Saving the story in the CMS replaces them with the editor's choice. The rule never touches a story that already has a category.
- The first run backfills every uncategorised story (282 when this was written).
- To tune: edit `category_rules.keywords` / `weight`. To preview a story's scores: `select * from score_article_categories('<article id>');`
- To undo auto categories: `delete from article_categories where assigned_by = 'auto';` and `select cron.unschedule('auto-categorise-stories');`
