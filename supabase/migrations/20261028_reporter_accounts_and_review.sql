-- Reporter accounts and the submit / approve / send-back workflow.
--
-- Roles:
--   super_admin, editor  -> reviewers: see every story, publish, send back with a comment.
--   contributor, journalist -> reporters: see and edit only their own stories, can save drafts
--                              and submit for review, can never publish or change their own byline.
--
-- Story states for a reporter:
--   draft      -> they are writing it (or it came back with a comment: review_note is set)
--   in_review  -> submitted, locked for them until an editor acts
--   published  -> live, locked for them

-- 1. Who wrote it, and the review trail on each story
alter table public.articles add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.articles alter column created_by set default auth.uid();
alter table public.articles add column if not exists submitted_at timestamptz;
alter table public.articles add column if not exists review_note text;
alter table public.articles add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.articles add column if not exists reviewed_at timestamptz;
create index if not exists articles_created_by_idx on public.articles (created_by, updated_at desc);
create index if not exists articles_review_queue_idx on public.articles (submitted_at) where status = 'in_review';

-- Mobile number for staff and reporters (newsroom use only, never shown publicly).
alter table public.profiles add column if not exists phone text;

create table if not exists public.article_reviews (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('submitted','returned','published')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists article_reviews_article_idx on public.article_reviews (article_id, created_at desc);

-- 2. Role helpers
create or replace function app_private.is_writer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active and role in ('contributor','journalist'));
$$;

-- 3. Rules a reporter's save can never break, whatever the browser sends; plus the review trail.
create or replace function public.article_review_rules() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_writer boolean := app_private.is_writer();
  v_author uuid;
begin
  if v_writer then
    if tg_op = 'INSERT' then new.created_by := auth.uid(); else new.created_by := old.created_by; end if;
    if new.status not in ('draft','in_review') then
      raise exception 'Reporters can save drafts and submit for review only';
    end if;
    -- Their byline is the author profile linked to their login; they cannot pick another.
    select id into v_author from public.authors where profile_id = auth.uid() and is_active limit 1;
    new.author_id := v_author;
    new.is_breaking := false; new.is_featured := false; new.is_editor_pick := false; new.is_homepage_hero := false;
    new.published_at := null; new.scheduled_at := null;
    if tg_op = 'UPDATE' then
      new.review_note := old.review_note; new.reviewed_by := old.reviewed_by; new.reviewed_at := old.reviewed_at;
    else
      new.review_note := null; new.reviewed_by := null; new.reviewed_at := null;
    end if;
  end if;

  -- Submitted (logged in the after-insert trigger for brand-new stories, since the row does not exist yet)
  if new.status = 'in_review' and (tg_op = 'INSERT' or old.status is distinct from 'in_review') then
    new.submitted_at := now();
    new.review_note := null; -- the comment stays in the review trail
    if tg_op = 'UPDATE' then
      insert into public.article_reviews (article_id, actor_id, action) values (new.id, auth.uid(), 'submitted');
    end if;
  end if;

  if tg_op = 'UPDATE' and not v_writer and old.status = 'in_review' then
    -- Sent back with a comment
    if new.status = 'draft' then
      if btrim(coalesce(new.review_note, '')) = '' then
        raise exception 'Add a comment for the reporter when sending a story back';
      end if;
      new.reviewed_by := auth.uid(); new.reviewed_at := now();
      insert into public.article_reviews (article_id, actor_id, action, note) values (new.id, auth.uid(), 'returned', new.review_note);
    -- Approved
    elsif new.status in ('published','scheduled') then
      new.reviewed_by := auth.uid(); new.reviewed_at := now(); new.review_note := null;
      insert into public.article_reviews (article_id, actor_id, action) values (new.id, auth.uid(), 'published');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_article_review_rules on public.articles;
create trigger trg_article_review_rules before insert or update on public.articles
  for each row execute function public.article_review_rules();

create or replace function public.article_review_log_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'in_review' then
    insert into public.article_reviews (article_id, actor_id, action) values (new.id, auth.uid(), 'submitted');
  end if;
  return null;
end $$;

drop trigger if exists trg_article_review_log_insert on public.articles;
create trigger trg_article_review_log_insert after insert on public.articles
  for each row execute function public.article_review_log_insert();

-- 4. Who can see and change stories
drop policy if exists "staff read articles" on public.articles;
create policy "staff read articles" on public.articles for select to authenticated
  using (app_private.is_staff() and (not app_private.is_writer() or created_by = auth.uid()));

