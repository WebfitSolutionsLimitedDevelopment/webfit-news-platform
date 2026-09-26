-- Add video posters and a narrowly scoped public projection of campaigns that may render.
alter table public.ad_creatives
  add column if not exists poster_media_id uuid references public.media(id) on delete set null;

create index if not exists ad_creatives_poster_media_id_idx
  on public.ad_creatives(poster_media_id)
  where poster_media_id is not null;

-- This view deliberately runs as its owner so the public site can honor campaign
-- status and date windows without granting public access to campaign notes or names.
-- Keep the projection limited to the creative fields a reader can already see.
create or replace view public.public_ad_placements
with (security_invoker = false, security_barrier = true)
as
select
  a.id as assignment_id,
  s.key as slot_key,
  c.headline,
  c.destination_url,
  c.alt_text as creative_alt_text,
  m.public_url as media_url,
  m.mime_type as media_mime_type,
  m.alt_text as media_alt_text,
  poster.public_url as poster_url,
  m.width as media_width,
  m.height as media_height,
  a.priority
from public.ad_slots s
join public.ad_assignments a on a.slot_id = s.id
join public.ad_creatives c on c.id = a.creative_id
join public.ad_campaigns campaign on campaign.id = c.campaign_id
join public.media m on m.id = c.media_id
left join public.media poster on poster.id = c.poster_media_id
where s.is_active = true
  and a.is_active = true
  and (a.starts_at is null or a.starts_at <= now())
  and (a.ends_at is null or a.ends_at >= now())
  and campaign.status = 'active'
  and (campaign.starts_at is null or campaign.starts_at <= now())
  and (campaign.ends_at is null or campaign.ends_at >= now())
  and (m.mime_type like 'image/%' or m.mime_type in ('video/mp4', 'video/quicktime'))
  and (s.key <> 'MOBILE_STICKY' or m.mime_type like 'image/%');

revoke all on public.public_ad_placements from public;
grant select on public.public_ad_placements to anon, authenticated;

comment on view public.public_ad_placements is
  'Public-safe ad projection. Exposes only active, in-date placements and creative fields required for rendering; never add advertiser or campaign notes.';

