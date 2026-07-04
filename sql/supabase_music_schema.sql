-- Supabase SQL schema for music list + review features used by music.html and homepage cards
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.tracks (
  id text primary key,
  name text not null,
  artists text,
  album_name text,
  image_url text,
  preview_url text,
  external_url text,
  popularity integer,
  duration_ms integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.music_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.music_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  track_id text not null references public.tracks(id) on delete cascade,
  list_type text,
  list_id uuid null references public.music_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.music_reviews (
  id uuid primary key default gen_random_uuid(),
  track_id text not null references public.tracks(id) on delete cascade,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tracks_name on public.tracks using gin (to_tsvector('english', coalesce(name, '')));
create index if not exists idx_tracks_artists on public.tracks using gin (to_tsvector('english', coalesce(artists, '')));
create index if not exists idx_music_lists_user on public.music_lists(user_id);
create index if not exists idx_music_list_items_user on public.music_list_items(user_id);
create index if not exists idx_music_list_items_track on public.music_list_items(track_id);
create index if not exists idx_music_reviews_track on public.music_reviews(track_id);
create index if not exists idx_music_reviews_user on public.music_reviews(user_id);

create unique index if not exists ux_music_list_items_unique
  on public.music_list_items (user_id, track_id, list_type, list_id);

create or replace function public.touch_tracks_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tracks_touch_updated_at on public.tracks;
create trigger tracks_touch_updated_at
before update on public.tracks
for each row
execute function public.touch_tracks_updated_at();

create or replace function public.touch_music_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists music_reviews_touch_updated_at on public.music_reviews;
create trigger music_reviews_touch_updated_at
before update on public.music_reviews
for each row
execute function public.touch_music_reviews_updated_at();

alter table public.tracks enable row level security;
alter table public.music_lists enable row level security;
alter table public.music_list_items enable row level security;
alter table public.music_reviews enable row level security;

drop policy if exists "Public select on tracks" on public.tracks;
drop policy if exists "Insert tracks for authenticated users" on public.tracks;
drop policy if exists "Update tracks for authenticated users" on public.tracks;
create policy "Public select on tracks" on public.tracks for select using (true);
create policy "Insert tracks for authenticated users" on public.tracks for insert with check (auth.uid() is not null);
create policy "Update tracks for authenticated users" on public.tracks for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "Public select on music_lists" on public.music_lists;
drop policy if exists "Insert own music_lists" on public.music_lists;
drop policy if exists "Update own music_lists" on public.music_lists;
drop policy if exists "Delete own music_lists" on public.music_lists;
create policy "Public select on music_lists" on public.music_lists for select using (true);
create policy "Insert own music_lists" on public.music_lists for insert with check (user_id = auth.uid());
create policy "Update own music_lists" on public.music_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own music_lists" on public.music_lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on music_list_items" on public.music_list_items;
drop policy if exists "Insert own music_list_items" on public.music_list_items;
drop policy if exists "Update own music_list_items" on public.music_list_items;
drop policy if exists "Delete own music_list_items" on public.music_list_items;
create policy "Public select on music_list_items" on public.music_list_items for select using (true);
create policy "Insert own music_list_items" on public.music_list_items for insert with check (user_id = auth.uid());
create policy "Update own music_list_items" on public.music_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own music_list_items" on public.music_list_items for delete using (user_id = auth.uid());

drop policy if exists "Public select on music_reviews" on public.music_reviews;
drop policy if exists "Insert own music_reviews" on public.music_reviews;
drop policy if exists "Update own music_reviews" on public.music_reviews;
drop policy if exists "Delete own music_reviews" on public.music_reviews;
create policy "Public select on music_reviews" on public.music_reviews for select using (true);
create policy "Insert own music_reviews" on public.music_reviews for insert with check (user_id = auth.uid());
create policy "Update own music_reviews" on public.music_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own music_reviews" on public.music_reviews for delete using (user_id = auth.uid());
