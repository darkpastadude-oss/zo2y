begin;

-- 1. Create Enums if they don't exist
do $$ begin
  create type public.user_list_category as enum (
    'movie', 'tv', 'book', 'anime', 'game', 'sport', 'car',
    'food', 'fashion', 'travel', 'music', 'restaurant'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_list_type as enum (
    'favorites', 'watchlist', 'completed', 'watched', 'custom', 'default'
  );
exception
  when duplicate_object then null;
end $$;

-- 2. Drop ANY existing unified tables so we can recreate them perfectly
drop table if exists public.user_lists cascade;
drop view if exists public.user_lists cascade;
drop table if exists public.list_items cascade;
drop view if exists public.list_items cascade;

-- 3. Drop all old list tables and views
drop table if exists public.user_default_lists cascade;
drop view if exists public.user_default_lists cascade;
drop table if exists public.user_list_items cascade;
drop view if exists public.user_list_items cascade;

drop view if exists public.movie_lists cascade;
drop table if exists public.movie_lists cascade;

drop view if exists public.tv_lists cascade;
drop table if exists public.tv_lists cascade;

drop view if exists public.anime_lists cascade;
drop table if exists public.anime_lists cascade;

drop view if exists public.game_lists cascade;
drop table if exists public.game_lists cascade;

drop view if exists public.book_lists cascade;
drop table if exists public.book_lists cascade;

drop view if exists public.music_lists cascade;
drop table if exists public.music_lists cascade;

drop view if exists public.travel_lists cascade;
drop table if exists public.travel_lists cascade;

drop view if exists public.fashion_lists cascade;
drop table if exists public.fashion_lists cascade;

drop view if exists public.food_lists cascade;
drop table if exists public.food_lists cascade;

drop view if exists public.car_lists cascade;
drop table if exists public.car_lists cascade;

-- Drop all old item tables and views
drop view if exists public.movie_list_items cascade;
drop table if exists public.movie_list_items cascade;

drop view if exists public.tv_list_items cascade;
drop table if exists public.tv_list_items cascade;

drop view if exists public.anime_list_items cascade;
drop table if exists public.anime_list_items cascade;

drop view if exists public.game_list_items cascade;
drop table if exists public.game_list_items cascade;

drop view if exists public.book_list_items cascade;
drop table if exists public.book_list_items cascade;

drop view if exists public.music_list_items cascade;
drop table if exists public.music_list_items cascade;

drop view if exists public.travel_list_items cascade;
drop table if exists public.travel_list_items cascade;

drop view if exists public.fashion_list_items cascade;
drop table if exists public.fashion_list_items cascade;

drop view if exists public.food_list_items cascade;
drop table if exists public.food_list_items cascade;

drop view if exists public.car_list_items cascade;
drop table if exists public.car_list_items cascade;

-- 4. Create clean unified user_lists
create table public.user_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  type text not null default 'custom',
  icon text,
  description text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, category, name)
);

-- 5. Create clean unified list_items
create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid references public.user_lists(id) on delete cascade,
  list_type text not null default 'custom',
  external_id text not null,
  external_source text not null default 'local_db',
  external_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  added_at timestamptz not null default now(),
  unique(user_id, list_id, external_id)
);

-- Indexes
create index idx_user_lists_user on public.user_lists(user_id);
create index idx_user_lists_category on public.user_lists(category);
create index idx_list_items_user on public.list_items(user_id);
create index idx_list_items_list on public.list_items(list_id);
create index idx_list_items_ext on public.list_items(external_id, external_type);

commit;
