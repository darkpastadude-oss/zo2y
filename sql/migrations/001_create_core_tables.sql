-- ============================================================
-- Migration 001: Create Core Tables
-- Zo2y V2 — Unified entity, list, review, and activity system
-- ============================================================
-- Run this FIRST in the Supabase SQL Editor.
-- Safe to re-run — DROPs everything first for clean slate.
-- ============================================================

-- Clean slate for dev migration
drop table if exists public.sports_metadata cascade;
drop table if exists public.travel_metadata cascade;
drop table if exists public.car_metadata cascade;
drop table if exists public.food_metadata cascade;
drop table if exists public.fashion_metadata cascade;
drop table if exists public.album_metadata cascade;
drop table if exists public.music_metadata cascade;
drop table if exists public.game_metadata cascade;
drop table if exists public.book_metadata cascade;
drop table if exists public.anime_metadata cascade;
drop table if exists public.tv_metadata cascade;
drop table if exists public.movie_metadata cascade;
drop table if exists public.reviews cascade;
drop table if exists public.list_items cascade;
drop table if exists public.user_lists cascade;
drop table if exists public.entity_aliases cascade;
drop table if exists public.content_sources cascade;
drop table if exists public.entities cascade;
drop table if exists public.provider_registry cascade;
drop table if exists public.system_lists cascade;
drop table if exists public.entity_types cascade;
drop table if exists public.entity_categories cascade;

-- ============================================================
-- 1. Lookup tables
-- ============================================================

create table public.entity_categories (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  display_name text not null,
  icon         text,
  sort_order   integer not null default 0,
  enabled      boolean not null default true
);

insert into public.entity_categories (key, display_name, icon, sort_order) values
  ('media',        'Media',         'fa-film',       1),
  ('brand',        'Brand',         'fa-tag',        2),
  ('place',        'Place',         'fa-map-marker', 3),
  ('organization', 'Organization',  'fa-building',   4)
on conflict (key) do nothing;

create table public.entity_types (
  id                 uuid primary key default gen_random_uuid(),
  key                text not null unique,
  display_name       text not null,
  entity_category_id uuid not null references public.entity_categories(id),
  icon               text,
  sort_order         integer not null default 0,
  enabled            boolean not null default true
);

insert into public.entity_types (key, display_name, entity_category_id, icon, sort_order)
select 'movie',    'Movie',           id, 'fa-film',          1  from public.entity_categories where key = 'media'
union all select 'tv',       'TV Show',         id, 'fa-tv',            2  from public.entity_categories where key = 'media'
union all select 'anime',   'Anime',           id, 'fa-dragon',        3  from public.entity_categories where key = 'media'
union all select 'book',    'Book',            id, 'fa-book',          4  from public.entity_categories where key = 'media'
union all select 'game',    'Game',            id, 'fa-gamepad',       5  from public.entity_categories where key = 'media'
union all select 'music',   'Music Track',     id, 'fa-music',         6  from public.entity_categories where key = 'media'
union all select 'album',   'Music Album',     id, 'fa-compact-disc',  7  from public.entity_categories where key = 'media'
union all select 'fashion', 'Fashion Brand',   id, 'fa-tshirt',        8  from public.entity_categories where key = 'brand'
union all select 'food',    'Food Brand',      id, 'fa-utensils',      9  from public.entity_categories where key = 'brand'
union all select 'car',     'Car Brand',       id, 'fa-car',           10 from public.entity_categories where key = 'brand'
union all select 'travel',  'Travel Destination', id, 'fa-globe',      11 from public.entity_categories where key = 'place'
union all select 'sport',   'Sports Team',     id, 'fa-futbol',        12 from public.entity_categories where key = 'organization'
on conflict (key) do nothing;

create table public.system_lists (
  id               uuid primary key default gen_random_uuid(),
  key              text not null unique,
  display_name     text not null,
  entity_type_id   uuid references public.entity_types(id),
  icon             text,
  color            text,
  sort_order       integer not null default 0,
  enabled          boolean not null default true
);

