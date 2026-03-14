-- Supabase SQL schema for sports teams + favorites used by sports.html and profile.html
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.teams (
  id text primary key,
  name text not null,
  sport text,
  league text,
  logo_url text,
  banner_url text,
  stadium text,
  stadium_url text,
  jersey_url text,
  fanart_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_favorite_teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  team_id text not null references public.teams(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_teams_name on public.teams using gin (to_tsvector('english', coalesce(name, '')));
create index if not exists idx_user_favorite_teams_user on public.user_favorite_teams(user_id);
create index if not exists idx_user_favorite_teams_team on public.user_favorite_teams(team_id);
create unique index if not exists ux_user_favorite_teams on public.user_favorite_teams(user_id, team_id);

create or replace function public.touch_teams_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists teams_touch_updated_at on public.teams;
create trigger teams_touch_updated_at
before update on public.teams
for each row
execute function public.touch_teams_updated_at();

alter table public.teams enable row level security;
alter table public.user_favorite_teams enable row level security;

-- teams policies
 drop policy if exists "Public select on teams" on public.teams;
 drop policy if exists "Insert teams" on public.teams;
 drop policy if exists "Update teams" on public.teams;
create policy "Public select on teams" on public.teams for select using (true);
create policy "Insert teams" on public.teams for insert with check (auth.uid() is not null);
create policy "Update teams" on public.teams for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- user_favorite_teams policies
 drop policy if exists "Public select on user_favorite_teams" on public.user_favorite_teams;
 drop policy if exists "Insert own user_favorite_teams" on public.user_favorite_teams;
 drop policy if exists "Delete own user_favorite_teams" on public.user_favorite_teams;
create policy "Public select on user_favorite_teams" on public.user_favorite_teams for select using (true);
create policy "Insert own user_favorite_teams" on public.user_favorite_teams for insert with check (user_id = auth.uid());
create policy "Delete own user_favorite_teams" on public.user_favorite_teams for delete using (user_id = auth.uid());