drop policy if exists "staff insert articles" on public.articles;
create policy "staff insert articles" on public.articles for insert to authenticated
  with check (app_private.is_staff() and (not app_private.is_writer() or status in ('draft','in_review')));

drop policy if exists "staff update articles" on public.articles;
create policy "staff update articles" on public.articles for update to authenticated
  using (app_private.is_staff() and (not app_private.is_writer() or (created_by = auth.uid() and status = 'draft')))
  with check (app_private.is_staff() and (not app_private.is_writer() or (created_by = auth.uid() and status in ('draft','in_review'))));

-- Categories, tags and revision history follow the story they belong to.
drop policy if exists "staff manage article categories" on public.article_categories;
create policy "staff manage article categories" on public.article_categories for all to authenticated
  using (app_private.is_staff() and (not app_private.is_writer() or exists (select 1 from public.articles a where a.id = article_id and a.created_by = auth.uid() and a.status = 'draft')))
  with check (app_private.is_staff() and (not app_private.is_writer() or exists (select 1 from public.articles a where a.id = article_id and a.created_by = auth.uid() and a.status = 'draft')));

drop policy if exists "staff manage article tags" on public.article_tags;
create policy "staff manage article tags" on public.article_tags for all to authenticated
  using (app_private.is_staff() and (not app_private.is_writer() or exists (select 1 from public.articles a where a.id = article_id and a.created_by = auth.uid() and a.status = 'draft')))
  with check (app_private.is_staff() and (not app_private.is_writer() or exists (select 1 from public.articles a where a.id = article_id and a.created_by = auth.uid() and a.status = 'draft')));

drop policy if exists "staff revisions" on public.article_revisions;
create policy "staff revisions" on public.article_revisions for all to authenticated
  using (app_private.is_staff() and (not app_private.is_writer() or exists (select 1 from public.articles a where a.id = article_id and a.created_by = auth.uid())))
  with check (app_private.is_staff() and (not app_private.is_writer() or exists (select 1 from public.articles a where a.id = article_id and a.created_by = auth.uid())));

-- Reporters can browse and upload images, but only change or remove their own uploads.
drop policy if exists "staff manage media" on public.media;
drop policy if exists "staff read media" on public.media;
drop policy if exists "staff add media" on public.media;
drop policy if exists "staff change media" on public.media;
drop policy if exists "staff remove media" on public.media;
create policy "staff read media" on public.media for select to authenticated using (app_private.is_staff());
create policy "staff add media" on public.media for insert to authenticated with check (app_private.is_staff());
-- Reporters may describe and caption their own uploads, or library images not yet on a live story.
create policy "staff change media" on public.media for update to authenticated
  using (app_private.is_staff() and (not app_private.is_writer() or uploaded_by = auth.uid()
         or not exists (select 1 from public.articles a where a.featured_media_id = media.id and a.status = 'published')))
  with check (app_private.is_staff());
create policy "staff remove media" on public.media for delete to authenticated
  using (app_private.is_staff() and (not app_private.is_writer() or uploaded_by = auth.uid()));

-- Review trail: reviewers see all, reporters see their own stories' trail. Written only by the trigger.
alter table public.article_reviews enable row level security;
revoke all on public.article_reviews from anon, authenticated;
grant select on public.article_reviews to authenticated;
drop policy if exists "review trail read" on public.article_reviews;
create policy "review trail read" on public.article_reviews for select to authenticated
  using (app_private.can_publish() or exists (select 1 from public.articles a where a.id = article_id and a.created_by = auth.uid()));

-- Inline story images follow their story; videos are newsroom-only.
drop policy if exists "staff inline media manage" on public.article_inline_media;
create policy "staff inline media manage" on public.article_inline_media for all to authenticated
  using (app_private.is_staff() and (not app_private.is_writer() or exists (select 1 from public.articles a where a.id = article_id and a.created_by = auth.uid() and a.status = 'draft')))
  with check (app_private.is_staff() and (not app_private.is_writer() or exists (select 1 from public.articles a where a.id = article_id and a.created_by = auth.uid() and a.status = 'draft')));

drop policy if exists "staff videos" on public.videos;
create policy "staff videos" on public.videos for all to authenticated
  using (app_private.is_staff() and not app_private.is_writer())
  with check (app_private.is_staff() and not app_private.is_writer());