insert into public.system_lists (key, display_name, icon, color, sort_order) values
  ('favorite',  'Favorite',  'fa-heart',    '#e74c3c', 1),
  ('watching',  'Watching',  'fa-eye',      '#3498db', 2),
  ('completed', 'Completed', 'fa-check',    '#2ecc71', 3),
  ('wishlist',  'Wishlist',  'fa-star',     '#f39c12', 4),
  ('reading',   'Reading',   'fa-book-open','#9b59b6', 5),
  ('listening', 'Listening', 'fa-headphones','#1abc9c', 6),
  ('playing',   'Playing',   'fa-gamepad',  '#e67e22', 7),
  ('backlog',   'Backlog',   'fa-clock',    '#95a5a6', 8),
  ('owned',     'Owned',     'fa-shopping-bag','#2c3e50', 9),
  ('tried',     'Tried',     'fa-utensil-spoon','#d35400', 10),
  ('visited',   'Visited',   'fa-map-pin',  '#27ae60', 11)
on conflict (key) do nothing;

-- ============================================================
-- 2. Provider registry
-- ============================================================

create table public.provider_registry (
  id        uuid primary key default gen_random_uuid(),
  key       text not null unique,
  name      text not null,
  enabled   boolean not null default true,
  priority  integer not null default 0
);

insert into public.provider_registry (key, name, priority) values
  ('tmdb',           'TMDB',            1),
  ('openlibrary',    'Open Library',    2),
  ('google_books',   'Google Books',    3),
  ('igdb',           'IGDB',            4),
  ('spotify',        'Spotify',         5),
  ('apple_music',    'Apple Music',     6),
  ('thesportsdb',    'TheSportsDB',     7),
  ('restcountries',  'REST Countries',  8)
on conflict (key) do nothing;

-- ============================================================
-- 3. Core entity table
-- ============================================================

create table public.entities (
  id               uuid primary key default gen_random_uuid(),
  entity_type_id   uuid not null references public.entity_types(id),
  title            text not null,
  canonical_name   text,
  subtitle         text,
  description      text,
  image_url        text,
  backdrop_url     text,
  slug             text,
  search_vector    tsvector,
  popularity       numeric not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_entities_type on public.entities(entity_type_id);
create index idx_entities_slug on public.entities(slug);
create index idx_entities_search on public.entities using gin(search_vector);
create index idx_entities_popularity on public.entities(popularity desc);
create index idx_entities_created on public.entities(created_at desc);

create or replace function public.entities_search_vector_update()
returns trigger as $$
begin
  new.search_vector := to_tsvector('english',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.canonical_name, '') || ' ' ||
    coalesce(new.subtitle, '') || ' ' ||
    coalesce(new.description, '')
  );
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists entities_search_vector_trigger on public.entities;
create trigger entities_search_vector_trigger
  before insert or update on public.entities
  for each row execute function public.entities_search_vector_update();

-- ============================================================
-- 4. Content sources (provider ID mapping)
-- ============================================================

create table public.content_sources (
  id            uuid primary key default gen_random_uuid(),
  entity_id     uuid not null references public.entities(id) on delete cascade,
  provider      text not null,
  provider_id   text not null,
  last_synced   timestamptz,
  last_updated  timestamptz,
  unique (provider, provider_id)
);

create index idx_content_sources_entity on public.content_sources(entity_id);

-- ============================================================
-- 5. Entity aliases
-- ============================================================

create table public.entity_aliases (
  id        uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  alias     text not null,
  language  text,
  provider  text
);

create index idx_entity_aliases_entity on public.entity_aliases(entity_id);
create index idx_entity_aliases_alias on public.entity_aliases(alias);

-- ============================================================
-- 6. User lists (custom lists)
-- ============================================================

create table public.user_lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  icon        text,
  description text,
  created_at  timestamptz not null default now()
);

create index idx_user_lists_user on public.user_lists(user_id);

-- ============================================================
-- 7. List items (unified)
-- ============================================================

create table public.list_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  entity_id      uuid not null references public.entities(id) on delete cascade,
  system_list_id uuid references public.system_lists(id) on delete cascade,
  list_id        uuid references public.user_lists(id) on delete cascade,
  notes          text,
  rating         numeric(2,1) check (rating >= 0 and rating <= 5),
  progress       numeric check (progress >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint list_items_xor check (
    (list_id is null and system_list_id is not null)
    or (list_id is not null and system_list_id is null)
  )
);

