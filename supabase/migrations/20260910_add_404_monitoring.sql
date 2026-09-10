create table if not exists public.not_found_events (
  id bigint generated always as identity primary key,
  path text not null check (char_length(path) <= 2048),
  query_string text,
  host text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists not_found_events_created_at_idx
  on public.not_found_events (created_at desc);
create index if not exists not_found_events_path_created_at_idx
  on public.not_found_events (path, created_at desc);

alter table public.not_found_events enable row level security;

create policy "active newsroom users can read 404 events"
on public.not_found_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role in ('super_admin','editor')
  )
);

create or replace function public.log_not_found_event(
  p_path text,
  p_query_string text default null,
  p_host text default null,
  p_referrer text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_path is null or left(p_path, 1) <> '/' then
    return;
  end if;

  insert into public.not_found_events(path, query_string, host, referrer, user_agent)
  values (
    left(p_path, 2048),
    nullif(left(coalesce(p_query_string, ''), 2048), ''),
    nullif(left(coalesce(p_host, ''), 255), ''),
    nullif(left(coalesce(p_referrer, ''), 2048), ''),
    nullif(left(coalesce(p_user_agent, ''), 1024), '')
  );
end;
$$;

revoke all on function public.log_not_found_event(text,text,text,text,text) from public;
grant execute on function public.log_not_found_event(text,text,text,text,text) to anon, authenticated;
