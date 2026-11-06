-- Server-only newsroom records. Every CMS operation checks the signed-in user's role and ownership.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('volunteer-assignments', 'volunteer-assignments', false, 4194304,
  array['image/jpeg','image/png','image/webp','application/pdf','text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create table public.volunteer_assignments (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.profiles(id),
  assigned_by uuid not null references public.profiles(id),
  volunteer_name text not null,
  issuer_name text not null,
  title text not null,
  venue text not null,
  event_date date not null,
  event_time text,
  contact text,
  instructions text not null,
  status text not null default 'draft' check (status in ('draft','offered','accepted','declined','reported','complete')),
  response_note text,
  accepted_at timestamptz,
  report_text text,
  reported_at timestamptz,
  completed_at timestamptz,
  photos_purged_at timestamptz,
  created_at timestamptz not null default now()
);

create index volunteer_assignments_owner_idx on public.volunteer_assignments (volunteer_id, created_at desc);

create table public.volunteer_assignment_files (
  id uuid primary key,
  assignment_id uuid not null references public.volunteer_assignments(id) on delete cascade,
  kind text not null check (kind in ('briefing','report')),
  object_path text not null unique,
  filename text not null,
  content_type text not null,
  created_at timestamptz not null default now()
);
create index volunteer_assignment_files_assignment_idx on public.volunteer_assignment_files (assignment_id, kind);

alter table public.volunteer_assignments enable row level security;
alter table public.volunteer_assignment_files enable row level security;
revoke all on public.volunteer_assignments, public.volunteer_assignment_files from public, anon, authenticated;
grant select, insert, update, delete on public.volunteer_assignments, public.volunteer_assignment_files to service_role;

-- Serialize uploads against status changes so no report photo can arrive after completion.
create function public.check_volunteer_assignment_upload() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  assignment_status text;
begin
  select status into assignment_status from public.volunteer_assignments
    where id = new.assignment_id for update;
  if (new.kind = 'briefing' and assignment_status is distinct from 'draft')
      or (new.kind = 'report' and assignment_status is distinct from 'accepted') then
    raise exception 'This assignment is no longer open for uploads';
  end if;
  if (select count(*) from public.volunteer_assignment_files
      where assignment_id = new.assignment_id and kind = new.kind) >= 12 then
    raise exception 'This assignment already has 12 attachments of this type';
  end if;
  return new;
end $$;

revoke all on function public.check_volunteer_assignment_upload() from public, anon, authenticated;
grant execute on function public.check_volunteer_assignment_upload() to service_role;
create trigger check_volunteer_assignment_upload before insert on public.volunteer_assignment_files
  for each row execute function public.check_volunteer_assignment_upload();
