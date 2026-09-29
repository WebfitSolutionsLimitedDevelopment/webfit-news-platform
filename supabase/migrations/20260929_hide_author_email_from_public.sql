-- Anonymous visitors (the public website and anyone holding the publishable key)
-- can read author profiles, but not their email address or WordPress login.
-- Signed-in staff keep full access through the "authenticated" role.
revoke select on public.authors from anon;
grant select (id, profile_id, name, slug, title, bio, avatar_url, facebook_url, x_url, linkedin_url, wp_author_id, is_active, created_at, updated_at)
  on public.authors to anon;
