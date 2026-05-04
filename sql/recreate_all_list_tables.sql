-- Recreate all list-related tables
-- Run this in Supabase SQL editor after dropping tables
-- This recreates tables based on the schema files in the sql/ directory

begin;

create extension if not exists "pgcrypto";

-- ============================================================================
-- MOVIE LISTS
-- ============================================================================

create table if not exists public.movie_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.movie_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  movie_id bigint not null,
  list_type text,
  list_id uuid null references public.movie_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_movie_lists_user on public.movie_lists(user_id);
create index if not exists idx_movie_list_items_user on public.movie_list_items(user_id);
create index if not exists idx_movie_list_items_movie on public.movie_list_items(movie_id);

create unique index if not exists ux_movie_list_items_unique
  on public.movie_list_items (user_id, movie_id, list_type, list_id);

alter table public.movie_lists enable row level security;
alter table public.movie_list_items enable row level security;

create policy "Public select on movie_lists" on public.movie_lists for select using (true);
create policy "Insert own movie_lists" on public.movie_lists for insert with check (user_id = auth.uid());
create policy "Update own movie_lists" on public.movie_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own movie_lists" on public.movie_lists for delete using (user_id = auth.uid());

create policy "Public select on movie_list_items" on public.movie_list_items for select using (true);
create policy "Insert own movie_list_items" on public.movie_list_items for insert with check (user_id = auth.uid());
create policy "Update own movie_list_items" on public.movie_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own movie_list_items" on public.movie_list_items for delete using (user_id = auth.uid());

-- ============================================================================
-- TV LISTS
-- ============================================================================

create table if not exists public.tv_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.tv_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tv_id bigint not null,
  list_type text,
  list_id uuid null references public.tv_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_tv_lists_user on public.tv_lists(user_id);
create index if not exists idx_tv_list_items_user on public.tv_list_items(user_id);
create index if not exists idx_tv_list_items_tv on public.tv_list_items(tv_id);

create unique index if not exists ux_tv_list_items_unique
  on public.tv_list_items (user_id, tv_id, list_type, list_id);

alter table public.tv_lists enable row level security;
alter table public.tv_list_items enable row level security;

create policy "Public select on tv_lists" on public.tv_lists for select using (true);
create policy "Insert own tv_lists" on public.tv_lists for insert with check (user_id = auth.uid());
create policy "Update own tv_lists" on public.tv_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own tv_lists" on public.tv_lists for delete using (user_id = auth.uid());

create policy "Public select on tv_list_items" on public.tv_list_items for select using (true);
create policy "Insert own tv_list_items" on public.tv_list_items for insert with check (user_id = auth.uid());
create policy "Update own tv_list_items" on public.tv_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own tv_list_items" on public.tv_list_items for delete using (user_id = auth.uid());

-- ============================================================================
-- ANIME LISTS
-- ============================================================================

create table if not exists public.anime_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text default '',
  is_public boolean default false,
  list_kind text default 'anime',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.anime_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id bigint not null,
  list_type text,
  list_id uuid null references public.anime_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_anime_lists_user on public.anime_lists(user_id);
create index if not exists idx_anime_list_items_user on public.anime_list_items(user_id);
create index if not exists idx_anime_list_items_anime on public.anime_list_items(anime_id);
create index if not exists idx_anime_list_items_list_id on public.anime_list_items(list_id);

create unique index if not exists ux_anime_lists_user_title_lower
  on public.anime_lists(user_id, lower(title));

create unique index if not exists ux_anime_list_items_unique
  on public.anime_list_items(user_id, anime_id, coalesce(list_type, ''), coalesce(list_id::text, ''));

alter table public.anime_lists enable row level security;
alter table public.anime_list_items enable row level security;

create policy "Public select on anime_lists" on public.anime_lists for select using (true);
create policy "Insert own anime_lists" on public.anime_lists for insert with check (user_id = auth.uid());
create policy "Update own anime_lists" on public.anime_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own anime_lists" on public.anime_lists for delete using (user_id = auth.uid());

create policy "Public select on anime_list_items" on public.anime_list_items for select using (true);
create policy "Insert own anime_list_items" on public.anime_list_items for insert with check (user_id = auth.uid());
create policy "Update own anime_list_items" on public.anime_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own anime_list_items" on public.anime_list_items for delete using (user_id = auth.uid());

-- ============================================================================
-- GAME LISTS
-- ============================================================================

