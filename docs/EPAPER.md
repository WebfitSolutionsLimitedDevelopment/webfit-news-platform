# E-paper and automatic categories (v6.0)

## E-paper (`/epaper`)

- Two editions a week (New Zealand time): **Midweek** (Mon–Wed, out Monday) and **Weekend** (Thu–Sun, out Thursday), at `/epaper/<start date>`. `/epaper` opens the current edition once it has 10 stories, otherwise the previous one. The shelf shows the last 15 days; every edition since launch stays readable at `/epaper/<date>` and is listed at `/epaper/archive` (pure date arithmetic, no database query). Old editions are rebuilt from today's version of each story and show today's ads. Fully automatic.
- Each edition has 12 pages: front, **9 news pages** (pages 2–3 ad-free, paid ads inside the rest), back page, our advertising page (`NEWS_PAGES` in `EpaperBook.tsx`). A long story can add one more page. Earlier note: front page (the strongest story, trimmed to fit), desk pages, full-page ads on pages 2 and 6, back page (`EDITION_PAGES` in `EpaperBook.tsx`). Desks: Aotearoa Today · Power & Politics (+ opinion) · Desi Diaries (India, community, visas, notices) · Money & World · Style & Sports (`DESKS` in `lib/epaper.ts`). The desk pages (8 with two ads, 9 with one) are shared out in proportion to each desk's stories (at least one each). Stories are trimmed (lead ~260 words, others ~130) and end with "Read the full story at webfitnews.com/…"; if a story won't fit on a desk's last page a shorter version goes in, or it is skipped. Everything not printed is listed on the back page and under the viewer, so every story stays one click away.
- Order: front page (the week's strongest story: hero, breaking, featured, editor's pick, then views) → Aotearoa Today (NZ) → Power & Politics → Visa Desk → Desi Diaries (India & community) → Money Matters → World Window → Style & Living (lifestyle, beauty, health) → Sports Arena → Point of View → Community Board → back page. Empty sections are skipped. Category → section map: `EPAPER_SECTIONS` in `lib/epaper.ts`.
- The server sends the stories as plain text blocks (`lib/epaper-text.ts`: paragraphs, subheadings, lists, quotes, table rows; images and embeds dropped). The reader’s browser lays them out (`components/epaper/EpaperBook.tsx`) into 560 × 792 pages: full-width headlines and lead photos, then three fixed-height columns per story (each column is measured on its own — no CSS multi-column, which Safari clipped), balanced to the shortest height that holds the text, splitting text across pages mid-paragraph and printing "continued on / from page N". Each section starts on a new page.
- Zoom: pinch or double-tap on the paper (phones), the − / Fit / + buttons, Ctrl/⌘ + scroll or + / − / 0 keys (desktop). 100%–400%; drag to move around a zoomed page.
- Page-turn sound: made in the browser with Web Audio (`components/epaper/flipSound.ts`, no audio file). 🔊/🔇 button; the choice is remembered on that device.
- Share ↗: on phones opens the system share sheet (WhatsApp, Messages…); on laptops a menu with WhatsApp, Facebook, X, Email and Copy link. The link opens the same edition at the page being read (`/epaper/<date>#page-N`), as the flipbook. (A PDF download was tried and removed: a PDF can't flip.)
- No site ads around the flipbook: /epaper pages skip Google AdSense (auto, anchor and in-page ads), the Spotlight slide-in and the election poll strip (`SiteHeader quiet`, `AD_FREE_PATHS` in ThirdPartyScripts). Only the e-paper's own booked pages show.
- Only `/epaper` is indexed. Edition pages are `noindex, follow` because every story already has its own page.

## E-paper advertising

Paid ads sit **inside news pages**, the way a printed paper runs them: the ad takes the lower part of a page and stories run above it and beside it. No paid ad gets a page to itself. Pages 1–3 are news only (`AD_FREE_PAGES`). The last page is always our own "Advertise with Webfit News" page (reach figures and Sandy's contact details, from the media kit), after the back page.

| Key | Where | Artwork |
| --- | --- | --- |
| `EPAPER_FULL_PAGE` (admin label "featured poster") | One poster per news page, bottom right over columns 2–3; column 1 keeps running beside it. Highest priority first | Portrait or square poster (e.g. 1080 × 1350); shown whole, never cropped |
| `EPAPER_SHARED_PAGE` | Two posters side by side across the foot of a news page, paired in priority order. `cta_label` shows as a button under the poster | Portrait poster, ~2:3 |
| `EPAPER_HALF_PAGE` (admin label "banner") | Landscape artwork runs across the foot of a news page; a poster goes bottom right like a featured poster | 1240 × 620 landscape |

Ad blocks are spread evenly over the news pages from page 4 on, one per page, in order: featured posters, shared pairs, banners. If a section ends high up on its page, that page's ad moves to the next page instead of leaving a gap. Only when an edition has fewer news pages than ads do the leftovers share a page before the back page. Spare space at the end of a section gets our own "advertise here" panel (at most two per edition). Impressions are counted the first time an ad is on screen; clicks go through `/api/ads/click` as usual.

Story photos are framed at their real shape (from `media.width/height`), within limits (front 1.75–2.6, section leads 1.5–2.6, column photos 0.9–1.8 width ÷ height). Only a photo taller than the limit, or one squeezed above an ad, loses a strip, mostly from the bottom (`object-position: 50% 22%`), so faces stay in.

### Booking an e-paper ad (Newsroom → Advertisements → Add an ad)

1. Upload the poster (any size; it is resized), give it a name.
2. First day and last day (book ahead by choosing a later first day; the list shows it as "Scheduled").
3. Where it shows → Change → tick **E-paper: featured poster** (one poster on a news page), **E-paper: poster shared with another ad** (two side by side) or **E-paper: banner** (landscape). Video ads can't go in the e-paper.
4. Optional button text under the poster (e.g. "Book now") and the link.
5. Publish. The e-paper refreshes straight away; the ad comes down by itself after the last day.

## Automatic categories

Migration `supabase/migrations/20261007_auto_categorise_and_epaper.sql`:

- `category_rules`: keyword lists per category, with a weight (topics such as Politics and Sports outrank places such as Auckland and New Zealand).
- Every 10 minutes (`pg_cron` job `auto-categorise-stories`) each published story with **no** categories, published at least 5 minutes earlier, is scored: headline match 3, tag 2, excerpt 1, times the rule weight. The best category becomes primary; a second is added if it scores at least half as well. No match at all → New Zealand.
- Auto-assigned rows have `article_categories.assigned_by = 'auto'`. Saving the story in the CMS replaces them with the editor's choice. The rule never touches a story that already has a category.
- The first run backfills every uncategorised story (282 when this was written).
- To tune: edit `category_rules.keywords` / `weight`. To preview a story's scores: `select * from score_article_categories('<article id>');`
- To undo auto categories: `delete from article_categories where assigned_by = 'auto';` and `select cron.unschedule('auto-categorise-stories');`
