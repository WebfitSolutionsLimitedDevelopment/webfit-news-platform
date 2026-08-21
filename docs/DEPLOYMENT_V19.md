# Webfit News v1.9 deployment gate

## Permanent architecture

Webfit News publishes from its own Next.js newsroom into Supabase. The historical import is complete and locked read-only. Legacy videos are optional archive assets and do not block launch.

## Required production environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The application validates both values before creating Supabase clients. Production also validates that the URL points at the dedicated Webfit News Supabase project.

## Health check

`GET /api/health` returns a non-cached operational status and verifies that the application can query published articles from Supabase. It exposes no credentials.

Expected healthy response includes:

- `ok: true`
- `database: reachable`
- published article count
- request duration

## First administrator

The exact bootstrap email must be configured before creating the first newsroom login. Do not use a guessed address. New Auth users begin inactive. The approved first account can bootstrap to Super Admin only when its signed-in email exactly matches the configured address. The elevation function revokes its own authenticated execution after success.

## Cutover gate

Do not point the production domain until all of these pass:

1. Production build succeeds in the hosting environment.
2. `/api/health` returns 200.
3. First Super Admin can sign in and sign out.
4. Create, edit, schedule and publish a test story.
5. Upload and select a new image from the native media library.
6. Homepage curation works.
7. A sample of historical articles and images renders correctly.
8. Redirects and canonical URLs are verified.
9. Search, RSS, sitemap and news sitemap are reachable.
10. A final content delta is applied before DNS cutover if the old site received new stories after the archive snapshot.
