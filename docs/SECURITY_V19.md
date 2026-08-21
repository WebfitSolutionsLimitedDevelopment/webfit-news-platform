# Security status v1.9

- Newsroom role helpers live in the private `app_private` schema and are not public RPC endpoints.
- `pg_trgm` now lives in the `extensions` schema while the article trigram index remains available.
- Historical archive import is locked read-only after reconciliation.
- The temporary archive media worker is retired.
- First-admin bootstrap is restricted to one configured email and self-revokes after successful elevation.
- New Auth users are inactive contributors until authorised.
- Legacy video binaries are optional migration assets and skipped video records remain available for provenance.

The one expected Supabase security adviser warning before first-admin setup is the authenticated bootstrap RPC. It exists intentionally for the one-time bootstrap and removes its own authenticated execution permission after successful use.
