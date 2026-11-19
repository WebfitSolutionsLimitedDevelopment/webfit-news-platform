-- Add Your Logo (webfitnews.com/addYourLogo): a free tool for community groups and
-- non-profits to put their own logo on their own photos.
-- Signed-in (Google) users only, at most 5 images per New Zealand calendar day,
-- results kept 30 days in a private bucket and handed out through signed links.

create table if not exists public.logo_studio_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','ready')),
  output_path text,
  filename text,
  width int,
  height int,
  bytes int
);
create index if not exists logo_studio_jobs_user_created on public.logo_studio_jobs (user_id, created_at desc);

alter table public.logo_studio_jobs enable row level security;
drop policy if exists "Users read their own logo jobs" on public.logo_studio_jobs;
create policy "Users read their own logo jobs" on public.logo_studio_jobs
  for select to authenticated using (user_id = (select auth.uid()));
-- No insert/update/delete policies: only the server (service role) writes.

-- Claims one of today's 5 slots, atomically per user (two uploads at once can't both take the 5th).
create or replace function public.claim_logo_slot(p_user uuid, p_limit int default 5)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  day_start timestamptz := (date_trunc('day', now() at time zone 'Pacific/Auckland')) at time zone 'Pacific/Auckland';
  used int;
  new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('logo_slot:' || p_user::text));
  select count(*) into used from public.logo_studio_jobs where user_id = p_user and created_at >= day_start;
  if used >= p_limit then return null; end if;
  insert into public.logo_studio_jobs (user_id) values (p_user) returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.claim_logo_slot(uuid, int) from public, anon, authenticated;
grant execute on function public.claim_logo_slot(uuid, int) to service_role;

-- Private bucket; files are reached only through short-lived signed links made by the server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logo-studio', 'logo-studio', false, 10485760, array['image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
