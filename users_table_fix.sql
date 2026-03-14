-- Corrected SQL for creating users table with RLS
create table if not exists public.users (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamp not null default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Create policy without IF NOT EXISTS (PostgreSQL doesn't support this for policies)
create policy "users_upsert_select"
on public.users
for all
using (true)
with check (true);