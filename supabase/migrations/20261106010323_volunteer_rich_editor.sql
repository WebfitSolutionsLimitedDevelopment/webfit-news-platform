-- Keep volunteer edits scoped to their own drafts and rejected stories.
alter policy "volunteers update own drafts" on public.articles
  using ((select app_private.current_user_role())::text = 'volunteer'
    and created_by = (select auth.uid()) and status in ('draft', 'rejected'));

create policy "volunteers manage own story categories" on public.article_categories
  for all to authenticated
  using ((select app_private.current_user_role())::text = 'volunteer' and exists (
    select 1 from public.articles a where a.id = article_id and a.created_by = (select auth.uid()) and a.status = 'draft'))
  with check ((select app_private.current_user_role())::text = 'volunteer' and exists (
    select 1 from public.articles a where a.id = article_id and a.created_by = (select auth.uid()) and a.status = 'draft'));

create policy "volunteers manage own story tags" on public.article_tags
  for all to authenticated
  using ((select app_private.current_user_role())::text = 'volunteer' and exists (
    select 1 from public.articles a where a.id = article_id and a.created_by = (select auth.uid()) and a.status = 'draft'))
  with check ((select app_private.current_user_role())::text = 'volunteer' and exists (
    select 1 from public.articles a where a.id = article_id and a.created_by = (select auth.uid()) and a.status = 'draft'));

create policy "volunteers add tags" on public.tags for insert to authenticated
  with check ((select app_private.current_user_role())::text = 'volunteer'
    and char_length(name) between 1 and 80 and char_length(slug) between 1 and 100);

create or replace function public.article_review_rules() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_writer boolean := app_private.is_writer();
  v_author uuid;
  v_volunteer boolean := app_private.current_user_role()::text = 'volunteer';
begin
  if v_writer then
    if tg_op = 'INSERT' then new.created_by := auth.uid(); else new.created_by := old.created_by; end if;
    if new.status not in ('draft','in_review') then
      raise exception 'Reporters can save drafts and submit for review only';
    end if;
    -- Their byline is the author profile linked to their login; they cannot pick another.
    select id into v_author from public.authors where profile_id = auth.uid() and is_active limit 1;
    new.author_id := v_author;
    if v_volunteer then
      if v_author is null then
        raise exception 'A volunteer needs an active byline before submitting a story';
      end if;
      if new.featured_media_id is not null
        and (tg_op = 'INSERT' or new.featured_media_id is distinct from old.featured_media_id)
        and not exists (select 1 from public.media where id = new.featured_media_id and uploaded_by = auth.uid()) then
        raise exception 'Volunteers can only attach their own uploads';
      end if;
      new.canonical_url := null;
    end if;
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

  if new.status::text = 'rejected' and (tg_op = 'INSERT' or old.status::text <> 'rejected') then
    if tg_op <> 'UPDATE' or old.status <> 'in_review' or not app_private.can_publish()
        or btrim(coalesce(new.review_note, '')) = '' then
      raise exception 'An editor can reject a story awaiting review with a reason';
    end if;
    new.reviewed_by := auth.uid(); new.reviewed_at := now();
    insert into public.article_reviews (article_id, actor_id, action, note)
      values (new.id, auth.uid(), 'rejected', new.review_note);
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

