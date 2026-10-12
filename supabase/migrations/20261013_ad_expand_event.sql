-- Ads: count "expand" (reader tapped a poster to see it larger) as its own event.
-- Additive: existing events, callers and the e-paper are unaffected.

alter table public.ad_events drop constraint if exists ad_events_event_type_check;
alter table public.ad_events add constraint ad_events_event_type_check
  check (event_type in ('impression','click','expand','video_start','video_complete'));

create or replace function public.record_ad_event(p_assignment uuid, p_event text, p_device text default null)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_creative uuid;
  v_slot text;
  v_url text;
begin
  if p_event not in ('impression','click','expand','video_start','video_complete') then
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
$function$;

-- Performance with enlargements. New name, so the existing ad_performance stays as is.
create or replace function public.ad_performance_v2(p_since timestamptz default (now() - interval '30 days'))
returns table(creative_id uuid, impressions bigint, clicks bigint, expands bigint, video_starts bigint, video_completes bigint)
language sql
stable
set search_path to 'public'
as $function$
  select e.creative_id,
         count(*) filter (where e.event_type = 'impression'),
         count(*) filter (where e.event_type = 'click'),
         count(*) filter (where e.event_type = 'expand'),
         count(*) filter (where e.event_type = 'video_start'),
         count(*) filter (where e.event_type = 'video_complete')
  from ad_events e
  where e.occurred_at >= p_since and e.creative_id is not null
  group by e.creative_id;
$function$;
revoke execute on function public.ad_performance_v2(timestamptz) from public, anon;
grant execute on function public.ad_performance_v2(timestamptz) to authenticated, service_role;
