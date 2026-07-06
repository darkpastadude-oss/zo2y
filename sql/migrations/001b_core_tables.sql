-- ============================================================
-- Migration 001b: User lists, list_items, reviews, metadata,
-- functions, triggers, RLS, verification
-- ============================================================
-- Run this AFTER 001a_core_tables.sql completes successfully.
-- ============================================================

-- ============================================================
-- 1. User lists (custom lists)
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
-- 2. List items (unified)
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

-- ============================================================
-- 3. Reviews (unified)
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

-- ============================================================
-- 4. Metadata tables (per entity type)
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
-- 5. Functions and triggers
-- ============================================================

create or replace function public.entities_search_vector_update() returns trigger language plpgsql as $$ begin new.search_vector := to_tsvector('english', coalesce(new.title, '') || ' ' || coalesce(new.canonical_name, '') || ' ' || coalesce(new.subtitle, '') || ' ' || coalesce(new.description, '')); new.updated_at := now(); return new; end; $$;

drop trigger if exists entities_search_vector_trigger on public.entities;
create trigger entities_search_vector_trigger before insert or update on public.entities for each row execute function public.entities_search_vector_update();

create or replace function public.list_items_updated_at() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;

drop trigger if exists list_items_updated_at_trigger on public.list_items;
create trigger list_items_updated_at_trigger before update on public.list_items for each row execute function public.list_items_updated_at();

create or replace function public.reviews_updated_at() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;

drop trigger if exists reviews_updated_at_trigger on public.reviews;
create trigger reviews_updated_at_trigger before update on public.reviews for each row execute function public.reviews_updated_at();

-- ============================================================
-- 6. Row-Level Security
-- ============================================================

alter table public.user_lists enable row level security;
drop policy if exists user_lists_select on public.user_lists;
create policy user_lists_select on public.user_lists for select using (true);
drop policy if exists user_lists_insert on public.user_lists;
create policy user_lists_insert on public.user_lists for insert with check (user_id = auth.uid());
drop policy if exists user_lists_update on public.user_lists;
create policy user_lists_update on public.user_lists for update using (user_id = auth.uid());
drop policy if exists user_lists_delete on public.user_lists;
create policy user_lists_delete on public.user_lists for delete using (user_id = auth.uid());

alter table public.list_items enable row level security;
drop policy if exists list_items_select on public.list_items;
create policy list_items_select on public.list_items for select using (true);
drop policy if exists list_items_insert on public.list_items;
create policy list_items_insert on public.list_items for insert with check (user_id = auth.uid());
drop policy if exists list_items_update on public.list_items;
create policy list_items_update on public.list_items for update using (user_id = auth.uid());
drop policy if exists list_items_delete on public.list_items;
create policy list_items_delete on public.list_items for delete using (user_id = auth.uid());

alter table public.reviews enable row level security;
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews for select using (true);
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert with check (user_id = auth.uid());
drop policy if exists reviews_update on public.reviews;
create policy reviews_update on public.reviews for update using (user_id = auth.uid());
drop policy if exists reviews_delete on public.reviews;
create policy reviews_delete on public.reviews for delete using (user_id = auth.uid());

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
-- 7. Verification
-- ============================================================

do $$ declare ec int; et int; sl int; pr int; ent int; cs int; ul int; li int; rv int; begin select count(*) into ec from public.entity_categories; select count(*) into et from public.entity_types; select count(*) into sl from public.system_lists; select count(*) into pr from public.provider_registry; select count(*) into ent from public.entities; select count(*) into cs from public.content_sources; select count(*) into ul from public.user_lists; select count(*) into li from public.list_items; select count(*) into rv from public.reviews; raise notice '=== Migration 001b Verification ==='; raise notice 'entity_categories: % rows', ec; raise notice 'entity_types:      % rows', et; raise notice 'system_lists:      % rows', sl; raise notice 'provider_registry: % rows', pr; raise notice 'entities:          % rows', ent; raise notice 'content_sources:   % rows', cs; raise notice 'user_lists:        % rows', ul; raise notice 'list_items:        % rows', li; raise notice 'reviews:           % rows', rv; raise notice '================================'; end; $$;
