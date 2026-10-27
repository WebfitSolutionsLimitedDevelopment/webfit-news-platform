-- First-party readership analytics: every public page view, stored in our own database.
-- Readers get a random ID kept in their browser (no name, email or IP address is stored),
-- so the newsroom can count unique and returning readers.

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  path text not null,
  kind text not null default 'other',            -- article | home | epaper | section | other
  article_id uuid references public.articles(id) on delete set null,
  visitor_id uuid,                                 -- random ID from the reader's browser
  is_returning boolean not null default false,     -- browser has visited before
  source text not null default 'direct',           -- google | facebook | whatsapp | newsletter | ...
  referrer_host text,
  utm_source text,
  device text,                                     -- mobile | tablet | desktop
  country text,                                    -- two-letter code from Vercel
  seconds integer not null default 0,              -- time with the page visible
  max_scroll smallint not null default 0,          -- furthest point reached, percent
  is_read boolean not null default false           -- 30+ seconds or 75%+ scrolled
);
create index if not exists page_views_occurred_idx on public.page_views (occurred_at desc);
create index if not exists page_views_article_idx on public.page_views (article_id, occurred_at desc) where article_id is not null;

alter table public.page_views enable row level security;
revoke all on public.page_views from anon, authenticated;
grant select on public.page_views to authenticated;
drop policy if exists "newsroom reads page views" on public.page_views;
create policy "newsroom reads page views" on public.page_views for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active and p.role in ('super_admin','editor')));

