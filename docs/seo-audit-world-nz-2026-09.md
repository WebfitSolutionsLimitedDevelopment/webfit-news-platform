# SEO cleanup audit — 9 September 2026

Scope: Webfit News technical SEO, World Guides and NZ Guides. This branch intentionally avoids keyword stuffing and ranking guarantees.

## Changes made
- Removed the inherited root `/` canonical so child routes without an explicit canonical do not accidentally canonicalise to the homepage.
- Normalised immigration SEO URLs to the configured production host (`https://webfitnews.com`).
- Removed synthetic `lastModified: now` values from static immigration sitemap entries.
- Added/strengthened the Google News sitemap for genuinely recent published stories only (48-hour window), with safe XML escaping and caching.
- Added the news sitemap to robots discovery.
- Added a shared World Guides crawlable navigation layer.
- Added an inherited World Guides Open Graph image.
- Added immigration hub metadata/structured-data inheritance for category pages.
- Cleaned NZ Guides visible copy so it is reader-facing rather than exposing SEO/search-engine terminology.
- Removed obsolete `keywords` metadata from the NZ Guides hub; search intent remains in useful page titles, headings, descriptions, internal links and content.

## SEO principles
- One canonical host.
- Self-referencing canonicals on important landing pages.
- Crawlable internal links and topic clusters.
- Accurate sitemaps rather than artificial freshness.
- Structured data must match visible content.
- Reader-first copy; no keyword stuffing.
- Dynamic pages should expose useful server-rendered/crawlable content.

## Regression boundary
No calculator formulas, payment logic, authentication, article publishing logic or immigration eligibility logic is changed by this SEO pass.
