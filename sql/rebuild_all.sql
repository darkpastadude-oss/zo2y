-- ============================================================================
-- COMPLETE DATABASE RESET: Drop all tables and rebuild from scratch
-- Run this in the Supabase SQL editor.
-- ============================================================================

begin;

create extension if not exists "pgcrypto";

-- ============================================================================
-- STEP 1: Drop everything (functions, triggers, policies, tables)
-- ============================================================================

drop function if exists public.zo2y_set_updated_at() cascade;
drop function if exists public.apply_list_rls(text, text) cascade;
drop function if exists public.touch_updated_at() cascade;
drop function if exists public.log_list_activity_iud() cascade;
drop function if exists public.log_custom_list_activity_iud() cascade;
drop function if exists public.log_media_review_activity_iud() cascade;
drop function if exists public.ensure_activity_trigger(text, text, text, text) cascade;
drop function if exists public.zo2y_custom_list_owner_matches(text, text, uuid) cascade;
drop function if exists public.zo2y_get_accessible_custom_lists(text) cascade;

drop table if exists public.anime_list_items cascade;
drop table if exists public.anime_reviews cascade;
drop table if exists public.anime_lists cascade;
drop table if exists public.fashion_list_items cascade;
drop table if exists public.fashion_reviews cascade;
drop table if exists public.fashion_lists cascade;
drop table if exists public.fashion_brands cascade;
drop table if exists public.food_list_items cascade;
drop table if exists public.food_reviews cascade;
drop table if exists public.food_lists cascade;
drop table if exists public.food_brands cascade;
drop table if exists public.car_list_items cascade;
drop table if exists public.car_reviews cascade;
drop table if exists public.car_lists cascade;
drop table if exists public.car_brands cascade;
drop table if exists public.music_list_items cascade;
drop table if exists public.music_reviews cascade;
drop table if exists public.music_lists cascade;
drop table if exists public.tracks cascade;
drop table if exists public.user_album_reviews cascade;
drop table if exists public.albums cascade;
drop table if exists public.game_list_items cascade;
drop table if exists public.game_reviews cascade;
drop table if exists public.game_lists cascade;
drop table if exists public.tv_list_items cascade;
drop table if exists public.tv_reviews cascade;
drop table if exists public.tv_lists cascade;
drop table if exists public.tvshow_list_items cascade;
drop table if exists public.travel_list_items cascade;
drop table if exists public.travel_reviews cascade;
drop table if exists public.travel_plans cascade;
drop table if exists public.travel_lists cascade;
drop table if exists public.teams cascade;
drop table if exists public.user_favorite_teams cascade;
drop table if exists public.book_list_items cascade;
drop table if exists public.book_reviews cascade;
drop table if exists public.book_lists cascade;
drop table if exists public.books cascade;
drop table if exists public.movie_list_items cascade;
drop table if exists public.movie_reviews cascade;
drop table if exists public.movie_lists cascade;
drop table if exists public.games cascade;
drop table if exists public.follows cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.user_interest_profiles cascade;
drop table if exists public.review_reactions cascade;
drop table if exists public.review_replies cascade;
drop table if exists public.list_collaborators cascade;
drop table if exists public.list_tier_meta cascade;
drop table if exists public.list_tier_ranks cascade;
drop table if exists public.user_activity_feed cascade;
drop table if exists public.home_spotlight_cache cascade;
drop table if exists public.analytics_events cascade;
drop table if exists public.support_tickets cascade;
drop table if exists public.security_captcha cascade;
drop table if exists public.security_csrf cascade;
drop table if exists public.security_lockout cascade;
drop table if exists public.security_audit_log cascade;

-- ============================================================================
-- STEP 2: Create tables (dependency-safe order)
-- ============================================================================

-- Independent catalog tables
create table if not exists public.fashion_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  domain text,
  logo_url text,
  description text,
  category text,
  country text,
  founded text,
  tags text[] not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.food_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  domain text,
  logo_url text,
  description text,
  category text,
  country text,
  founded text,
  tags text[] not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.car_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  domain text,
  logo_url text,
  description text,
  category text,
  country text,
  founded text,
  tags text[] not null default '{}',
  created_at timestamptz default now()
);

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

