# E-paper and automatic categories (v6.0)

## E-paper (`/epaper`)

- Built from published stories every time it is requested (cached 5 minutes, refreshed straight away when a story is published or edited). Nothing is uploaded by hand.
- Three editions a week, New Zealand time: **Monday** (Mon–Tue), **Wednesday** (Wed–Thu), **Friday** (Fri–Sun). The current edition is marked **Live** and fills up as stories publish.
- Only the last 15 days are kept, newest first. `/epaper` opens the newest edition; `/epaper/YYYY-MM-DD` opens one by its start date. Older or invalid dates return 404.
- Page order: front page (5 strongest stories: hero, breaking, featured, editor's pick, then views) → New Zealand → Politics & Election → Immigration → India & Community → Business & Money → World & Australia → Lifestyle & Beauty → Sports → Opinion → Notices & Classifieds → back page. Empty sections are skipped; long sections continue onto another page (4 stories a page).
- The category → section map is `EPAPER_SECTIONS` in `lib/epaper.ts`.
- Only `/epaper` is indexed. Edition pages are `noindex, follow` because every story already has its own page.

## E-paper advertising

Two new positions, booked like any other in Newsroom → Advertisements:

| Key | Where | Artwork |
| --- | --- | --- |
| `EPAPER_FULL_PAGE` | A full page after story pages 2, 6, 10 … | 1240 × 1754 portrait (A4) |
| `EPAPER_HALF_PAGE` | Bottom half of a section page with 1–2 stories (never two pages in a row) | 1240 × 860 landscape |

With nothing booked, each edition shows one "Advertise in the e-paper" house page and one house half page linking to `/advertise-media-kit`. Impressions are counted the first time an ad page is on screen; clicks go through `/api/ads/click` as usual.

## Automatic categories

Migration `supabase/migrations/20261007_auto_categorise_and_epaper.sql`:

- `category_rules`: keyword lists per category, with a weight (topics such as Politics and Sports outrank places such as Auckland and New Zealand).
- Every 10 minutes (`pg_cron` job `auto-categorise-stories`) each published story with **no** categories, published at least 5 minutes earlier, is scored: headline match 3, tag 2, excerpt 1, times the rule weight. The best category becomes primary; a second is added if it scores at least half as well. No match at all → New Zealand.
- Auto-assigned rows have `article_categories.assigned_by = 'auto'`. Saving the story in the CMS replaces them with the editor's choice. The rule never touches a story that already has a category.
- The first run backfills every uncategorised story (282 when this was written).
- To tune: edit `category_rules.keywords` / `weight`. To preview a story's scores: `select * from score_article_categories('<article id>');`
- To undo auto categories: `delete from article_categories where assigned_by = 'auto';` and `select cron.unschedule('auto-categorise-stories');`
