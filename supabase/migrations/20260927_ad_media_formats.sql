-- Advertising: image + video creatives, device targeting, live-ad feed and
-- impression / click tracking. Additive only: existing rows and the current
-- homepage AdSlot queries keep working.

-- 1. Creatives: separate desktop / mobile artwork, video (poster_media_id already
--    exists), CTA and election fields
alter table public.ad_creatives
  add column if not exists format text not null default 'image',
  add column if not exists mobile_media_id uuid references public.media(id) on delete set null,
  add column if not exists video_media_id uuid references public.media(id) on delete set null,
  add column if not exists cta_label text,
  add column if not exists is_election_ad boolean not null default false,
  add column if not exists promoter_statement text,
  add column if not exists authorisation_reference text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.ad_creatives drop constraint if exists ad_creatives_format_check;
alter table public.ad_creatives add constraint ad_creatives_format_check
  check (format in ('image','video'));

alter table public.ad_creatives drop constraint if exists ad_creatives_video_needs_file;
alter table public.ad_creatives add constraint ad_creatives_video_needs_file
  check (format <> 'video' or video_media_id is not null);

alter table public.ad_creatives drop constraint if exists ad_creatives_election_promoter;
alter table public.ad_creatives add constraint ad_creatives_election_promoter
  check (not is_election_ad or length(trim(coalesce(promoter_statement,''))) > 0);

-- 2. Placements: device targeting
alter table public.ad_assignments
  add column if not exists device text not null default 'all';

alter table public.ad_assignments drop constraint if exists ad_assignments_device_check;
alter table public.ad_assignments add constraint ad_assignments_device_check
  check (device in ('all','desktop','mobile'));

-- 3. Inventory: add the sticky article rail, retire positions the layout cannot use
insert into public.ad_slots (key,label,recommended_width,recommended_height,is_active,allowed_devices,description)
select 'ARTICLE_RAIL','Article Sticky Rail',300,600,true,array['desktop'],'Desktop only. Right-hand column of every story, follows the reader down the page. 300x600 or 300x250 image, or video.'
where not exists (select 1 from public.ad_slots where key='ARTICLE_RAIL');

update public.ad_slots set description='Every story, after paragraph 3. Desktop 728x90 or video, mobile 300x250 or video.' where key='ARTICLE_INLINE_1';
update public.ad_slots set description='Longer stories, after paragraph 8. Desktop 728x90, mobile 300x250.' where key='ARTICLE_INLINE_2';
update public.ad_slots set recommended_width=728,recommended_height=90,description='End of every story. Desktop 728x90, mobile 300x250.' where key='ARTICLE_BOTTOM';
update public.ad_slots set description='Mobile only. Bar pinned to the bottom of stories after the reader scrolls. 320x50.' where key='MOBILE_STICKY';
update public.ad_slots set description='Top of section pages. Desktop 970x250, mobile 300x250.' where key='CATEGORY_TOP';
update public.ad_slots set description='Desktop only, top of homepage and stories. 970x90 or 970x250.' where key='HEADER_LEADERBOARD';
update public.ad_slots set description='Homepage after the lead stories. Desktop 970x250, mobile 300x250.' where key='HOME_AFTER_HERO';
update public.ad_slots set description='Homepage mid-page. Desktop 970x250, mobile 300x250. Video supported.' where key='HOME_MIDDLE';
update public.ad_slots set label='Home Feed Break (mobile)',description='Mobile homepage, further down the feed. 300x250.' where key='HOME_SIDEBAR_1';
update public.ad_slots set is_active=false,description='Retired: the article column is too narrow for 970x250 above the story.' where key='ARTICLE_TOP';
update public.ad_slots set is_active=false,description='Retired: the homepage has no sidebar.' where key='HOME_SIDEBAR_2';

-- 4. Events (impressions, clicks, video plays). ad_events already exists
--    from the original schema but was never used (0 rows). Extend it and
--    route all writes through record_ad_event() instead of open inserts.
alter table public.ad_events
  add column if not exists creative_id uuid references public.ad_creatives(id) on delete cascade,
  add column if not exists slot_key text,
  add column if not exists device text;

alter table public.ad_events drop constraint if exists ad_events_event_type_check;
alter table public.ad_events add constraint ad_events_event_type_check
  check (event_type in ('impression','click','video_start','video_complete'));
