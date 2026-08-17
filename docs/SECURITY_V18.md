# Security hardening v1.8

## First Super Admin

The project deliberately does not promote the first person who signs up.

1. `app_private.admin_bootstrap_config` stores the one permitted bootstrap email.
2. A new Auth user is mirrored into `profiles` as an inactive contributor.
3. `bootstrap_first_admin()` only succeeds when there is no active Super Admin and the signed-in Auth email exactly matches the configured bootstrap email.
4. After success the bootstrap record is consumed and the function revokes its own authenticated execution permission.
5. The action is written to `audit_log`.

The bootstrap email is intentionally not populated in source control. It must be configured separately once the exact administrator email is confirmed.

## RLS helpers

`current_user_role`, `is_staff`, `is_admin`, and `can_publish` were moved from the exposed `public` schema into `app_private`. All 35 affected RLS policy expressions were updated to use the private functions. No application code calls those helpers through RPC.

The remaining Supabase security adviser notices are:

- `pg_trgm` extension installed in `public`. This should be moved only after validating dependent indexes/operator classes on staging.
- `bootstrap_first_admin()` is intentionally callable only until the first approved Super Admin is created. On success it automatically revokes authenticated execution.
