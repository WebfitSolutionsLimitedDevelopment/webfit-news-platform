drop policy if exists "public read media" on public.media;
create policy "public read media"
on public.media
for select
to public
using (
  migration_status is null
  or migration_status in ('done','pending','migrated')
);
