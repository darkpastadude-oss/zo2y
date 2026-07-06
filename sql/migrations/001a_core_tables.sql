-- ============================================================
-- Migration 001a: Lookup tables + entities + content_sources
-- ============================================================

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

-- Lookup tables
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

-- Provider registry
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

-- Core entity table
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

-- Content sources
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

-- Entity aliases
create table public.entity_aliases (
  id        uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  alias     text not null,
  language  text,
  provider  text
);

create index idx_entity_aliases_entity on public.entity_aliases(entity_id);
create index idx_entity_aliases_alias on public.entity_aliases(alias);
