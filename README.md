# Webfit News Platform v2.0

Purpose-built first-party publishing platform for Webfit News at `webfitnews.co.nz`.

## Architecture rule

Webfit News is independent of WordPress. The historical WordPress installation is used only as a one-time archive source during migration. All future publishing runs through the Webfit News `/admin` application, Supabase database/auth/storage, and the Next.js public frontend.

## Current platform

- Next.js newsroom and public publication foundation
- Dedicated Supabase production project
- Article create/edit/review/schedule/publish workflow
- Automatic scheduled publishing in PostgreSQL
- Article revision history and audit logging
- Supabase media library with featured-image selection
- Homepage editorial curation
- Category and author management
- Advertising campaign management
- Video and digital edition management
- Users and newsroom role management
- Redirect manager
- Publication, SEO and editorial trust settings
- RSS and Google News sitemap support
- Launch Readiness checks

## Verified baseline archive state, 17 August 2026

The production Supabase database contains:

- 737 articles total
- 728 published articles
- 9 drafts
- 13 pages
- 66 categories
- 6,695 tags
- 2,798 media metadata records
- 1,508 article/category relationships
- 7,602 article/tag relationships
- 666 restored primary-category relationships
- 88 inline-media relationships
- 13 historical slug redirects

Physical archive media is complete under the current editorial migration policy: **2,797 files copied and 1 legacy video intentionally skipped**. Supabase Storage contains 2,797 non-empty archive objects totalling 1,355,717,378 bytes. Legacy video binaries are optional and do not block launch.

Published-article integrity checks currently report:

- 0 broken featured-image relationships
- 0 broken social-image relationships
- 0 empty published article bodies
- 0 empty published slugs
- 0 invalid published canonical URLs
- 0 historical `webfitnews.com` runtime URLs remaining in article bodies
- 0 historical upload URLs remaining in article bodies
- 0 HTML entities remaining in article titles

## Legacy video policy

Historical video binaries are optional. One oversized MP4 was intentionally skipped after its metadata was preserved. Future legacy video files are automatically marked `skipped` instead of `failed`. Native future video publishing continues through the Webfit News video module and external providers.

## Migration safeguards completed

- Empty historical full-size AVIF files were detected and replaced with the largest intact generated variant.
- 31 zero-byte archive copies were reprocessed successfully.
- 11 unsafe Unicode/special-character object keys were normalised for Supabase Storage while preserving original source metadata.
- 8,207 historical upload URLs found in article/page HTML mapped uniquely to their parent media records and were rewritten to Supabase Storage.
- Historical internal site links were rewritten to `webfitnews.co.nz`.
- The temporary media-transfer cron job has been removed.
- The temporary archive media worker has been retired and now returns HTTP 410 behind JWT verification.
- The temporary migration worker secret has been deleted from Vault.

## Environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=https://akyavvskmlrjptyuxkmk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Never place a Supabase secret key in browser code or source control.

## Remaining before launch

1. Configure the exact bootstrap administrator email, create the matching Supabase Auth user, and validate the first Super Admin account.
2. Deploy to a Vercel staging environment and run the real Next.js production build.
3. Test public pages, `/admin`, mobile layouts, article publishing, scheduled publishing, redirects, RSS, sitemap and Google News metadata.
4. Take a fresh final archive/delta snapshot for content published or updated after the 17 August baseline and reconcile it. Legacy video files are optional and do not block cutover.
5. Switch `webfitnews.co.nz` DNS only after launch checks are green.
6. Cancel the old hosting only after the production cutover is independently verified.


## v1.8 security changes

- Secure one-time first-admin bootstrap added.
- New Auth users receive inactive newsroom profiles by default.
- RLS role helpers moved from the exposed public schema into `app_private`.
- Login no longer loops for authenticated but inactive users.
- Explicit CMS sign-out control added.
- Legacy migration console now treats video files as optional.

## v1.9 launch hardening

- Historical archive importer locked read-only after completed migration.
- Legacy video files remain optional archive assets.
- Supabase `pg_trgm` extension moved out of the public schema.
- Environment validation added to all Supabase client creation paths.
- `/api/health` added for staging and production health checks.
- Secure first-admin bootstrap retained with automatic self-revocation after successful elevation.
## v2.0 release-candidate hardening

- Database-managed historical 301 redirects now execute in the public Next.js request layer.
- `/article/<slug>` permanently redirects to the canonical root article URL.
- Historical archive mutation endpoints are permanently disabled in the production CMS.
- Public publication identity, SEO defaults and Media Council presentation now read from public-safe CMS settings.
- Settings updates synchronise those public-safe publication values automatically.
- Users cannot demote or disable their own Super Admin account.
- The database prevents deletion, deactivation or demotion of the last active Super Admin.
- No dedicated Webfit News platform repository currently exists in the connected GitHub account, so v2.0 has not been pushed into an unrelated repository.
- A real Next.js production build still requires an environment where npm dependencies can be installed.


## v2.1 public repository release

The public source release excludes completed archive migration payloads and one-time import tooling. Historical content and media are already stored in Supabase and are not source-code dependencies.

GitHub Actions runs TypeScript validation and a production Next.js build on pushes and pull requests. Configure the repository secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` before expecting CI builds to pass.

No production secret key or Supabase service-role key belongs in this repository.
