drop policy if exists "public assigned ad creatives" on public.ad_creatives;
create policy "public assigned ad creatives"
on public.ad_creatives
for select
to public
using (
  exists (
    select 1
    from public.ad_assignments a
    where a.creative_id = ad_creatives.id
      and a.is_active = true
      and (a.starts_at is null or a.starts_at <= now())
      and (a.ends_at is null or a.ends_at >= now())
  )
);
