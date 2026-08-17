-- Secure first-admin bootstrap for an otherwise empty Supabase Auth project.
-- Configure app_private.admin_bootstrap_config.email before creating/signing in the first admin.

create schema if not exists app_private;
revoke all on schema app_private from public;
revoke all on schema app_private from anon, authenticated;

create table if not exists app_private.admin_bootstrap_config (
  singleton boolean primary key default true check (singleton),
  email text,
  configured_at timestamptz,
  consumed_at timestamptz,
  consumed_by uuid references auth.users(id) on delete set null
);

insert into app_private.admin_bootstrap_config(singleton,email)
values (true,null)
on conflict (singleton) do nothing;

create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles(id,email,display_name,role,is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''),'@',1)),
    'contributor'::public.user_role,
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;

revoke all on function app_private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_webfit on auth.users;
create trigger on_auth_user_created_webfit
after insert on auth.users
for each row execute function app_private.handle_new_auth_user();

create or replace function public.bootstrap_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public, auth, app_private
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_allowed_email text;
begin
  if v_uid is null then return false; end if;
  if exists (select 1 from public.profiles where is_active = true and role = 'super_admin'::public.user_role) then return false; end if;

  select lower(email) into v_email from auth.users where id = v_uid;
  select lower(email) into v_allowed_email from app_private.admin_bootstrap_config where singleton = true and consumed_at is null;
  if v_allowed_email is null or v_email is null or v_email <> v_allowed_email then return false; end if;

  insert into public.profiles(id,email,display_name,role,is_active)
  select u.id,u.email,coalesce(u.raw_user_meta_data->>'display_name',split_part(coalesce(u.email,''),'@',1)),'super_admin'::public.user_role,true
  from auth.users u where u.id=v_uid
  on conflict (id) do update set email=excluded.email,role='super_admin'::public.user_role,is_active=true,updated_at=now();

  update app_private.admin_bootstrap_config set consumed_at=now(),consumed_by=v_uid where singleton=true;
  insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata)
  values (v_uid,'bootstrap_super_admin','profile',v_uid,jsonb_build_object('email',v_email));
  execute 'revoke execute on function public.bootstrap_first_admin() from authenticated';
  return true;
end;
$$;

revoke all on function public.bootstrap_first_admin() from public, anon;
grant execute on function public.bootstrap_first_admin() to authenticated;
