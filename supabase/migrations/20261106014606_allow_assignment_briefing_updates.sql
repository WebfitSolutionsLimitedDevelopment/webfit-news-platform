-- Let editors attach late-arriving briefing files before the report is submitted.
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'application/msword')
where id = 'volunteer-assignments' and allowed_mime_types is not null
  and not ('application/msword' = any(allowed_mime_types));

create or replace function public.check_volunteer_assignment_upload() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  assignment_status text;
begin
  select status into assignment_status from public.volunteer_assignments
    where id = new.assignment_id for update;
  if (new.kind = 'briefing' and (assignment_status is null or assignment_status not in ('draft','offered','accepted')))
      or (new.kind = 'report' and assignment_status is distinct from 'accepted') then
    raise exception 'This assignment is no longer open for uploads';
  end if;
  if (select count(*) from public.volunteer_assignment_files
      where assignment_id = new.assignment_id and kind = new.kind) >= 12 then
    raise exception 'This assignment already has 12 attachments of this type';
  end if;
  return new;
end $$;