create unique index ux_list_items_default
  on public.list_items (user_id, entity_id, system_list_id)
  where list_id is null;

create unique index ux_list_items_custom
  on public.list_items (list_id, entity_id)
  where list_id is not null and system_list_id is null;

create index idx_list_items_user on public.list_items(user_id);
create index idx_list_items_entity on public.list_items(entity_id);
create index idx_list_items_list on public.list_items(list_id) where list_id is not null;
create index idx_list_items_system on public.list_items(system_list_id) where system_list_id is not null;

create or replace function public.list_items_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists list_items_updated_at_trigger on public.list_items;
create trigger list_items_updated_at_trigger
  before update on public.list_items
  for each row execute function public.list_items_updated_at();

-- ============================================================
-- 8. Reviews (unified)
-- ============================================================

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entity_id   uuid not null references public.entities(id) on delete cascade,
  rating      numeric(2,1) check (rating >= 0 and rating <= 5),
  review_text text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, entity_id)
);

create index idx_reviews_entity on public.reviews(entity_id);
create index idx_reviews_user on public.reviews(user_id);

create or replace function public.reviews_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists reviews_updated_at_trigger on public.reviews;
create trigger reviews_updated_at_trigger
  before update on public.reviews
  for each row execute function public.reviews_updated_at();

-- ============================================================
-- 9. Metadata tables (per entity type)
-- ============================================================

create table public.movie_metadata (
  entity_id     uuid primary key references public.entities(id) on delete cascade,
  release_date  date,
  runtime       integer,
  budget        bigint,
  revenue       bigint
);

create table public.tv_metadata (
  entity_id          uuid primary key references public.entities(id) on delete cascade,
  first_air_date     date,
  last_air_date      date,
  number_of_seasons  integer,
  number_of_episodes integer,
  status             text
);

create table public.anime_metadata (
  entity_id    uuid primary key references public.entities(id) on delete cascade,
  episodes     integer,
  status       text,
  air_date     date
);

create table public.book_metadata (
  entity_id       uuid primary key references public.entities(id) on delete cascade,
  isbn            text,
  pages           integer,
  publisher       text,
  published_date  date
);

create table public.game_metadata (
  entity_id    uuid primary key references public.entities(id) on delete cascade,
  platforms    text[],
  release_date date,
  developers   text[],
  publishers   text[]
);

create table public.music_metadata (
  entity_id    uuid primary key references public.entities(id) on delete cascade,
  duration_ms  integer,
  album        text,
  spotify_popularity integer
);

create table public.album_metadata (
  entity_id    uuid primary key references public.entities(id) on delete cascade,
  artist       text,
  total_tracks integer,
  release_date date,
  spotify_popularity integer
);

create table public.fashion_metadata (
  entity_id  uuid primary key references public.entities(id) on delete cascade,
  category   text,
  country    text,
  founded    text,
  tags       text[] not null default '{}'
);

create table public.food_metadata (
  entity_id  uuid primary key references public.entities(id) on delete cascade,
  category   text,
  country    text,
  founded    text,
  tags       text[] not null default '{}'
);

create table public.car_metadata (
  entity_id  uuid primary key references public.entities(id) on delete cascade,
  category   text,
  country    text,
  founded    text,
  tags       text[] not null default '{}'
);

create table public.travel_metadata (
  entity_id     uuid primary key references public.entities(id) on delete cascade,
  country_code  text,
  continent     text,
  capital       text,
  region        text
);

create table public.sports_metadata (
  entity_id  uuid primary key references public.entities(id) on delete cascade,
  sport      text,
  league     text,
  stadium    text
);

-- ============================================================
-- 10. Row-Level Security
-- ============================================================

alter table public.entity_categories enable row level security;
drop policy if exists "entity_categories_select" on public.entity_categories;
create policy "entity_categories_select" on public.entity_categories for select using (true);

