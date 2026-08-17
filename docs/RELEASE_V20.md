# Webfit News v2.0 release candidate

## Purpose

v2.0 is the first staging-oriented release candidate after the historical archive migration was completed.

## Launch safeguards added

- Historical redirects now execute in the public Next.js request layer.
- Redirect lookup accepts both trailing-slash and non-trailing-slash historical paths.
- The old `/article/<slug>` route now permanently redirects to the canonical root article URL.
- The archive importer is permanently read-only in the production CMS.
- The only active archive video exception remains an intentionally skipped historical video binary.
- Production environment validation confirms the dedicated Webfit News Supabase project.
- `/api/health` verifies application-to-database connectivity.
- The public site shell reads publication identity, SEO defaults and Media Council presentation from public-safe CMS settings.
- Saving Settings synchronises public-safe site identity, SEO and footer mirrors.
- The Users API prevents self-demotion and removal of the only active Super Admin.
- The database independently prevents deletion, deactivation or demotion of the last active Super Admin.
- Standard security response headers remain configured globally.

## Verified live archive baseline

- Articles: 737
- Published: 728
- Drafts: 9
- Pages: 13
- Categories: 66
- Tags: 6,695
- Media records: 2,798
- Media binaries copied: 2,797
- Legacy videos intentionally skipped: 1
- Media failures: 0
- Historical redirects: 13

## Still required before production cutover

1. Configure the exact first administrator bootstrap email.
2. Create the matching Supabase Auth user.
3. Complete the one-time Super Admin bootstrap.
4. Create a dedicated Webfit News source repository and connect it to Vercel.
5. Run a real production build in the deployment environment.
6. Verify `/api/health` on staging.
7. Test article create, edit, review, schedule and publish workflows.
8. Test native media upload and featured-image selection.
9. Test homepage curation, category pages, redirects, RSS and sitemaps.
10. Run the final content delta before DNS cutover.
