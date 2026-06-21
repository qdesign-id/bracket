-- ============================================================
-- BLOCK LEAGUE BRACKET — Supabase schema
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- Pastikan extension untuk uuid tersedia (biasanya sudah aktif di Supabase)
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------

create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season text,
  num_teams int not null check (num_teams in (8, 16, 32)),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  logo_url text,
  seed int not null
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  round int not null,
  match_index int not null,
  team1_id uuid references teams(id) on delete set null,
  team2_id uuid references teams(id) on delete set null,
  score1 int,
  score2 int,
  winner_id uuid references teams(id) on delete set null,
  next_match_id uuid references matches(id) on delete set null,
  next_slot int check (next_slot in (1, 2))
);

create index if not exists idx_teams_tournament on teams(tournament_id);
create index if not exists idx_matches_tournament on matches(tournament_id);
create index if not exists idx_matches_next on matches(next_match_id);

-- Only one tournament can be "published" (publicly visible) at a time.
-- This partial unique index enforces that at the database level too.
create unique index if not exists idx_one_active_tournament
  on tournaments ((is_active))
  where is_active = true;

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Anyone (anon = regular visitors) can READ.
-- Only logged-in admins (authenticated role) can WRITE.
-- ----------------------------------------------------------------

alter table tournaments enable row level security;
alter table teams enable row level security;
alter table matches enable row level security;

create policy "public can read tournaments" on tournaments
  for select using (true);
create policy "admins can write tournaments" on tournaments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read teams" on teams
  for select using (true);
create policy "admins can write teams" on teams
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public can read matches" on matches
  for select using (true);
create policy "admins can write matches" on matches
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ----------------------------------------------------------------
-- REALTIME
-- This is what makes admin edits show up instantly on every device.
-- ----------------------------------------------------------------

alter publication supabase_realtime add table tournaments;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table matches;

-- ----------------------------------------------------------------
-- STORAGE BUCKET for team logos
-- ----------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "public can view logos" on storage.objects
  for select using (bucket_id = 'logos');

create policy "admins can upload logos" on storage.objects
  for insert with check (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "admins can update logos" on storage.objects
  for update using (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "admins can delete logos" on storage.objects
  for delete using (bucket_id = 'logos' and auth.role() = 'authenticated');
