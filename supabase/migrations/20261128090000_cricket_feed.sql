-- Last good CricketData answers, so the site asks the provider at most once per
-- interval (whatever the traffic or region) and keeps a score if the provider fails.
create table if not exists public.cricket_feed (
  key text primary key,
  data jsonb,
  ok_at timestamptz,
  tried_at timestamptz not null default now(),
  error text
);
alter table public.cricket_feed enable row level security;
-- No policies: only the server (service role) reads or writes this table.

-- Claims the right to call the provider for this key if the last try is older than
-- p_seconds. Only one caller wins, so a burst of page views spends one API call.
create or replace function public.cricket_feed_claim(p_key text, p_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare won boolean;
begin
  insert into cricket_feed(key, tried_at) values (p_key, now())
  on conflict (key) do update set tried_at = now()
    where cricket_feed.tried_at < now() - make_interval(secs => p_seconds)
  returning true into won;
  return coalesce(won, false);
end $$;
revoke all on function public.cricket_feed_claim(text, int) from public, anon, authenticated;