-- Record one page view. Called by the /api/track server route, which drops bots first.
create or replace function public.record_page_view(
  p_path text, p_visitor uuid, p_returning boolean, p_referrer_host text, p_utm text, p_device text, p_country text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_path text := left(coalesce(p_path, '/'), 300);
  v_ref text := lower(left(nullif(p_referrer_host, ''), 120));
  v_utm text := lower(left(nullif(p_utm, ''), 60));
  v_article uuid;
  v_kind text;
  v_source text;
  v_id uuid;
begin
  if v_path !~ '^/' or v_path ~ '^/(admin|api|login|auth)(/|$)' then return null; end if;
  if v_path ~ '^/[^/]+$' then
    select id into v_article from articles where slug = substr(v_path, 2) and status = 'published' limit 1;
  end if;
  v_kind := case
    when v_article is not null then 'article'
    when v_path = '/' then 'home'
    when v_path ~ '^/epaper' then 'epaper'
    when v_path ~ '^/(category|section|world|immigration|topic)(/|$)' then 'section'
    else 'other' end;
  v_source := case
    when v_utm ~ 'newsletter|email' then 'newsletter'
    when v_utm ~ 'whatsapp' or v_ref ~ 'whatsapp|wa\.me' then 'whatsapp'
    when v_utm ~ 'facebook|^fb|instagram|^ig' or v_ref ~ '(^|\.)(facebook|fb|instagram|messenger)\.' then 'facebook'
    when v_ref ~ '(^|\.)google\.' or v_ref ~ 'googleapis|^android-app' then 'google'
    when v_ref ~ '(^|\.)(bing|duckduckgo|yahoo|ecosia|search\.brave)\.' then 'other search'
    when v_ref ~ '(^|\.)(t\.co|x\.com|twitter\.com|linkedin\.com|reddit\.com|threads\.net|lnkd\.in)' then 'other social'
    when v_ref ~ 'webfitnews\.' then 'internal'
    when v_ref is null and v_utm is null then 'direct'
    else 'other sites' end;
  insert into page_views (path, kind, article_id, visitor_id, is_returning, source, referrer_host, utm_source, device, country)
  values (v_path, v_kind, v_article, p_visitor, coalesce(p_returning, false), v_source, v_ref, v_utm,
          case when p_device in ('mobile','tablet','desktop') then p_device end,
          case when p_country ~ '^[A-Z]{2}$' then p_country end)
  returning id into v_id;
  if v_article is not null then
    update articles set view_count = coalesce(view_count, 0) + 1 where id = v_article;
  end if;
  return v_id;
end $$;

-- Reading time and scroll depth for a view: only from the same browser, within 3 hours.
create or replace function public.update_page_view(p_id uuid, p_visitor uuid, p_seconds integer, p_scroll integer)
returns void language sql security definer set search_path = public as $$
  update page_views set
    seconds = greatest(seconds, least(greatest(coalesce(p_seconds, 0), 0), 3600)),
    max_scroll = greatest(max_scroll, least(greatest(coalesce(p_scroll, 0), 0), 100)),
    is_read = is_read or coalesce(p_seconds, 0) >= 30 or coalesce(p_scroll, 0) >= 75
  where id = p_id and visitor_id = p_visitor and occurred_at > now() - interval '3 hours';
$$;

revoke all on function public.record_page_view(text, uuid, boolean, text, text, text, text) from public;
revoke all on function public.update_page_view(uuid, uuid, integer, integer) from public;
grant execute on function public.record_page_view(text, uuid, boolean, text, text, text, text) to anon, authenticated;
grant execute on function public.update_page_view(uuid, uuid, integer, integer) to anon, authenticated;

-- The whole dashboard in one call. Runs as the signed-in user, so the
-- table's read policy (super admins and editors) still applies.
create or replace function public.readership_report(p_from timestamptz, p_to timestamptz, p_article uuid default null)
returns jsonb language sql stable security invoker set search_path = public as $$
  with v as (
    select * from page_views
    where occurred_at >= p_from and occurred_at < p_to
      and (p_article is null or article_id = p_article)
  ),
  hourly as (select (p_to - p_from) <= interval '2 days' as by_hour)
  select jsonb_build_object(
    'totals', (select jsonb_build_object(
        'views', count(*),
        'readers', count(distinct visitor_id),
        'returning', count(distinct visitor_id) filter (where is_returning),
        'articleViews', count(*) filter (where kind = 'article'),
        'reads', count(*) filter (where kind = 'article' and is_read),
        'avgSeconds', coalesce(round(avg(seconds) filter (where kind = 'article' and seconds > 0)), 0),
        'mobile', count(*) filter (where device = 'mobile'),
        'epaper', count(*) filter (where kind = 'epaper')
      ) from v),
    'trend', coalesce((select jsonb_agg(jsonb_build_object('t', t, 'views', views, 'readers', readers) order by t) from (
        select case when (select by_hour from hourly)
               then to_char(date_trunc('hour', occurred_at at time zone 'Pacific/Auckland'), 'YYYY-MM-DD"T"HH24')
               else to_char(date_trunc('day', occurred_at at time zone 'Pacific/Auckland'), 'YYYY-MM-DD') end as t,
               count(*) as views, count(distinct visitor_id) as readers
        from v group by 1) x), '[]'::jsonb),
    'articles', coalesce((select jsonb_agg(row_to_json(x) order by x.views desc) from (
        select a.id, a.title, a.slug, a.published_at,
               count(*) as views, count(distinct v.visitor_id) as readers,
               count(*) filter (where v.is_read) as reads,
               coalesce(round(avg(v.seconds) filter (where v.seconds > 0)), 0) as "avgSeconds",
               mode() within group (order by v.source) as "topSource"
        from v join articles a on a.id = v.article_id
        group by a.id, a.title, a.slug, a.published_at
        order by count(*) desc limit 60) x), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('name', source, 'views', n) order by n desc) from (select source, count(*) n from v group by 1) x), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(jsonb_build_object('name', coalesce(device, 'unknown'), 'views', n) order by n desc) from (select device, count(*) n from v group by 1) x), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(jsonb_build_object('name', coalesce(country, '??'), 'views', n) order by n desc) from (select country, count(*) n from v group by 1 order by 2 desc limit 8) x), '[]'::jsonb),
    'kinds', coalesce((select jsonb_agg(jsonb_build_object('name', kind, 'views', n) order by n desc) from (select kind, count(*) n from v group by 1) x), '[]'::jsonb),
    'referrers', coalesce((select jsonb_agg(jsonb_build_object('name', referrer_host, 'views', n) order by n desc) from (select referrer_host, count(*) n from v where referrer_host is not null and referrer_host !~ 'webfitnews\.' group by 1 order by 2 desc limit 10) x), '[]'::jsonb),
    'live', (select count(distinct visitor_id) from page_views where occurred_at > now() - interval '5 minutes' and (p_article is null or article_id = p_article))
  );
$$;
grant execute on function public.readership_report(timestamptz, timestamptz, uuid) to authenticated;