alter table public.entity_types enable row level security;
drop policy if exists "entity_types_select" on public.entity_types;
create policy "entity_types_select" on public.entity_types for select using (true);

alter table public.system_lists enable row level security;
drop policy if exists "system_lists_select" on public.system_lists;
create policy "system_lists_select" on public.system_lists for select using (true);

alter table public.provider_registry enable row level security;
drop policy if exists "provider_registry_select" on public.provider_registry;
create policy "provider_registry_select" on public.provider_registry for select using (true);

alter table public.entities enable row level security;
drop policy if exists "entities_select" on public.entities;
create policy "entities_select" on public.entities for select using (true);
drop policy if exists "entities_insert" on public.entities;
create policy "entities_insert" on public.entities for insert with check (auth.uid() is not null);
drop policy if exists "entities_update" on public.entities;
create policy "entities_update" on public.entities for update using (auth.uid() is not null);

alter table public.content_sources enable row level security;
drop policy if exists "content_sources_select" on public.content_sources;
create policy "content_sources_select" on public.content_sources for select using (true);
drop policy if exists "content_sources_insert" on public.content_sources;
create policy "content_sources_insert" on public.content_sources for insert with check (auth.uid() is not null);

alter table public.entity_aliases enable row level security;
drop policy if exists "entity_aliases_select" on public.entity_aliases;
create policy "entity_aliases_select" on public.entity_aliases for select using (true);
drop policy if exists "entity_aliases_insert" on public.entity_aliases;
create policy "entity_aliases_insert" on public.entity_aliases for insert with check (auth.uid() is not null);

alter table public.user_lists enable row level security;
drop policy if exists "user_lists_select" on public.user_lists;
create policy "user_lists_select" on public.user_lists for select using (true);
drop policy if exists "user_lists_insert" on public.user_lists;
create policy "user_lists_insert" on public.user_lists for insert with check (user_id = auth.uid());
drop policy if exists "user_lists_update" on public.user_lists;
create policy "user_lists_update" on public.user_lists for update using (user_id = auth.uid());
drop policy if exists "user_lists_delete" on public.user_lists;
create policy "user_lists_delete" on public.user_lists for delete using (user_id = auth.uid());

alter table public.list_items enable row level security;
drop policy if exists "list_items_select" on public.list_items;
create policy "list_items_select" on public.list_items for select using (true);
drop policy if exists "list_items_insert" on public.list_items;
create policy "list_items_insert" on public.list_items for insert with check (user_id = auth.uid());
drop policy if exists "list_items_update" on public.list_items;
create policy "list_items_update" on public.list_items for update using (user_id = auth.uid());
drop policy if exists "list_items_delete" on public.list_items;
create policy "list_items_delete" on public.list_items for delete using (user_id = auth.uid());

alter table public.reviews enable row level security;
drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select" on public.reviews for select using (true);
drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews for insert with check (user_id = auth.uid());
drop policy if exists "reviews_update" on public.reviews;
create policy "reviews_update" on public.reviews for update using (user_id = auth.uid());
drop policy if exists "reviews_delete" on public.reviews;
create policy "reviews_delete" on public.reviews for delete using (user_id = auth.uid());

-- Metadata tables RLS
alter table public.movie_metadata enable row level security;
drop policy if exists movie_metadata_select on public.movie_metadata;
create policy movie_metadata_select on public.movie_metadata for select using (true);
drop policy if exists movie_metadata_insert on public.movie_metadata;
create policy movie_metadata_insert on public.movie_metadata for insert with check (auth.uid() is not null);

alter table public.tv_metadata enable row level security;
drop policy if exists tv_metadata_select on public.tv_metadata;
create policy tv_metadata_select on public.tv_metadata for select using (true);
drop policy if exists tv_metadata_insert on public.tv_metadata;
create policy tv_metadata_insert on public.tv_metadata for insert with check (auth.uid() is not null);

alter table public.anime_metadata enable row level security;
drop policy if exists anime_metadata_select on public.anime_metadata;
create policy anime_metadata_select on public.anime_metadata for select using (true);
drop policy if exists anime_metadata_insert on public.anime_metadata;
create policy anime_metadata_insert on public.anime_metadata for insert with check (auth.uid() is not null);

