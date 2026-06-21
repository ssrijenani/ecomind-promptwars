-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query)
-- before starting the backend.

create table if not exists footprint_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input jsonb not null,
  breakdown jsonb not null,
  total_monthly_kg_co2 numeric not null,
  comparison jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_footprint_snapshots_user_id
  on footprint_snapshots(user_id);

-- Row Level Security: even though our backend uses the service role key
-- (which bypasses RLS), enabling and defining these policies is good
-- defense-in-depth in case the table is ever queried directly with a
-- user's own (anon/authenticated) key from the client.
alter table footprint_snapshots enable row level security;

create policy "Users can view their own snapshots"
  on footprint_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert their own snapshots"
  on footprint_snapshots for insert
  with check (auth.uid() = user_id);
