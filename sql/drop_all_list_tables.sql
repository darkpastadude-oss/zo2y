-- Drop all list-related tables and their dependencies
-- Run this in Supabase SQL editor to clear all list data

begin;

-- Drop unified media list tables (phase 1)
drop table if exists public.media_list_items cascade;
drop table if exists public.media_lists cascade;

-- Drop collaborative and tier list tables
drop table if exists public.list_tier_ranks cascade;
drop table if exists public.list_tier_meta cascade;
drop table if exists public.list_collaborators cascade;

-- Drop per-media list tables
drop table if exists public.movie_list_items cascade;
drop table if exists public.movie_lists cascade;

drop table if exists public.tv_list_items cascade;
drop table if exists public.tv_lists cascade;

drop table if exists public.anime_list_items cascade;
drop table if exists public.anime_lists cascade;

drop table if exists public.game_list_items cascade;
drop table if exists public.game_lists cascade;

drop table if exists public.book_list_items cascade;
drop table if exists public.book_lists cascade;

drop table if exists public.music_list_items cascade;
drop table if exists public.music_lists cascade;

drop table if exists public.travel_list_items cascade;
drop table if exists public.travel_lists cascade;

drop table if exists public.fashion_list_items cascade;
drop table if exists public.fashion_lists cascade;

drop table if exists public.food_list_items cascade;
drop table if exists public.food_lists cascade;

drop table if exists public.car_list_items cascade;
drop table if exists public.car_lists cascade;

-- Drop legacy restaurant tables
drop table if exists public.lists_restraunts cascade;
drop table if exists public.lists cascade;

commit;