alter table public.book_metadata enable row level security;
drop policy if exists book_metadata_select on public.book_metadata;
create policy book_metadata_select on public.book_metadata for select using (true);
drop policy if exists book_metadata_insert on public.book_metadata;
create policy book_metadata_insert on public.book_metadata for insert with check (auth.uid() is not null);

alter table public.game_metadata enable row level security;
drop policy if exists game_metadata_select on public.game_metadata;
create policy game_metadata_select on public.game_metadata for select using (true);
drop policy if exists game_metadata_insert on public.game_metadata;
create policy game_metadata_insert on public.game_metadata for insert with check (auth.uid() is not null);

alter table public.music_metadata enable row level security;
drop policy if exists music_metadata_select on public.music_metadata;
create policy music_metadata_select on public.music_metadata for select using (true);
drop policy if exists music_metadata_insert on public.music_metadata;
create policy music_metadata_insert on public.music_metadata for insert with check (auth.uid() is not null);

alter table public.album_metadata enable row level security;
drop policy if exists album_metadata_select on public.album_metadata;
create policy album_metadata_select on public.album_metadata for select using (true);
drop policy if exists album_metadata_insert on public.album_metadata;
create policy album_metadata_insert on public.album_metadata for insert with check (auth.uid() is not null);

alter table public.fashion_metadata enable row level security;
drop policy if exists fashion_metadata_select on public.fashion_metadata;
create policy fashion_metadata_select on public.fashion_metadata for select using (true);
drop policy if exists fashion_metadata_insert on public.fashion_metadata;
create policy fashion_metadata_insert on public.fashion_metadata for insert with check (auth.uid() is not null);

alter table public.food_metadata enable row level security;
drop policy if exists food_metadata_select on public.food_metadata;
create policy food_metadata_select on public.food_metadata for select using (true);
drop policy if exists food_metadata_insert on public.food_metadata;
create policy food_metadata_insert on public.food_metadata for insert with check (auth.uid() is not null);

alter table public.car_metadata enable row level security;
drop policy if exists car_metadata_select on public.car_metadata;
create policy car_metadata_select on public.car_metadata for select using (true);
drop policy if exists car_metadata_insert on public.car_metadata;
create policy car_metadata_insert on public.car_metadata for insert with check (auth.uid() is not null);

alter table public.travel_metadata enable row level security;
drop policy if exists travel_metadata_select on public.travel_metadata;
create policy travel_metadata_select on public.travel_metadata for select using (true);
drop policy if exists travel_metadata_insert on public.travel_metadata;
create policy travel_metadata_insert on public.travel_metadata for insert with check (auth.uid() is not null);

alter table public.sports_metadata enable row level security;
drop policy if exists sports_metadata_select on public.sports_metadata;
create policy sports_metadata_select on public.sports_metadata for select using (true);
drop policy if exists sports_metadata_insert on public.sports_metadata;
create policy sports_metadata_insert on public.sports_metadata for insert with check (auth.uid() is not null);

-- ============================================================
-- 11. Verification
-- ============================================================

do $$
declare
  ec int; et int; sl int; pr int; ent int;
  cs int; ul int; li int; rv int;
begin
  select count(*) into ec from public.entity_categories;
  select count(*) into et from public.entity_types;
  select count(*) into sl from public.system_lists;
  select count(*) into pr from public.provider_registry;
  select count(*) into ent from public.entities;
  select count(*) into cs from public.content_sources;
  select count(*) into ul from public.user_lists;
  select count(*) into li from public.list_items;
  select count(*) into rv from public.reviews;

  raise notice '=== Migration 001 Verification ===';
  raise notice 'entity_categories: % rows', ec;
  raise notice 'entity_types:      % rows', et;
  raise notice 'system_lists:      % rows', sl;
  raise notice 'provider_registry: % rows', pr;
  raise notice 'entities:          % rows', ent;
  raise notice 'content_sources:   % rows', cs;
  raise notice 'user_lists:        % rows', ul;
  raise notice 'list_items:        % rows', li;
  raise notice 'reviews:           % rows', rv;
  raise notice '================================';
end;
$$;
