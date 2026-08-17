# Webfit News deployment checklist v1.8

## Required environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The first administrator email is configured in the database bootstrap table, not exposed to browser code.

## First administrator sequence

1. Confirm the exact newsroom administrator email.
2. Configure that exact lowercase email in `app_private.admin_bootstrap_config`.
3. Create the matching user in Supabase Auth with a strong temporary password or invite flow.
4. Sign in at `/admin/login`.
5. The login flow attempts the one-time bootstrap if the profile is not yet active.
6. Verify the profile is `super_admin` and active.
7. Verify `public.bootstrap_first_admin()` revoked authenticated execution automatically after successful bootstrap.

## Staging gates

- `npm ci`
- `npm run build`
- public homepage/category/article/search smoke tests
- login/logout
- create draft, review, publish and scheduled publish
- featured media upload/select/render
- homepage curation
- redirects
- RSS, sitemap and News sitemap
- mobile layout
- launch-readiness screen fully green

Legacy video binaries are optional and must not block launch.
