# Webfit News v2.7

Reader support release.

- Adds a publication-wide reader support banner.
- Adds `/support-us` with one-off NZD contribution options.
- Adds a server-only Stripe Checkout endpoint. Payment remains unavailable until `STRIPE_SECRET_KEY` is configured in the deployment environment.
- Adds `/login` for reader sign-in, separate from `/admin/login` for newsroom staff.
- Adds OAuth and passwordless email sign-in UI. OAuth providers must be enabled in Supabase Auth before use.
- Adds `/auth/callback` for Supabase PKCE authentication callbacks.
- Adds Support and Reader Sign In links to the public footer.