create table if not exists public.game_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.game_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  game_id bigint not null,
  list_type text,
  list_id uuid null references public.game_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_game_lists_user on public.game_lists(user_id);
create index if not exists idx_game_list_items_user on public.game_list_items(user_id);
create index if not exists idx_game_list_items_game on public.game_list_items(game_id);

create unique index if not exists ux_game_list_items_unique
  on public.game_list_items (user_id, game_id, list_type, list_id);

alter table public.game_lists enable row level security;
alter table public.game_list_items enable row level security;

create policy "Public select on game_lists" on public.game_lists for select using (true);
create policy "Insert own game_lists" on public.game_lists for insert with check (user_id = auth.uid());
create policy "Update own game_lists" on public.game_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own game_lists" on public.game_lists for delete using (user_id = auth.uid());

create policy "Public select on game_list_items" on public.game_list_items for select using (true);
create policy "Insert own game_list_items" on public.game_list_items for insert with check (user_id = auth.uid());
create policy "Update own game_list_items" on public.game_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own game_list_items" on public.game_list_items for delete using (user_id = auth.uid());

-- ============================================================================
-- BOOK LISTS
-- ============================================================================

create table if not exists public.book_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.book_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  book_id text not null,
  list_type text,
  list_id uuid null references public.book_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_book_list_items_user on public.book_list_items(user_id);
create index if not exists idx_book_list_items_book on public.book_list_items(book_id);

create unique index if not exists ux_book_list_items_unique on public.book_list_items (user_id, book_id, list_type, list_id);

alter table public.book_lists enable row level security;
alter table public.book_list_items enable row level security;

create policy "Public select on book_lists" on public.book_lists for select using (true);
create policy "Insert own book_lists" on public.book_lists for insert with check (user_id = auth.uid());
create policy "Update own book_lists" on public.book_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own book_lists" on public.book_lists for delete using (user_id = auth.uid());

create policy "Public select on book_list_items" on public.book_list_items for select using (true);
create policy "Insert own book_list_items" on public.book_list_items for insert with check (user_id = auth.uid());
create policy "Update own book_list_items" on public.book_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own book_list_items" on public.book_list_items for delete using (user_id = auth.uid());

-- ============================================================================
-- MUSIC LISTS
-- ============================================================================

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
  track_id text not null,
  list_type text,
  list_id uuid null references public.music_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_music_lists_user on public.music_lists(user_id);
create index if not exists idx_music_list_items_user on public.music_list_items(user_id);
create index if not exists idx_music_list_items_track on public.music_list_items(track_id);

create unique index if not exists ux_music_list_items_unique
  on public.music_list_items (user_id, track_id, list_type, list_id);

alter table public.music_lists enable row level security;
alter table public.music_list_items enable row level security;

create policy "Public select on music_lists" on public.music_lists for select using (true);
create policy "Insert own music_lists" on public.music_lists for insert with check (user_id = auth.uid());
create policy "Update own music_lists" on public.music_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own music_lists" on public.music_lists for delete using (user_id = auth.uid());

create policy "Public select on music_list_items" on public.music_list_items for select using (true);
create policy "Insert own music_list_items" on public.music_list_items for insert with check (user_id = auth.uid());
create policy "Update own music_list_items" on public.music_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own music_list_items" on public.music_list_items for delete using (user_id = auth.uid());

-- ============================================================================
-- TRAVEL LISTS
-- ============================================================================

create table if not exists public.travel_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.travel_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null check (char_length(country_code) between 2 and 3),
  list_type text check (list_type in ('favorites', 'visited', 'bucketlist')),
  list_id uuid null references public.travel_lists(id) on delete cascade,
  check (
    list_id is not null
    or list_type in ('favorites', 'visited', 'bucketlist')
  ),
  created_at timestamptz default now()
);

create index if not exists idx_travel_lists_user on public.travel_lists(user_id);
create index if not exists idx_travel_list_items_user on public.travel_list_items(user_id);
create index if not exists idx_travel_list_items_country on public.travel_list_items(country_code);

create unique index if not exists ux_travel_default_items_unique
  on public.travel_list_items (user_id, country_code, list_type)
  where list_id is null;
create unique index if not exists ux_travel_custom_items_unique
  on public.travel_list_items (list_id, country_code)
  where list_id is not null;

alter table public.travel_lists enable row level security;
alter table public.travel_list_items enable row level security;

