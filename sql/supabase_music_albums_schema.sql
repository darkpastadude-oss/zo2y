-- Supabase SQL schema for Spotify albums + album reviews.
-- Run in Supabase SQL editor after your core music schema.

create extension if not exists "pgcrypto";

create table if not exists public.albums (
  album_id text primary key,
  name text not null,
  artist_name text not null,
  artist_id text,
  image_url text,
  release_date date,
  total_tracks integer not null default 0 check (total_tracks >= 0),
  spotify_url text,
  popularity integer check (popularity is null or (popularity >= 0 and popularity <= 100)),
  album_type text default 'album',
  genres text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_album_reviews (
  id uuid primary key default gen_random_uuid(),
  album_id text not null references public.albums(album_id) on delete cascade,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_albums_name
  on public.albums using gin (to_tsvector('english', coalesce(name, '')));
create index if not exists idx_albums_artist_name
  on public.albums using gin (to_tsvector('english', coalesce(artist_name, '')));
create index if not exists idx_albums_popularity on public.albums(popularity desc nulls last);
create index if not exists idx_albums_release_date on public.albums(release_date desc nulls last);
create index if not exists idx_album_reviews_album on public.user_album_reviews(album_id);
create index if not exists idx_album_reviews_user on public.user_album_reviews(user_id);

create unique index if not exists ux_user_album_reviews_unique
  on public.user_album_reviews(user_id, album_id);

create or replace function public.touch_albums_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.touch_user_album_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists albums_touch_updated_at on public.albums;
create trigger albums_touch_updated_at
before update on public.albums
for each row
execute function public.touch_albums_updated_at();

drop trigger if exists user_album_reviews_touch_updated_at on public.user_album_reviews;
create trigger user_album_reviews_touch_updated_at
before update on public.user_album_reviews
for each row
execute function public.touch_user_album_reviews_updated_at();

alter table public.albums enable row level security;
alter table public.user_album_reviews enable row level security;

drop policy if exists "Public select on albums" on public.albums;
drop policy if exists "Insert albums for authenticated users" on public.albums;
drop policy if exists "Update albums for authenticated users" on public.albums;
create policy "Public select on albums"
  on public.albums for select using (true);
create policy "Insert albums for authenticated users"
  on public.albums for insert with check (auth.uid() is not null);
create policy "Update albums for authenticated users"
  on public.albums for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "Public select on user_album_reviews" on public.user_album_reviews;
drop policy if exists "Insert own user_album_reviews" on public.user_album_reviews;
drop policy if exists "Update own user_album_reviews" on public.user_album_reviews;
drop policy if exists "Delete own user_album_reviews" on public.user_album_reviews;
create policy "Public select on user_album_reviews"
  on public.user_album_reviews for select using (true);
create policy "Insert own user_album_reviews"
  on public.user_album_reviews for insert with check (user_id = auth.uid());
create policy "Update own user_album_reviews"
  on public.user_album_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own user_album_reviews"
  on public.user_album_reviews for delete using (user_id = auth.uid());
