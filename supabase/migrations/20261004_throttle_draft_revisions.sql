-- CMS drafts now autosave every few seconds. Without a throttle, each autosave
-- would add a row to article_revisions. For articles that are not live, keep
-- at most one revision per 10 minutes. Every edit to a published article is
-- still captured, exactly as before.
create or replace function public.capture_article_revision()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if tg_op = 'UPDATE' and (
    old.title is distinct from new.title or
    old.subtitle is distinct from new.subtitle or
    old.excerpt is distinct from new.excerpt or
    old.content_html is distinct from new.content_html or
    old.content_json is distinct from new.content_json or
    old.seo_title is distinct from new.seo_title or
    old.meta_description is distinct from new.meta_description or
    old.social_title is distinct from new.social_title or
    old.social_description is distinct from new.social_description
  ) then
    if old.status = 'published' or not exists (
      select 1 from public.article_revisions r
      where r.article_id = old.id and r.created_at > now() - interval '10 minutes'
    ) then
      insert into public.article_revisions (
        article_id, editor_id, title, subtitle, excerpt, content_html, content_json,
        seo_title, meta_description, social_title, social_description
      ) values (
        old.id, auth.uid(), old.title, old.subtitle, old.excerpt, old.content_html, old.content_json,
        old.seo_title, old.meta_description, old.social_title, old.social_description
      );
    end if;
  end if;
  return new;
end;
$function$;