alter table public.ad_events drop constraint if exists ad_events_device_check;
alter table public.ad_events add constraint ad_events_device_check
  check (device is null or device in ('desktop','mobile'));

create index if not exists ad_events_creative_occurred_idx on public.ad_events (creative_id, occurred_at desc);
create index if not exists ad_events_assignment_occurred_idx on public.ad_events (assignment_id, occurred_at desc);

drop policy if exists "public insert ad events" on public.ad_events;

-- 5. Public feed of ads that are live right now. Security definer so visitors
--    never need read access to campaigns (advertiser notes stay private).
--    Election ads are withheld on and after NZ election day 2026 (7 November):
--    the Electoral Act bars election advertising on polling day.
create or replace function public.get_live_ads()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(row_to_json(x) order by x.slot_key, x.priority desc), '[]'::jsonb)
  from (
    select
      a.id as assignment_id,
      s.key as slot_key,
      a.priority,
      a.device,
      c.id as creative_id,
      c.format,
      c.headline,
      c.destination_url,
      coalesce(nullif(c.alt_text,''), dm.alt_text, c.headline) as alt_text,
      c.cta_label,
      c.is_election_ad,
      c.promoter_statement,
      camp.advertiser_name as advertiser,
      dm.public_url as desktop_image,
      coalesce(pm.public_url, dm.public_url) as poster_image,
      coalesce(mm.public_url, dm.public_url) as mobile_image,
      vm.public_url as video_url
    from ad_assignments a
    join ad_slots s on s.id = a.slot_id and s.is_active
    join ad_creatives c on c.id = a.creative_id
    join ad_campaigns camp on camp.id = c.campaign_id
    left join media dm on dm.id = c.media_id
    left join media mm on mm.id = c.mobile_media_id
    left join media vm on vm.id = c.video_media_id
    left join media pm on pm.id = c.poster_media_id
    where a.is_active
      and (a.starts_at is null or a.starts_at <= now())
      and (a.ends_at is null or a.ends_at >= now())
      and camp.status = 'active'
      and (camp.starts_at is null or camp.starts_at <= now())
      and (camp.ends_at is null or camp.ends_at >= now())
      and (dm.public_url is not null or vm.public_url is not null)
      and not (c.is_election_ad and (now() at time zone 'Pacific/Auckland')::date >= date '2026-11-07')
  ) x;
$$;

revoke all on function public.get_live_ads() from public;
grant execute on function public.get_live_ads() to anon, authenticated;

-- 6. Record an event. Returns the click-through URL so the click route can
--    redirect without trusting a URL from the browser.
create or replace function public.record_ad_event(p_assignment uuid, p_event text, p_device text default null)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_creative uuid;
  v_slot text;
  v_url text;
begin
  if p_event not in ('impression','click','video_start','video_complete') then
    return null;
  end if;

  select c.id, s.key, c.destination_url
    into v_creative, v_slot, v_url
  from ad_assignments a
  join ad_creatives c on c.id = a.creative_id
  join ad_slots s on s.id = a.slot_id
  where a.id = p_assignment;

  if v_creative is null then
    return null;
  end if;

  insert into ad_events (assignment_id, creative_id, slot_key, event_type, device)
  values (p_assignment, v_creative, v_slot, p_event,
          case when p_device in ('desktop','mobile') then p_device else null end);

  return v_url;
end;
$$;

revoke all on function public.record_ad_event(uuid, text, text) from public;
grant execute on function public.record_ad_event(uuid, text, text) to anon, authenticated;

-- 7. Totals per creative for the ad manager (runs as the caller, so RLS on
--    ad_events limits it to advertising staff).
create or replace function public.ad_performance(p_since timestamptz default now() - interval '30 days')
returns table (creative_id uuid, impressions bigint, clicks bigint, video_starts bigint, video_completes bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select e.creative_id,
         count(*) filter (where e.event_type = 'impression'),
         count(*) filter (where e.event_type = 'click'),
         count(*) filter (where e.event_type = 'video_start'),
         count(*) filter (where e.event_type = 'video_complete')
  from ad_events e
  where e.occurred_at >= p_since and e.creative_id is not null
  group by e.creative_id;
$$;

revoke all on function public.ad_performance(timestamptz) from public;
grant execute on function public.ad_performance(timestamptz) to authenticated;