create policy "Public select on travel_lists" on public.travel_lists for select using (true);
create policy "Insert own travel_lists" on public.travel_lists for insert with check (user_id = auth.uid());
create policy "Update own travel_lists" on public.travel_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own travel_lists" on public.travel_lists for delete using (user_id = auth.uid());

create policy "Public select on travel_list_items" on public.travel_list_items for select using (true);
create policy "Insert own travel_list_items" on public.travel_list_items for insert with check (user_id = auth.uid());
create policy "Update own travel_list_items" on public.travel_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own travel_list_items" on public.travel_list_items for delete using (user_id = auth.uid());

-- ============================================================================
-- FASHION LISTS
-- ============================================================================

create table if not exists public.fashion_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.fashion_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null,
  list_type text check (list_type in ('favorites', 'owned', 'wishlist')),
  list_id uuid null references public.fashion_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (
    list_id is not null
    or list_type in ('favorites', 'owned', 'wishlist')
  )
);

create index if not exists idx_fashion_lists_user on public.fashion_lists(user_id);
create index if not exists idx_fashion_list_items_user on public.fashion_list_items(user_id);
create index if not exists idx_fashion_list_items_brand on public.fashion_list_items(brand_id);

create unique index if not exists ux_fashion_default_items_unique
  on public.fashion_list_items (user_id, brand_id, list_type)
  where list_id is null;
create unique index if not exists ux_fashion_custom_items_unique
  on public.fashion_list_items (list_id, brand_id)
  where list_id is not null;

alter table public.fashion_lists enable row level security;
alter table public.fashion_list_items enable row level security;

create policy "Public select on fashion_lists" on public.fashion_lists for select using (true);
create policy "Insert own fashion_lists" on public.fashion_lists for insert with check (user_id = auth.uid());
create policy "Update own fashion_lists" on public.fashion_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own fashion_lists" on public.fashion_lists for delete using (user_id = auth.uid());

create policy "Public select on fashion_list_items" on public.fashion_list_items for select using (true);
create policy "Insert own fashion_list_items" on public.fashion_list_items for insert with check (user_id = auth.uid());
create policy "Update own fashion_list_items" on public.fashion_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own fashion_list_items" on public.fashion_list_items for delete using (user_id = auth.uid());

-- ============================================================================
-- FOOD LISTS
-- ============================================================================

create table if not exists public.food_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.food_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null,
  list_type text check (list_type in ('favorites', 'tried', 'want_to_try')),
  list_id uuid null references public.food_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (
    list_id is not null
    or list_type in ('favorites', 'tried', 'want_to_try')
  )
);

create index if not exists idx_food_lists_user on public.food_lists(user_id);
create index if not exists idx_food_list_items_user on public.food_list_items(user_id);
create index if not exists idx_food_list_items_brand on public.food_list_items(brand_id);

create unique index if not exists ux_food_default_items_unique
  on public.food_list_items (user_id, brand_id, list_type)
  where list_id is null;
create unique index if not exists ux_food_custom_items_unique
  on public.food_list_items (list_id, brand_id)
  where list_id is not null;

alter table public.food_lists enable row level security;
alter table public.food_list_items enable row level security;

create policy "Public select on food_lists" on public.food_lists for select using (true);
create policy "Insert own food_lists" on public.food_lists for insert with check (user_id = auth.uid());
create policy "Update own food_lists" on public.food_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own food_lists" on public.food_lists for delete using (user_id = auth.uid());

create policy "Public select on food_list_items" on public.food_list_items for select using (true);
create policy "Insert own food_list_items" on public.food_list_items for insert with check (user_id = auth.uid());
create policy "Update own food_list_items" on public.food_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own food_list_items" on public.food_list_items for delete using (user_id = auth.uid());

-- ============================================================================
-- CAR LISTS
-- ============================================================================

create table if not exists public.car_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.car_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null,
  list_type text check (list_type in ('favorites', 'owned', 'wishlist')),
  list_id uuid null references public.car_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (
    list_id is not null
    or list_type in ('favorites', 'owned', 'wishlist')
  )
);

create index if not exists idx_car_lists_user on public.car_lists(user_id);
create index if not exists idx_car_list_items_user on public.car_list_items(user_id);
create index if not exists idx_car_list_items_brand on public.car_list_items(brand_id);

create unique index if not exists ux_car_default_items_unique
  on public.car_list_items (user_id, brand_id, list_type)
  where list_id is null;
create unique index if not exists ux_car_custom_items_unique
  on public.car_list_items (list_id, brand_id)
  where list_id is not null;