create table if not exists public.books (
  id text primary key,
  title text not null,
  authors text,
  thumbnail text,
  published_date date,
  categories text[],
  description text,
  page_count integer,
  publisher text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.games (
  id bigint primary key,
  title text not null,
  description text,
  cover_url text,
  hero_url text,
  release_date date,
  rating numeric(3,1),
  rating_count integer,
  source text,
  igdb_id bigint,
  rawg_id integer,
  slug text,
  extra jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists public.home_spotlight_cache (
  id uuid primary key default gen_random_uuid(),
  media_type text not null,
  item_id text not null,
  data jsonb not null default '{}',
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.analytics_events (
  id bigint generated by default as identity primary key,
  event_name text not null check (char_length(event_name) between 2 and 80),
  event_properties jsonb not null default '{}'::jsonb,
  page_url text null,
  referrer text null,
  user_agent text null,
  session_id text null,
  client_id text null,
  user_id uuid null references auth.users(id) on delete set null,
  ip_hash text null,
  source text not null default 'web',
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id bigint generated by default as identity primary key,
  name text null,
  email text null,
  category text not null default 'other'
    check (category in ('bug', 'billing', 'account', 'feature', 'abuse', 'other')),
  message text not null check (char_length(message) between 12 and 4000),
  status text not null default 'open'
    check (status in ('open', 'triaged', 'in_progress', 'resolved', 'closed', 'spam')),
  priority text not null default 'low'
    check (priority in ('low', 'medium', 'high')),
  page_url text null,
  user_agent text null,
  ip_hash text null,
  source text not null default 'web',
  user_id uuid null references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  admin_note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_captcha (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  challenge text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists public.security_csrf (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  user_id uuid references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists public.security_lockout (
  id uuid primary key default gen_random_uuid(),
  identifier_hash text not null,
  attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.security_audit_log (
  id bigint generated by default as identity primary key,
  action text not null,
  user_id uuid null references auth.users(id) on delete set null,
  ip_hash text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- User-facing tables
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  bio text,
  location text,
  avatar_icon text,
  is_private boolean default false,
  profile_badges jsonb default '[]',
  profile_theme text,
  onboarding_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, followed_id)
);

create table if not exists public.user_interest_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interest_types text[] not null default '{}',
  interest_tags text[] not null default '{}',
  updated_at timestamptz default now()
);

-- Movies
create table if not exists public.movie_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text default '',
  list_kind text default 'movie',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.movie_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null,
  list_type text,
  list_id uuid null references public.movie_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.movie_reviews (
  id uuid primary key default gen_random_uuid(),
  movie_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Anime
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

create table if not exists public.anime_reviews (
  id uuid primary key default gen_random_uuid(),
  anime_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TV
create table if not exists public.tv_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tv_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tv_id bigint not null,
  list_type text,
  list_id uuid null references public.tv_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.tvshow_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tvshow_id bigint not null,
  list_type text,
  list_id uuid null references public.tv_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.tv_reviews (
  id uuid primary key default gen_random_uuid(),
  tv_id bigint not null,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Games
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

create table if not exists public.game_reviews (
  id uuid primary key default gen_random_uuid(),
  game_id bigint not null,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Music
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

create table if not exists public.user_album_reviews (
  id uuid primary key default gen_random_uuid(),
  album_id text not null references public.albums(album_id) on delete cascade,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Books
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
  book_id text not null references public.books(id) on delete cascade,
  list_type text,
  list_id uuid null references public.book_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id text not null references public.books(id) on delete cascade,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Fashion
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
  brand_id uuid not null references public.fashion_brands(id) on delete cascade,
  list_type text check (list_type in ('favorites', 'owned', 'wishlist')),
  list_id uuid null references public.fashion_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (list_id is not null or list_type in ('favorites', 'owned', 'wishlist'))
);

create table if not exists public.fashion_reviews (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.fashion_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Food
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
  brand_id uuid not null references public.food_brands(id) on delete cascade,
  list_type text check (list_type in ('favorites', 'tried', 'want_to_try')),
  list_id uuid null references public.food_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (list_id is not null or list_type in ('favorites', 'tried', 'want_to_try'))
);

create table if not exists public.food_reviews (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.food_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cars
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
  brand_id uuid not null references public.car_brands(id) on delete cascade,
  list_type text check (list_type in ('favorites', 'owned', 'wishlist')),
  list_id uuid null references public.car_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (list_id is not null or list_type in ('favorites', 'owned', 'wishlist'))
);

create table if not exists public.car_reviews (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.car_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Travel
create table if not exists public.travel_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.travel_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null check (char_length(country_code) between 2 and 3),
  list_type text check (list_type in ('favorites', 'visited', 'bucketlist')),
  list_id uuid null references public.travel_lists(id) on delete cascade,
  check (list_id is not null or list_type in ('favorites', 'visited', 'bucketlist')),
  created_at timestamptz default now()
);

create table if not exists public.travel_reviews (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check (char_length(country_code) between 2 and 3),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null check (char_length(country_code) between 2 and 3),
  cities text[] not null default '{}',
  activities text[] not null default '{}',
  budget_tier text check (budget_tier in ('budget', 'midrange', 'luxury')),
  best_months text[] not null default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sports
create table if not exists public.sports_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.sports_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  team_id text not null,
  list_type text,
  list_id uuid null references public.sports_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.user_favorite_teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  team_id text not null references public.teams(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, team_id)
);

-- Cross-cutting tables
create table if not exists public.list_collaborators (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('movie', 'anime', 'tv', 'game', 'book', 'music', 'sports')),
  list_id text not null,
  list_owner_id uuid not null references auth.users(id) on delete cascade,
  collaborator_id uuid not null references auth.users(id) on delete cascade,
  can_edit boolean not null default false,
  created_at timestamptz default now(),
  unique(media_type, list_id, collaborator_id)
);

create table if not exists public.list_tier_meta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('movie', 'anime', 'tv', 'game', 'book', 'music')),
  list_id uuid not null,
  list_kind text not null default 'standard' check (list_kind in ('standard', 'tier')),
  max_rank integer,
  updated_at timestamptz default now(),
  unique(user_id, media_type, list_id)
);

create table if not exists public.list_tier_ranks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('movie', 'anime', 'tv', 'game', 'book', 'music')),
  list_id uuid not null,
  item_id text not null,
  rank integer not null,
  updated_at timestamptz default now(),
  unique(user_id, media_type, list_id, item_id)
);

-- Review reactions & replies
create table if not exists public.review_reactions (
  id uuid primary key default gen_random_uuid(),
  review_source text not null,
  media_type text,
  review_id text not null,
  target_type text not null,
  target_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_source text not null,
  media_type text,
  review_id text not null,
  parent_reply_id uuid references public.review_replies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity feed
create table if not exists public.user_activity_feed (
  id bigint generated by default as identity primary key,
  actor_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('list_create','list_delete','list_add','list_remove','review_add','review_edit','review_delete')),
  media_type text not null,
  item_id text,
  list_type text,
  list_id uuid,
  rating numeric(3,1),
  review_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- STEP 3: Indexes
-- ============================================================================

create index if not exists idx_fashion_brands_name on public.fashion_brands(name);
create index if not exists idx_fashion_lists_user on public.fashion_lists(user_id);
create index if not exists idx_fashion_list_items_user on public.fashion_list_items(user_id);
create index if not exists idx_fashion_list_items_brand on public.fashion_list_items(brand_id);
create index if not exists idx_fashion_reviews_brand on public.fashion_reviews(brand_id);
create index if not exists idx_fashion_reviews_user on public.fashion_reviews(user_id);
create unique index if not exists ux_fashion_default_items_unique on public.fashion_list_items (user_id, brand_id, list_type) where list_id is null;
create unique index if not exists ux_fashion_custom_items_unique on public.fashion_list_items (list_id, brand_id) where list_id is not null;
create unique index if not exists ux_fashion_reviews_user_brand on public.fashion_reviews (user_id, brand_id);

create index if not exists idx_food_brands_name on public.food_brands(name);
create index if not exists idx_food_lists_user on public.food_lists(user_id);
create index if not exists idx_food_list_items_user on public.food_list_items(user_id);
create index if not exists idx_food_list_items_brand on public.food_list_items(brand_id);
create index if not exists idx_food_reviews_brand on public.food_reviews(brand_id);
create index if not exists idx_food_reviews_user on public.food_reviews(user_id);
create unique index if not exists ux_food_default_items_unique on public.food_list_items (user_id, brand_id, list_type) where list_id is null;
create unique index if not exists ux_food_custom_items_unique on public.food_list_items (list_id, brand_id) where list_id is not null;
create unique index if not exists ux_food_reviews_user_brand on public.food_reviews (user_id, brand_id);

create index if not exists idx_car_brands_name on public.car_brands(name);
create index if not exists idx_car_lists_user on public.car_lists(user_id);
create index if not exists idx_car_list_items_user on public.car_list_items(user_id);
create index if not exists idx_car_list_items_brand on public.car_list_items(brand_id);
create index if not exists idx_car_reviews_brand on public.car_reviews(brand_id);
create index if not exists idx_car_reviews_user on public.car_reviews(user_id);
create unique index if not exists ux_car_default_items_unique on public.car_list_items (user_id, brand_id, list_type) where list_id is null;
create unique index if not exists ux_car_custom_items_unique on public.car_list_items (list_id, brand_id) where list_id is not null;
create unique index if not exists ux_car_reviews_user_brand on public.car_reviews (user_id, brand_id);

create index if not exists idx_tracks_name on public.tracks using gin (to_tsvector('english', coalesce(name, '')));
create index if not exists idx_tracks_artists on public.tracks using gin (to_tsvector('english', coalesce(artists, '')));
create index if not exists idx_music_lists_user on public.music_lists(user_id);
create index if not exists idx_music_list_items_user on public.music_list_items(user_id);
create index if not exists idx_music_list_items_track on public.music_list_items(track_id);
create index if not exists idx_music_reviews_track on public.music_reviews(track_id);
create index if not exists idx_music_reviews_user on public.music_reviews(user_id);
create unique index if not exists ux_music_list_items_unique on public.music_list_items (user_id, track_id, list_type, list_id);

create index if not exists idx_albums_name on public.albums using gin (to_tsvector('english', coalesce(name, '')));
create index if not exists idx_albums_artist_name on public.albums using gin (to_tsvector('english', coalesce(artist_name, '')));
create index if not exists idx_albums_popularity on public.albums(popularity desc nulls last);
create index if not exists idx_albums_release_date on public.albums(release_date desc nulls last);
create index if not exists idx_album_reviews_album on public.user_album_reviews(album_id);
create index if not exists idx_album_reviews_user on public.user_album_reviews(user_id);
create unique index if not exists ux_user_album_reviews_unique on public.user_album_reviews(user_id, album_id);

create index if not exists idx_game_lists_user on public.game_lists(user_id);
create index if not exists idx_game_list_items_user on public.game_list_items(user_id);
create index if not exists idx_game_list_items_game on public.game_list_items(game_id);
create index if not exists idx_game_reviews_game on public.game_reviews(game_id);
create index if not exists idx_game_reviews_user on public.game_reviews(user_id);
create unique index if not exists ux_game_list_items_unique on public.game_list_items (user_id, game_id, list_type, list_id);

create index if not exists idx_tv_lists_user on public.tv_lists(user_id);
create index if not exists idx_tv_list_items_user on public.tv_list_items(user_id);
create index if not exists idx_tv_list_items_tv on public.tv_list_items(tv_id);
create index if not exists idx_tv_reviews_tv on public.tv_reviews(tv_id);
create index if not exists idx_tv_reviews_user on public.tv_reviews(user_id);
create unique index if not exists ux_tv_list_items_unique on public.tv_list_items (user_id, tv_id, list_type, list_id);

create index if not exists idx_travel_lists_user on public.travel_lists(user_id);
create index if not exists idx_travel_list_items_user on public.travel_list_items(user_id);
create index if not exists idx_travel_list_items_country on public.travel_list_items(country_code);
create index if not exists idx_travel_reviews_country on public.travel_reviews(country_code);
create index if not exists idx_travel_reviews_user on public.travel_reviews(user_id);
create index if not exists idx_travel_plans_user on public.travel_plans(user_id);
create index if not exists idx_travel_plans_country on public.travel_plans(country_code);
create unique index if not exists ux_travel_default_items_unique on public.travel_list_items (user_id, country_code, list_type) where list_id is null;
create unique index if not exists ux_travel_custom_items_unique on public.travel_list_items (list_id, country_code) where list_id is not null;
create unique index if not exists ux_travel_reviews_user_country on public.travel_reviews (user_id, country_code);
create unique index if not exists ux_travel_plans_user_country on public.travel_plans (user_id, country_code);

create index if not exists idx_books_title on public.books using gin (to_tsvector('english', coalesce(title, '')));
create index if not exists idx_books_authors on public.books using gin (to_tsvector('english', coalesce(authors, '')));
create index if not exists idx_book_list_items_user on public.book_list_items (user_id);
create index if not exists idx_book_list_items_book on public.book_list_items (book_id);
create index if not exists idx_book_reviews_book on public.book_reviews (book_id);
create index if not exists idx_book_reviews_user on public.book_reviews (user_id);
create unique index if not exists ux_book_list_items_unique on public.book_list_items (user_id, book_id, list_type, list_id);

create index if not exists idx_movie_lists_user on public.movie_lists(user_id);
create index if not exists idx_movie_list_items_user on public.movie_list_items(user_id);
create index if not exists idx_movie_list_items_movie on public.movie_list_items(movie_id);
create index if not exists idx_movie_reviews_movie on public.movie_reviews(movie_id);
create index if not exists idx_movie_reviews_user on public.movie_reviews(user_id);
create unique index if not exists ux_movie_lists_user_title_lower on public.movie_lists(user_id, lower(title));
create unique index if not exists ux_movie_list_items_unique on public.movie_list_items (user_id, movie_id, coalesce(list_type, ''), coalesce(list_id::text, ''));

create index if not exists idx_anime_lists_user on public.anime_lists(user_id);
create index if not exists idx_anime_list_items_user on public.anime_list_items(user_id);
create index if not exists idx_anime_list_items_anime on public.anime_list_items(anime_id);
create index if not exists idx_anime_list_items_list_id on public.anime_list_items(list_id);
create index if not exists idx_anime_reviews_anime on public.anime_reviews(anime_id);
create index if not exists idx_anime_reviews_user on public.anime_reviews(user_id);
create index if not exists idx_anime_reviews_created_at on public.anime_reviews(created_at desc);
create unique index if not exists ux_anime_lists_user_title_lower on public.anime_lists(user_id, lower(title));
create unique index if not exists ux_anime_list_items_unique on public.anime_list_items(user_id, anime_id, coalesce(list_type, ''), coalesce(list_id::text, ''));

create index if not exists idx_sports_lists_user on public.sports_lists(user_id);
create index if not exists idx_sports_list_items_user on public.sports_list_items(user_id);
create index if not exists idx_sports_list_items_team on public.sports_list_items(team_id);
create index if not exists idx_sports_list_items_list_id on public.sports_list_items(list_id);
create unique index if not exists ux_sports_list_items_unique on public.sports_list_items (user_id, team_id, list_type, list_id);
create index if not exists idx_teams_name on public.teams using gin (to_tsvector('english', coalesce(name, '')));
create index if not exists idx_user_favorite_teams_user on public.user_favorite_teams(user_id);
create index if not exists idx_user_favorite_teams_team on public.user_favorite_teams(team_id);

create index if not exists idx_analytics_events_created_at on public.analytics_events (created_at desc);
create index if not exists idx_analytics_events_event_name on public.analytics_events (event_name);
create index if not exists idx_analytics_events_user on public.analytics_events (user_id, created_at desc);

create index if not exists idx_support_tickets_status_created on public.support_tickets (status, created_at desc);
create index if not exists idx_support_tickets_user on public.support_tickets (user_id, created_at desc);

create index if not exists idx_user_activity_feed_actor_created on public.user_activity_feed (actor_id, created_at desc);
create index if not exists idx_user_activity_feed_created on public.user_activity_feed (created_at desc);

-- ============================================================================
-- STEP 4: Updated_at triggers
-- ============================================================================

create or replace function public.zo2y_set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create trigger anime_lists_touch_updated_at before update on public.anime_lists for each row execute function public.touch_updated_at();
create trigger anime_reviews_touch_updated_at before update on public.anime_reviews for each row execute function public.touch_updated_at();
create trigger tv_lists_touch_updated_at before update on public.tv_lists for each row execute function public.touch_updated_at();
create trigger tracks_touch_updated_at before update on public.tracks for each row execute function public.touch_updated_at();
create trigger music_reviews_touch_updated_at before update on public.music_reviews for each row execute function public.touch_updated_at();
create trigger albums_touch_updated_at before update on public.albums for each row execute function public.touch_updated_at();
create trigger user_album_reviews_touch_updated_at before update on public.user_album_reviews for each row execute function public.touch_updated_at();
create trigger game_reviews_touch_updated_at before update on public.game_reviews for each row execute function public.touch_updated_at();
create trigger tv_reviews_touch_updated_at before update on public.tv_reviews for each row execute function public.touch_updated_at();
create trigger travel_reviews_touch_updated_at before update on public.travel_reviews for each row execute function public.touch_updated_at();
create trigger travel_lists_touch_updated_at before update on public.travel_lists for each row execute function public.touch_updated_at();
create trigger travel_plans_touch_updated_at before update on public.travel_plans for each row execute function public.touch_updated_at();
create trigger car_reviews_touch_updated_at before update on public.car_reviews for each row execute function public.touch_updated_at();
create trigger fashion_reviews_touch_updated_at before update on public.fashion_reviews for each row execute function public.touch_updated_at();
create trigger food_reviews_touch_updated_at before update on public.food_reviews for each row execute function public.touch_updated_at();
create trigger teams_touch_updated_at before update on public.teams for each row execute function public.touch_updated_at();
create trigger books_touch_updated_at before update on public.books for each row execute function public.touch_updated_at();
create trigger book_reviews_touch_updated_at before update on public.book_reviews for each row execute function public.touch_updated_at();
create trigger movie_reviews_touch_updated_at before update on public.movie_reviews for each row execute function public.touch_updated_at();
create trigger movie_lists_touch_updated_at before update on public.movie_lists for each row execute function public.touch_updated_at();
create trigger support_tickets_set_updated_at before update on public.support_tickets for each row execute function public.zo2y_set_updated_at();
create trigger user_profiles_touch_updated_at before update on public.user_profiles for each row execute function public.touch_updated_at();
create trigger review_reactions_touch_updated_at before update on public.review_reactions for each row execute function public.touch_updated_at();
create trigger review_replies_touch_updated_at before update on public.review_replies for each row execute function public.touch_updated_at();
create trigger list_tier_meta_touch_updated_at before update on public.list_tier_meta for each row execute function public.touch_updated_at();
create trigger list_tier_ranks_touch_updated_at before update on public.list_tier_ranks for each row execute function public.touch_updated_at();
create trigger user_interest_profiles_touch_updated_at before update on public.user_interest_profiles for each row execute function public.touch_updated_at();

-- ============================================================================
-- STEP 5: Row Level Security (RLS) + Policies
-- ============================================================================

alter table public.fashion_brands enable row level security;
create policy "Public select on fashion_brands" on public.fashion_brands for select using (true);

alter table public.food_brands enable row level security;
create policy "Public select on food_brands" on public.food_brands for select using (true);

alter table public.car_brands enable row level security;
create policy "Public select on car_brands" on public.car_brands for select using (true);

alter table public.tracks enable row level security;
create policy "Public select on tracks" on public.tracks for select using (true);
create policy "Insert tracks for authenticated users" on public.tracks for insert with check (auth.uid() is not null);
create policy "Update tracks for authenticated users" on public.tracks for update using (auth.uid() is not null) with check (auth.uid() is not null);

alter table public.albums enable row level security;
create policy "Public select on albums" on public.albums for select using (true);
create policy "Insert albums for authenticated users" on public.albums for insert with check (auth.uid() is not null);
create policy "Update albums for authenticated users" on public.albums for update using (auth.uid() is not null) with check (auth.uid() is not null);

alter table public.teams enable row level security;
create policy "Public select on teams" on public.teams for select using (true);
create policy "Insert teams" on public.teams for insert with check (auth.uid() is not null);
create policy "Update teams" on public.teams for update using (auth.uid() is not null) with check (auth.uid() is not null);

alter table public.books enable row level security;
create policy "Public select on books" on public.books for select using (true);

alter table public.games enable row level security;
create policy "Public select on games" on public.games for select using (true);

alter table public.user_profiles enable row level security;
create policy "Public select on user_profiles" on public.user_profiles for select using (true);
create policy "Insert own user_profiles" on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "Update own user_profiles" on public.user_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own user_profiles" on public.user_profiles for delete using (auth.uid() = user_id);

alter table public.follows enable row level security;
create policy "Public select on follows" on public.follows for select using (true);
create policy "Insert own follows" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Delete own follows" on public.follows for delete using (auth.uid() = follower_id);

-- Helper: apply standard policies for tables with user_id
create or replace function public.apply_list_rls(table_name text)
returns void language plpgsql as $$
begin
  execute format('alter table public.%I enable row level security;', table_name);
  execute format('drop policy if exists "Public select on %s" on public.%I;', table_name, table_name);
  execute format('create policy "Public select on %s" on public.%I for select using (true);', table_name, table_name);
  execute format('drop policy if exists "Insert own %s" on public.%I;', table_name, table_name);
  execute format('create policy "Insert own %s" on public.%I for insert with check (user_id = auth.uid());', table_name, table_name);
  execute format('drop policy if exists "Update own %s" on public.%I;', table_name, table_name);
  execute format('create policy "Update own %s" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid());', table_name, table_name);
  execute format('drop policy if exists "Delete own %s" on public.%I;', table_name, table_name);
  execute format('create policy "Delete own %s" on public.%I for delete using (user_id = auth.uid());', table_name, table_name);
end;
$$;

select public.apply_list_rls('movie_lists');
select public.apply_list_rls('movie_list_items');
select public.apply_list_rls('movie_reviews');
select public.apply_list_rls('anime_lists');
select public.apply_list_rls('anime_list_items');
select public.apply_list_rls('anime_reviews');
select public.apply_list_rls('tv_lists');
select public.apply_list_rls('tv_list_items');
select public.apply_list_rls('tv_reviews');
select public.apply_list_rls('tvshow_list_items');
select public.apply_list_rls('game_lists');
select public.apply_list_rls('game_list_items');
select public.apply_list_rls('game_reviews');
select public.apply_list_rls('music_lists');
select public.apply_list_rls('music_list_items');
select public.apply_list_rls('music_reviews');
select public.apply_list_rls('book_lists');
select public.apply_list_rls('book_list_items');
select public.apply_list_rls('book_reviews');
select public.apply_list_rls('fashion_lists');
select public.apply_list_rls('fashion_list_items');
select public.apply_list_rls('fashion_reviews');
select public.apply_list_rls('food_lists');
select public.apply_list_rls('food_list_items');
select public.apply_list_rls('food_reviews');
select public.apply_list_rls('car_lists');
select public.apply_list_rls('car_list_items');
select public.apply_list_rls('car_reviews');
select public.apply_list_rls('travel_lists');
select public.apply_list_rls('travel_list_items');
select public.apply_list_rls('travel_reviews');
select public.apply_list_rls('travel_plans');
select public.apply_list_rls('sports_lists');
select public.apply_list_rls('sports_list_items');
select public.apply_list_rls('user_favorite_teams');
select public.apply_list_rls('list_tier_meta');
select public.apply_list_rls('list_tier_ranks');

alter table public.user_album_reviews enable row level security;
create policy "Public select on user_album_reviews" on public.user_album_reviews for select using (true);
create policy "Insert own user_album_reviews" on public.user_album_reviews for insert with check (user_id = auth.uid());
create policy "Update own user_album_reviews" on public.user_album_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own user_album_reviews" on public.user_album_reviews for delete using (user_id = auth.uid());

alter table public.list_collaborators enable row level security;
create policy "Public select on list_collaborators" on public.list_collaborators for select using (true);
create policy "Insert own list_collaborators" on public.list_collaborators for insert with check (auth.uid() = list_owner_id);
create policy "Delete own list_collaborators" on public.list_collaborators for delete using (auth.uid() = list_owner_id);

alter table public.review_reactions enable row level security;
create policy "Public select on review_reactions" on public.review_reactions for select using (true);
create policy "Insert own review_reactions" on public.review_reactions for insert with check (user_id = auth.uid());
create policy "Update own review_reactions" on public.review_reactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own review_reactions" on public.review_reactions for delete using (user_id = auth.uid());

alter table public.review_replies enable row level security;
create policy "Public select on review_replies" on public.review_replies for select using (true);
create policy "Insert own review_replies" on public.review_replies for insert with check (user_id = auth.uid());
create policy "Delete own review_replies" on public.review_replies for delete using (user_id = auth.uid());

alter table public.user_activity_feed enable row level security;
create policy "activity_feed_select_public" on public.user_activity_feed for select to anon, authenticated using (true);
create policy "activity_feed_insert_own" on public.user_activity_feed for insert to authenticated with check (auth.uid() = actor_id);

alter table public.analytics_events enable row level security;
create policy analytics_events_select_own on public.analytics_events for select to authenticated using (user_id = auth.uid());

alter table public.support_tickets enable row level security;
create policy support_tickets_select_own on public.support_tickets for select to authenticated using (user_id = auth.uid());

alter table public.home_spotlight_cache enable row level security;
create policy "Public select on home_spotlight_cache" on public.home_spotlight_cache for select using (true);

alter table public.security_captcha enable row level security;
alter table public.security_csrf enable row level security;
alter table public.security_lockout enable row level security;
alter table public.security_audit_log enable row level security;

alter table public.user_interest_profiles enable row level security;
create policy "Public select on user_interest_profiles" on public.user_interest_profiles for select using (true);
create policy "Insert own user_interest_profiles" on public.user_interest_profiles for insert with check (user_id = auth.uid());
create policy "Update own user_interest_profiles" on public.user_interest_profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- STEP 6: Activity feed functions & triggers (no restaurant refs)
-- ============================================================================

create or replace function public.log_list_activity_iud()
returns trigger language plpgsql as $$
declare
  v_event_type text; v_media_type text; v_item_id text; v_actor_id uuid;
  v_list_type text; v_list_id uuid; v_payload jsonb;
begin
  v_event_type := case tg_op when 'INSERT' then 'list_add' when 'DELETE' then 'list_remove' else null end;
  if v_event_type is null then return coalesce(new, old); end if;
  v_media_type := case tg_table_name
    when 'movie_list_items' then 'movie' when 'tv_list_items' then 'tv'
    when 'anime_list_items' then 'anime' when 'game_list_items' then 'game'
    when 'book_list_items' then 'book' when 'music_list_items' then 'music'
    when 'sports_list_items' then 'sports'
    else null end;
  v_payload := case when tg_op = 'INSERT' then to_jsonb(new) when tg_op = 'DELETE' then to_jsonb(old) else '{}'::jsonb end;
  v_item_id := case tg_table_name
    when 'movie_list_items' then nullif(v_payload->>'movie_id', '') when 'tv_list_items' then nullif(v_payload->>'tv_id', '')
    when 'anime_list_items' then nullif(v_payload->>'anime_id', '') when 'game_list_items' then nullif(v_payload->>'game_id', '')
    when 'book_list_items' then nullif(v_payload->>'book_id', '') when 'music_list_items' then nullif(v_payload->>'track_id', '')
    when 'sports_list_items' then nullif(v_payload->>'team_id', '')
    else null end;
  v_actor_id := nullif(v_payload->>'user_id', '')::uuid;
  v_list_type := nullif(v_payload->>'list_type', '');
  v_list_id := nullif(v_payload->>'list_id', '')::uuid;
  if v_media_type is null or v_item_id is null or v_actor_id is null then return coalesce(new, old); end if;
  insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, list_type, list_id, metadata)
  values (v_actor_id, v_event_type, v_media_type, v_item_id, v_list_type, v_list_id,
    jsonb_build_object('source_table', tg_table_name, 'source_pk', nullif(v_payload->>'id', '')));
  return coalesce(new, old);
end;
$$;

create or replace function public.log_custom_list_activity_iud()
returns trigger language plpgsql as $$
declare
  v_event_type text; v_media_type text; v_actor_id uuid;
  v_list_id uuid; v_list_title text; v_payload jsonb;
begin
  v_event_type := case tg_op when 'INSERT' then 'list_create' when 'DELETE' then 'list_delete' else null end;
  if v_event_type is null then return coalesce(new, old); end if;
  v_media_type := case tg_table_name
    when 'movie_lists' then 'movie' when 'tv_lists' then 'tv'
    when 'anime_lists' then 'anime' when 'game_lists' then 'game'
    when 'book_lists' then 'book' when 'music_lists' then 'music'
    when 'sports_lists' then 'sports'
    else null end;
  v_payload := case when tg_op = 'INSERT' then to_jsonb(new) when tg_op = 'DELETE' then to_jsonb(old) else '{}'::jsonb end;
  v_actor_id := nullif(v_payload->>'user_id', '')::uuid;
  v_list_id := nullif(v_payload->>'id', '')::uuid;
  v_list_title := nullif(trim(v_payload->>'title'), '');
  if v_media_type is null or v_actor_id is null or v_list_id is null then return coalesce(new, old); end if;
  insert into public.user_activity_feed (actor_id, event_type, media_type, list_id, metadata)
  values (v_actor_id, v_event_type, v_media_type, v_list_id,
    jsonb_build_object('source_table', tg_table_name, 'source_pk', nullif(v_payload->>'id', ''), 'list_title', v_list_title));
  return coalesce(new, old);
end;
$$;

create or replace function public.log_media_review_activity_iud()
returns trigger language plpgsql as $$
declare
  v_event_type text; v_media_type text; v_actor_id uuid; v_item_id text;
  v_review_text text; v_rating numeric(3,1); v_payload jsonb; v_metadata jsonb;
begin
  v_event_type := case tg_op when 'INSERT' then 'review_add' when 'UPDATE' then 'review_edit' when 'DELETE' then 'review_delete' else null end;
  if v_event_type is null then return coalesce(new, old); end if;
  v_media_type := case tg_table_name
    when 'movie_reviews' then 'movie' when 'tv_reviews' then 'tv'
    when 'anime_reviews' then 'anime' when 'game_reviews' then 'game'
    when 'book_reviews' then 'book' when 'music_reviews' then 'music'
    when 'user_album_reviews' then 'music'
    else null end;
  v_payload := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) when tg_op = 'DELETE' then to_jsonb(old) else '{}'::jsonb end;
  v_actor_id := nullif(v_payload->>'user_id', '')::uuid;
  v_item_id := case tg_table_name
    when 'movie_reviews' then nullif(v_payload->>'movie_id', '') when 'tv_reviews' then nullif(v_payload->>'tv_id', '')
    when 'anime_reviews' then nullif(v_payload->>'anime_id', '') when 'game_reviews' then nullif(v_payload->>'game_id', '')
    when 'book_reviews' then nullif(v_payload->>'book_id', '') when 'music_reviews' then nullif(v_payload->>'track_id', '')
    when 'user_album_reviews' then nullif(v_payload->>'album_id', '')
    else null end;
  v_review_text := nullif(trim(v_payload->>'comment'), '');
  v_rating := nullif(v_payload->>'rating', '')::numeric(3,1);
  v_metadata := jsonb_build_object('source_table', tg_table_name, 'source_pk', nullif(v_payload->>'id', ''));
  if v_media_type is null or v_actor_id is null or v_item_id is null then return coalesce(new, old); end if;
  insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, rating, review_text, metadata)
  values (v_actor_id, v_event_type, v_media_type, v_item_id, v_rating, v_review_text, v_metadata);
  return coalesce(new, old);
end;
$$;

create or replace function public.ensure_activity_trigger(
  p_table_name text, p_trigger_name text, p_events text, p_function_name text
)
returns void language plpgsql as $$
begin
  if to_regclass(format('public.%s', p_table_name)) is null then return; end if;
  execute format('drop trigger if exists %I on public.%I', p_trigger_name, p_table_name);
  execute format('create trigger %I after %s on public.%I for each row execute function %s()',
    p_trigger_name, p_events, p_table_name, p_function_name);
end;
$$;

-- List items triggers
select ensure_activity_trigger('movie_list_items', 'trg_movie_list_add_activity', 'insert', 'public.log_list_activity_iud');
select ensure_activity_trigger('movie_list_items', 'trg_movie_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select ensure_activity_trigger('tv_list_items', 'trg_tv_list_add_activity', 'insert', 'public.log_list_activity_iud');
select ensure_activity_trigger('tv_list_items', 'trg_tv_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select ensure_activity_trigger('anime_list_items', 'trg_anime_list_add_activity', 'insert', 'public.log_list_activity_iud');
select ensure_activity_trigger('anime_list_items', 'trg_anime_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select ensure_activity_trigger('game_list_items', 'trg_game_list_add_activity', 'insert', 'public.log_list_activity_iud');
select ensure_activity_trigger('game_list_items', 'trg_game_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select ensure_activity_trigger('book_list_items', 'trg_book_list_add_activity', 'insert', 'public.log_list_activity_iud');
select ensure_activity_trigger('book_list_items', 'trg_book_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select ensure_activity_trigger('music_list_items', 'trg_music_list_add_activity', 'insert', 'public.log_list_activity_iud');
select ensure_activity_trigger('music_list_items', 'trg_music_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select ensure_activity_trigger('sports_list_items', 'trg_sports_list_add_activity', 'insert', 'public.log_list_activity_iud');
select ensure_activity_trigger('sports_list_items', 'trg_sports_list_remove_activity', 'delete', 'public.log_list_activity_iud');

-- Custom list triggers
select ensure_activity_trigger('movie_lists', 'trg_movie_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('movie_lists', 'trg_movie_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('tv_lists', 'trg_tv_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('tv_lists', 'trg_tv_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('anime_lists', 'trg_anime_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('anime_lists', 'trg_anime_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('game_lists', 'trg_game_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('game_lists', 'trg_game_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('book_lists', 'trg_book_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('book_lists', 'trg_book_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('music_lists', 'trg_music_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('music_lists', 'trg_music_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('sports_lists', 'trg_sports_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select ensure_activity_trigger('sports_lists', 'trg_sports_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');

-- Review triggers
select ensure_activity_trigger('movie_reviews', 'trg_movie_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('movie_reviews', 'trg_movie_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('movie_reviews', 'trg_movie_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('tv_reviews', 'trg_tv_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('tv_reviews', 'trg_tv_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('tv_reviews', 'trg_tv_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('anime_reviews', 'trg_anime_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('anime_reviews', 'trg_anime_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('anime_reviews', 'trg_anime_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('game_reviews', 'trg_game_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('game_reviews', 'trg_game_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('game_reviews', 'trg_game_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('book_reviews', 'trg_book_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('book_reviews', 'trg_book_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('book_reviews', 'trg_book_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('music_reviews', 'trg_music_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('music_reviews', 'trg_music_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('music_reviews', 'trg_music_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('user_album_reviews', 'trg_album_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('user_album_reviews', 'trg_album_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select ensure_activity_trigger('user_album_reviews', 'trg_album_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');

drop function if exists public.ensure_activity_trigger(text, text, text, text);

-- ============================================================================
-- STEP 7: Collaborative list helper functions (no restaurant refs)
-- ============================================================================

create or replace function public.zo2y_custom_list_owner_matches(
  p_media_type text, p_list_id text, p_owner_id uuid
)
returns boolean language plpgsql stable as $$
declare
  safe_media_type text := lower(trim(coalesce(p_media_type, '')));
  safe_list_id text := trim(coalesce(p_list_id, ''));
  matches_owner boolean := false;
begin
  if p_owner_id is null or safe_list_id = '' then return false; end if;
  case safe_media_type
    when 'movie' then select exists (select 1 from public.movie_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'anime' then select exists (select 1 from public.anime_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'tv' then select exists (select 1 from public.tv_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'game' then select exists (select 1 from public.game_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'book' then select exists (select 1 from public.book_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'music' then select exists (select 1 from public.music_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    else return false;
  end case;
  return coalesce(matches_owner, false);
end;
$$;

create or replace function public.zo2y_get_accessible_custom_lists(p_media_type text)
returns table (id text, user_id uuid, title text, description text, icon text, created_at timestamptz, updated_at timestamptz, is_collaborative boolean, can_edit boolean, list_owner_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  safe_media_type text := lower(trim(coalesce(p_media_type, '')));
  list_table text; sql text;
begin
  if auth.uid() is null then return; end if;
  case safe_media_type
    when 'movie' then list_table := 'movie_lists';
    when 'anime' then list_table := 'anime_lists';
    when 'tv' then list_table := 'tv_lists';
    when 'game' then list_table := 'game_lists';
    when 'book' then list_table := 'book_lists';
    when 'music' then list_table := 'music_lists';
    when 'sports' then list_table := 'sports_lists';
    else return;
  end case;
  if to_regclass(format('public.%s', list_table)) is null then return; end if;
  sql := format($q$
    with own_lists as (
      select l.id::text as id, l.user_id, l.title, l.description, l.icon, l.created_at, l.updated_at,
             false as is_collaborative, true as can_edit, l.user_id as list_owner_id
      from public.%I l where l.user_id = auth.uid()
    ),
    shared_lists as (
      select l.id::text as id, l.user_id, l.title, l.description, l.icon, l.created_at, l.updated_at,
             true as is_collaborative, coalesce(lc.can_edit, false) as can_edit, lc.list_owner_id
      from public.%I l
      join public.list_collaborators lc on lc.media_type = %L and lc.list_id = l.id::text
      where lc.collaborator_id = auth.uid()
    )
    select * from own_lists union all select * from shared_lists order by created_at desc nulls last
  $q$, list_table, list_table, safe_media_type);
  return query execute sql;
end;
$$;

grant execute on function public.zo2y_get_accessible_custom_lists(text) to authenticated;

-- ============================================================================
-- STEP 8: Seed data
-- ============================================================================

insert into public.fashion_brands (name, slug, domain, logo_url, description, category, country, founded, tags) values
  ('Nike', 'nike', 'nike.com', 'https://logo.clearbit.com/nike.com', 'Global sportswear brand.', 'Sportswear', 'USA', '1964', array['sportswear','sneakers']),
  ('Adidas', 'adidas', 'adidas.com', 'https://logo.clearbit.com/adidas.com', 'Athletic apparel and footwear.', 'Sportswear', 'Germany', '1949', array['sportswear','sneakers']),
  ('Zara', 'zara', 'zara.com', 'https://logo.clearbit.com/zara.com', 'Spanish fashion retailer.', 'Fast Fashion', 'Spain', '1975', array['fast fashion']),
  ('Uniqlo', 'uniqlo', 'uniqlo.com', 'https://logo.clearbit.com/uniqlo.com', 'Japanese casualwear brand.', 'Basics', 'Japan', '1949', array['basics']),
  ('H&M', 'hm', 'hm.com', 'https://logo.clearbit.com/hm.com', 'Global fashion retailer.', 'Fast Fashion', 'Sweden', '1947', array['fast fashion']),
  ('Gucci', 'gucci', 'gucci.com', 'https://logo.clearbit.com/gucci.com', 'Italian luxury fashion.', 'Luxury', 'Italy', '1921', array['luxury']),
  ('Prada', 'prada', 'prada.com', 'https://logo.clearbit.com/prada.com', 'Luxury fashion house.', 'Luxury', 'Italy', '1913', array['luxury']),
  ('Louis Vuitton', 'louis-vuitton', 'louisvuitton.com', 'https://logo.clearbit.com/louisvuitton.com', 'French luxury fashion.', 'Luxury', 'France', '1854', array['luxury']),
  ('Supreme', 'supreme', 'supremenewyork.com', 'https://logo.clearbit.com/supremenewyork.com', 'Streetwear brand.', 'Streetwear', 'USA', '1994', array['streetwear']),
  ('Off-White', 'off-white', 'offwhite.com', 'https://logo.clearbit.com/offwhite.com', 'Luxury streetwear label.', 'Streetwear', 'Italy', '2012', array['streetwear','luxury']),
  ('Balenciaga', 'balenciaga', 'balenciaga.com', 'https://logo.clearbit.com/balenciaga.com', 'Luxury fashion house.', 'Luxury', 'France', '1917', array['luxury']),
  ('Stone Island', 'stone-island', 'stoneisland.com', 'https://logo.clearbit.com/stoneisland.com', 'Technical outerwear.', 'Streetwear', 'Italy', '1982', array['outerwear'])
on conflict do nothing;

insert into public.food_brands (name, slug, domain, logo_url, description, category, country, founded, tags) values
  ('McDonald''s', 'mcdonalds', 'mcdonalds.com', 'https://logo.clearbit.com/mcdonalds.com', 'American fast-food chain.', 'Fast Food', 'USA', '1940', array['burgers','fast food']),
  ('KFC', 'kfc', 'kfc.com', 'https://logo.clearbit.com/kfc.com', 'Fried chicken specialists.', 'Fast Food', 'USA', '1952', array['chicken','fast food']),
  ('Burger King', 'burger-king', 'burgerking.com', 'https://logo.clearbit.com/burgerking.com', 'Home of the Whopper.', 'Fast Food', 'USA', '1954', array['burgers','fast food']),
  ('Subway', 'subway', 'subway.com', 'https://logo.clearbit.com/subway.com', 'Sandwich chain.', 'Fast Food', 'USA', '1965', array['sandwiches','fast food']),
  ('Taco Bell', 'taco-bell', 'tacobell.com', 'https://logo.clearbit.com/tacobell.com', 'Mexican-inspired fast food.', 'Fast Food', 'USA', '1962', array['tacos','fast food']),
  ('Domino''s', 'dominos', 'dominos.com', 'https://logo.clearbit.com/dominos.com', 'Pizza delivery chain.', 'Pizza', 'USA', '1960', array['pizza']),
  ('Pizza Hut', 'pizza-hut', 'pizzahut.com', 'https://logo.clearbit.com/pizzahut.com', 'Pizza restaurant chain.', 'Pizza', 'USA', '1958', array['pizza']),
  ('Starbucks', 'starbucks', 'starbucks.com', 'https://logo.clearbit.com/starbucks.com', 'Coffeehouse chain.', 'Coffee', 'USA', '1971', array['coffee']),
  ('Chipotle', 'chipotle', 'chipotle.com', 'https://logo.clearbit.com/chipotle.com', 'Fast casual Mexican grill.', 'Fast Casual', 'USA', '1993', array['mexican','fast casual']),
  ('Chick-fil-A', 'chick-fil-a', 'chick-fil-a.com', 'https://logo.clearbit.com/chick-fil-a.com', 'Chicken sandwich chain.', 'Fast Food', 'USA', '1946', array['chicken','fast food']),
  ('Wendy''s', 'wendys', 'wendys.com', 'https://logo.clearbit.com/wendys.com', 'Fast-food hamburger chain.', 'Fast Food', 'USA', '1969', array['burgers','fast food']),
  ('Shake Shack', 'shake-shack', 'shakeshack.com', 'https://logo.clearbit.com/shakeshack.com', 'Modern burger stand.', 'Fast Casual', 'USA', '2004', array['burgers','fast casual'])
on conflict do nothing;

insert into public.books (id, title, authors, thumbnail, published_date, categories, description, page_count, publisher) values
  ('OL1W', 'Pride and Prejudice', 'Jane Austen', 'https://covers.openlibrary.org/b/olid/OL1M-M.jpg', '1813-01-01', array['Fiction','Romance'], 'A classic novel of manners.', 432, 'T. Egerton'),
  ('OL2W', 'Murder on the Orient Express', 'Agatha Christie', 'https://covers.openlibrary.org/b/isbn/9780007119318-M.jpg', '1934-01-01', array['Mystery','Fiction'], 'Hercule Poirot investigates a murder on a train.', 256, 'Collins Crime Club'),
  ('OL3W', 'The Hobbit', 'J.R.R. Tolkien', 'https://covers.openlibrary.org/b/isbn/9780261102217-M.jpg', '1937-09-21', array['Fantasy','Fiction'], 'Bilbo Baggins goes on an unexpected journey.', 310, 'George Allen & Unwin'),
  ('OL4W', 'Sapiens', 'Yuval Noah Harari', 'https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg', '2011-01-01', array['History','Science'], 'A brief history of humankind.', 498, 'Harper'),
  ('OL5W', 'Atomic Habits', 'James Clear', 'https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg', '2018-10-16', array['Self-Help','Business'], 'Tiny changes, remarkable results.', 320, 'Avery')
on conflict do nothing;

insert into public.analytics_events (event_name, event_properties, source)
values ('migration_bootstrap', jsonb_build_object('migration', 'rebuild_all'), 'system')
on conflict do nothing;

notify pgrst, 'reload schema';

commit;
