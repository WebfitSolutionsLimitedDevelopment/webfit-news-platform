-- v6.0: auto-assign a category to published stories an editor left uncategorised,
-- and add the e-paper advertising positions.
--
-- How the rule works
--   * category_rules holds keyword lists per category. Each rule has a weight so a
--     topic (Politics, Sports) beats a place (Auckland, New Zealand) when both match.
--   * A story is scored against every rule: a keyword in the headline counts 3, in a
--     tag 2, in the excerpt 1, multiplied by the rule weight.
--   * The best category becomes primary. A second category is added when it scores at
--     least half as well, so a Politics story set in Auckland also shows in Auckland.
--   * No match at all: the story goes to "New Zealand" (the site's home section).
--   * Only stories with NO categories are touched. Anything an editor sets always wins;
--     saving a story in the CMS replaces the auto categories with the editor's choice.
--   * pg_cron runs the rule every 10 minutes for stories published at least 5 minutes
--     ago, so the CMS has finished writing categories before the rule looks.

alter table public.article_categories
  add column if not exists assigned_by text not null default 'editor'
  check (assigned_by in ('editor', 'auto'));

create table if not exists public.category_rules (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  keywords text[] not null,
  weight integer not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.category_rules enable row level security;

drop policy if exists "category_rules staff read" on public.category_rules;
create policy "category_rules staff read" on public.category_rules
  for select to authenticated using (true);

-- Seed rules (idempotent: one row per category slug).
with seed(slug, weight, keywords) as (values
  ('politics', 30, array['election','elections','labour','national party','act party','act leader','greens','green party','nz first','new zealand first','te pāti māori','te pati maori','luxon','hipkins','seymour','winston peters','swarbrick','chlöe swarbrick','parliament','mp','mps','poll','debate','candidate','candidates','electorate','minister','prime minister','cabinet','policy','campaign','electoral','by-election','coalition','opposition','party list','writ','voters','voter','select committee','government']),
  ('sports', 30, array['cricket','rugby','football','netball','field hockey','ice hockey','black sticks','tennis','golf','racing','thoroughbred','athletics','olympic','olympics','commonwealth games','asian games','world cup','t20','odi','test match','white ferns','black caps','blackcaps','all blacks','black ferns','silver ferns','super rugby','nzc','tournament','medal','medals','squad','coach','league','nrl','a-league']),
  ('india', 25, array['india','indian','bollywood','diwali','modi','delhi','new delhi','mumbai','punjab','gujarat','kerala','hindi','navratri','holi','bcci','rupee']),
  ('immigration', 28, array['visa','visas','immigration','inz','immigration new zealand','residence','residency','work visa','student visa','visitor visa','skilled migrant','aewv','migrant','migrants','international students','citizenship','deportation','refugee']),
  ('health', 22, array['health','health nz','hospital','hospitals','cancer','screening','pharmac','medicine','medicines','nurse','nurses','doctor','doctors','gp','patients','mental health','vaccine','disease','surgery','bird flu']),
  ('business', 20, array['business','businesses','economy','economic','exports','export','trade','retail','retailers','company','companies','profit','revenue','tax rate','mortgage','mortgages','housing market','property','interest rates','reserve bank','ocr','inflation','jobs','employment','airline','air new zealand','electricity','energy','farmers','federated farmers','aquaculture','tourism','startup','investment']),
  ('crime-courts', 22, array['police','court','courts','arrest','arrested','charged','sentenced','sentence','judge','trial','jail','prison','murder','assault','theft','burglary','vandalism','vandalised','fraud','scam','investigation','ombudsman']),
  ('arts-culture', 18, array['art','arts','artist','artwork','gallery','exhibition','festival','theatre','dance','orchestra','concert','music','musician','film','cinema','book','author','wearable arts','wow','kapa haka','te matatini','culture','museum']),
  ('fashion', 26, array['beauty','fashion','skincare','skin care','makeup','make-up','cosmetics','salon','stylist','designer','runway','bridal','wedding','jewellery','spa','wellness','grooming','pageant']),
  ('lifestyle-culture', 14, array['lifestyle','food','recipe','recipes','restaurant','cafe','dumpling','travel','holiday','holidays','garden','gardens','blossom','expo','family','parenting','christmas','seniors','pets']),
  ('world', 16, array['united states','usa','america','american','uk','britain','united kingdom','europe','china','japan','korea','north korea','singapore','malaysia','indonesia','israel','ukraine','russia','united nations','gaza','canada','ireland','northern ireland','pakistan','sri lanka','nepal','bangladesh','fiji','samoa','tonga','trump','white house','congress','us senate','us federal','medicaid','washington dc']),
  ('australia', 20, array['australia','australian','sydney','melbourne','brisbane','perth','adelaide','canberra','tasmania','queensland','victoria','nsw']),
  ('auckland', 12, array['auckland','aucklanders','manukau','mount roskill','mount albert','epsom','botany','north shore','papakura','henderson','waitematā','waitemata','pukekohe','drury','takanini','otahuhu','papatoetoe','sandringham','albany','waiheke','watercare','auckland council','auckland transport']),
  ('communities', 15, array['community','communities','association','club','temple','gurdwara','church','volunteers','volunteer','charity','fundraiser','students','school','schools','kiwi-indian','diaspora','pacific community']),
  ('new-zealand', 5, array['new zealand','nz','aotearoa','kiwi','kiwis','council','wellington','christchurch','hamilton','tauranga','dunedin','queenstown','nelson','napier','hawke''s bay','otago','canterbury','waikato','northland','bay of plenty','taranaki','southland','nzta','nzdf','navy','education','national park','conservation','department of conservation'])
)
insert into public.category_rules (category_id, keywords, weight)
select c.id, s.keywords, s.weight
from seed s
join public.categories c on c.slug = s.slug
where not exists (select 1 from public.category_rules r where r.category_id = c.id);

-- Score one story against every active rule. Returns best categories first.
create or replace function public.score_article_categories(p_article_id uuid)
returns table(category_id uuid, score integer)
language sql
stable
security definer
set search_path = public
as $$
  with a as (
    select ' ' || lower(coalesce(title, '')) || ' ' as title_text,
           ' ' || lower(regexp_replace(coalesce(excerpt, ''), '<[^>]*>', ' ', 'g')) || ' ' as excerpt_text,
           ' ' || lower(coalesce((
             select string_agg(t.name, ' | ')
             from article_tags at join tags t on t.id = at.tag_id
             where at.article_id = articles.id
           ), '')) || ' ' as tag_text
    from articles where id = p_article_id
  ), hits as (
    select r.category_id, r.weight, k.keyword,
           ('\m' || regexp_replace(k.keyword, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g') || '\M') as pattern
    from category_rules r
    cross join lateral unnest(r.keywords) as k(keyword)
    join categories c on c.id = r.category_id and c.is_active
    where r.is_active
  )
  select h.category_id,
         (sum(
           (case when a.title_text ~* h.pattern then 3 else 0 end)
         + (case when a.tag_text ~* h.pattern then 2 else 0 end)
         + (case when a.excerpt_text ~* h.pattern then 1 else 0 end)
         ) * max(h.weight))::integer as score
  from hits h cross join a
  group by h.category_id
  having sum(
           (case when a.title_text ~* h.pattern then 3 else 0 end)
         + (case when a.tag_text ~* h.pattern then 2 else 0 end)
         + (case when a.excerpt_text ~* h.pattern then 1 else 0 end)) > 0
  order by 2 desc;
$$;

-- Assign categories to one story if, and only if, it has none.
create or replace function public.auto_categorise_article(p_article_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_top record;
  v_second record;
  v_fallback uuid;
  v_count integer := 0;
begin
  if exists (select 1 from article_categories where article_id = p_article_id) then
    return 0;
  end if;

  select * into v_top from score_article_categories(p_article_id) limit 1;

  if v_top.category_id is null then
    select id into v_fallback from categories where slug = 'new-zealand' and is_active;
    if v_fallback is null then return 0; end if;
    insert into article_categories (article_id, category_id, is_primary, assigned_by)
    values (p_article_id, v_fallback, true, 'auto');
    return 1;
  end if;

  insert into article_categories (article_id, category_id, is_primary, assigned_by)
  values (p_article_id, v_top.category_id, true, 'auto');
  v_count := 1;

  select * into v_second
  from score_article_categories(p_article_id) s
  where s.category_id <> v_top.category_id
  limit 1;

  if v_second.category_id is not null and v_second.score * 2 >= v_top.score then
    insert into article_categories (article_id, category_id, is_primary, assigned_by)
    values (p_article_id, v_second.category_id, false, 'auto');
    v_count := 2;
  end if;

  return v_count;
end;
$$;

-- Run the rule over every published, uncategorised story (older than p_grace).
create or replace function public.auto_categorise_uncategorised(p_grace interval default interval '5 minutes')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_total integer := 0;
begin
  for r in
    select a.id from articles a
    where a.status = 'published'
      and a.published_at <= now() - p_grace
      and not exists (select 1 from article_categories ac where ac.article_id = a.id)
    order by a.published_at desc
  loop
    if auto_categorise_article(r.id) > 0 then
      v_total := v_total + 1;
    end if;
  end loop;
  return v_total;
end;
$$;

revoke all on function public.score_article_categories(uuid) from public, anon, authenticated;
revoke all on function public.auto_categorise_article(uuid) from public, anon, authenticated;
revoke all on function public.auto_categorise_uncategorised(interval) from public, anon, authenticated;

-- Every 10 minutes.
select cron.unschedule(jobid) from cron.job where jobname = 'auto-categorise-stories';
select cron.schedule('auto-categorise-stories', '*/10 * * * *', $$select public.auto_categorise_uncategorised();$$);

-- E-paper ad positions (portrait, A4 proportions).
insert into public.ad_slots (key, label, description, allowed_devices, recommended_width, recommended_height, is_active)
select v.key, v.label, v.description, array['desktop','mobile']::text[], v.w, v.h, true
from (values
  ('EPAPER_FULL_PAGE', 'E-paper: full page', 'A full page between sections of the /epaper edition. Portrait artwork, A4 proportions.', 1240, 1754),
  ('EPAPER_HALF_PAGE', 'E-paper: half page', 'Bottom half of an e-paper section page. Landscape artwork.', 1240, 860)
) as v(key, label, description, w, h)
where not exists (select 1 from public.ad_slots s where s.key = v.key);
