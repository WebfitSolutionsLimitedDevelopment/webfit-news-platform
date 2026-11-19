-- Accounts blocked from Add Your Logo by the newsroom (CMS → Logo uploads).
create table if not exists public.logo_studio_blocked (
  user_id uuid primary key references auth.users(id) on delete cascade,
  blocked_at timestamptz not null default now(),
  blocked_by uuid references auth.users(id) on delete set null
);
alter table public.logo_studio_blocked enable row level security;
-- No policies: only the server (service role) reads or writes this table.
