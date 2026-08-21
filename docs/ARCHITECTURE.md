# Webfit News Platform Architecture

## Stack
- Next.js 16 + TypeScript on Vercel
- Supabase Postgres, Auth and Storage
- Public domain: webfitnews.co.nz
- Admin: webfitnews.co.nz/admin

## Migration priorities
1. Preserve current slugs and publication timestamps.
2. Preserve Yoast descriptions and OpenGraph metadata where present.
3. Download every WordPress attachment while the old hosting is still online.
4. Move media to Supabase Storage bucket `news-media`.
5. Rewrite inline image URLs only after successful upload.
6. Preserve historical slugs as 301 redirects.
7. Run article, media and redirect reconciliation before DNS cutover.

## Publishing model
Articles are the source of truth in Supabase. Homepage curation uses `homepage_sections` and `homepage_slots`, not publish date alone.