alter table public.car_lists enable row level security;
alter table public.car_list_items enable row level security;

create policy "Public select on car_lists" on public.car_lists for select using (true);
create policy "Insert own car_lists" on public.car_lists for insert with check (user_id = auth.uid());
create policy "Update own car_lists" on public.car_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own car_lists" on public.car_lists for delete using (user_id = auth.uid());

create policy "Public select on car_list_items" on public.car_list_items for select using (true);
create policy "Insert own car_list_items" on public.car_list_items for insert with check (user_id = auth.uid());
create policy "Update own car_list_items" on public.car_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own car_list_items" on public.car_list_items for delete using (user_id = auth.uid());

-- ============================================================================
-- COLLABORATIVE LISTS (list_collaborators)
-- ============================================================================

create table if not exists public.list_collaborators (
  id bigint generated by default as identity primary key,
  media_type text not null check (media_type in ('restaurant', 'movie', 'tv', 'game', 'book', 'music', 'anime', 'fashion', 'food', 'travel', 'car')),
  list_id text not null,
  list_owner_id uuid not null references auth.users(id) on delete cascade,
  collaborator_id uuid not null references auth.users(id) on delete cascade,
  can_edit boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (media_type, list_id, collaborator_id),
  check (list_owner_id <> collaborator_id)
);

create index if not exists idx_list_collaborators_collab_lookup
  on public.list_collaborators (collaborator_id, media_type, list_id);

create index if not exists idx_list_collaborators_owner_lookup
  on public.list_collaborators (list_owner_id, media_type, list_id);

alter table public.list_collaborators enable row level security;

create policy list_collaborators_select_owner_or_collaborator
on public.list_collaborators
for select
to authenticated
using (collaborator_id = auth.uid() or list_owner_id = auth.uid());

create policy list_collaborators_insert_owner
on public.list_collaborators
for insert
to authenticated
with check (list_owner_id = auth.uid());

create policy list_collaborators_update_owner
on public.list_collaborators
for update
to authenticated
using (list_owner_id = auth.uid())
with check (list_owner_id = auth.uid());

create policy list_collaborators_delete_owner
on public.list_collaborators
for delete
to authenticated
using (list_owner_id = auth.uid());

grant select, insert, update, delete on public.list_collaborators to authenticated;
grant usage, select on sequence public.list_collaborators_id_seq to authenticated;

-- ============================================================================
-- TIER LISTS (list_tier_meta, list_tier_ranks)
-- ============================================================================

create table if not exists public.list_tier_meta (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('movie', 'tv', 'game', 'book', 'music', 'restaurant', 'anime', 'fashion', 'food', 'travel', 'car')),
  list_id text not null,
  list_kind text not null default 'standard' check (list_kind in ('standard', 'tier')),
  max_rank integer null check (max_rank is null or max_rank > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, media_type, list_id)
);

create table if not exists public.list_tier_ranks (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('movie', 'tv', 'game', 'book', 'music', 'restaurant', 'anime', 'fashion', 'food', 'travel', 'car')),
  list_id text not null,
  item_id text not null,
  rank integer not null check (rank > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, media_type, list_id, item_id)
);

create index if not exists idx_list_tier_meta_lookup
  on public.list_tier_meta (media_type, list_id);

create index if not exists idx_list_tier_ranks_lookup
  on public.list_tier_ranks (media_type, list_id, rank, item_id);

alter table public.list_tier_meta enable row level security;
alter table public.list_tier_ranks enable row level security;

create policy list_tier_meta_select_auth
on public.list_tier_meta
for select
to authenticated
using (true);

create policy list_tier_meta_insert_owner
on public.list_tier_meta
for insert
to authenticated
with check (auth.uid() = user_id);

create policy list_tier_meta_update_owner
on public.list_tier_meta
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy list_tier_meta_delete_owner
on public.list_tier_meta
for delete
to authenticated
using (auth.uid() = user_id);

create policy list_tier_ranks_select_auth
on public.list_tier_ranks
for select
to authenticated
using (true);

create policy list_tier_ranks_insert_owner
on public.list_tier_ranks
for insert
to authenticated
with check (auth.uid() = user_id);

create policy list_tier_ranks_update_owner
on public.list_tier_ranks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy list_tier_ranks_delete_owner
on public.list_tier_ranks
for delete
to authenticated
using (auth.uid() = user_id);

commit;
