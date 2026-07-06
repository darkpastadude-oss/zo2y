-- ============================================================
-- Migration 003: Drop Legacy Tables
-- Zo2y V2 — Clean up old per-type tables
-- ============================================================
-- WARNING: This migration is ONLY to be run after verifying
-- 002_migrate_existing_data.sql has completed successfully
-- AND all application code has been updated to use the new
-- unified entities/list_items/reviews tables.
--
-- To run: Uncomment the DROP TABLE statement below, then execute.
-- Verify no remaining application code references these tables first.
-- ============================================================

begin;

-- ============================================================
-- Step 1: Verify migration 002 is complete
-- ============================================================

do $$
declare
  v_entity_count    integer;
  v_list_item_count integer;
  v_review_count    integer;
begin
  select count(*) into v_entity_count    from public.entities;
  select count(*) into v_list_item_count from public.list_items;
  select count(*) into v_review_count    from public.reviews;

  if v_entity_count = 0 then
    raise exception 'Migration 002 has NOT been run (entities table is empty). Aborting.';
  end if;

  if v_list_item_count = 0 then
    raise exception 'Migration 002 has NOT been run (list_items table is empty). Aborting.';
  end if;

  raise notice 'Migration 002 verified: % entities, % list_items, % reviews',
    v_entity_count, v_list_item_count, v_review_count;
end;
$$;

-- ============================================================
-- Step 2: Drop legacy list_items tables
-- ============================================================

-- drop table if exists public.book_list_items cascade;
-- drop table if exists public.music_list_items cascade;
-- drop table if exists public.movie_list_items cascade;
-- drop table if exists public.tv_list_items cascade;
-- drop table if exists public.anime_list_items cascade;
-- drop table if exists public.game_list_items cascade;
-- drop table if exists public.album_list_items cascade;
-- drop table if exists public.fashion_list_items cascade;
-- drop table if exists public.food_list_items cascade;
-- drop table if exists public.car_list_items cascade;
-- drop table if exists public.travel_list_items cascade;

-- ============================================================
-- Step 3: Drop legacy per-type system list tables
-- ============================================================

-- drop table if exists public.book_favorites cascade;
-- drop table if exists public.book_reading_list cascade;
-- drop table if exists public.book_completed cascade;
-- drop table if exists public.book_wishlist cascade;

-- drop table if exists public.music_favorites cascade;

-- drop table if exists public.movie_favorites cascade;
-- drop table if exists public.movie_watchlist cascade;
-- drop table if exists public.movie_watched cascade;

-- drop table if exists public.tv_favorites cascade;
-- drop table if exists public.tv_watchlist cascade;
-- drop table if exists public.tv_watched cascade;

-- drop table if exists public.anime_favorites cascade;
-- drop table if exists public.anime_watchlist cascade;
-- drop table if exists public.anime_watched cascade;
-- drop table if exists public.anime_plan_to_watch cascade;

-- drop table if exists public.game_favorites cascade;
-- drop table if exists public.game_wishlist cascade;
-- drop table if exists public.game_backlog cascade;
-- drop table if exists public.game_playing cascade;
-- drop table if exists public.game_completed cascade;

-- drop table if exists public.album_favorites cascade;
-- drop table if exists public.album_listening cascade;
-- drop table if exists public.album_completed cascade;
-- drop table if exists public.album_wishlist cascade;

-- drop table if exists public.fashion_favorites cascade;
-- drop table if exists public.food_favorites cascade;
-- drop table if exists public.car_favorites cascade;
-- drop table if exists public.travel_favorites cascade;
-- drop table if exists public.travel_visited cascade;
-- drop table if exists public.travel_wishlist cascade;

-- drop table if exists public.user_favorite_teams cascade;

-- ============================================================
-- Step 4: Drop legacy custom list header tables
-- ============================================================

-- drop table if exists public.book_lists cascade;
-- drop table if exists public.music_lists cascade;
-- drop table if exists public.movie_lists cascade;
-- drop table if exists public.tv_lists cascade;
-- drop table if exists public.anime_lists cascade;
-- drop table if exists public.game_lists cascade;
-- drop table if exists public.album_lists cascade;
-- drop table if exists public.fashion_lists cascade;
-- drop table if exists public.food_lists cascade;
-- drop table if exists public.car_lists cascade;
-- drop table if exists public.travel_lists cascade;

-- ============================================================
-- Step 5: Drop legacy review tables
-- ============================================================

-- drop table if exists public.book_reviews cascade;
-- drop table if exists public.movie_reviews cascade;
-- drop table if exists public.tv_reviews cascade;
-- drop table if exists public.anime_reviews cascade;
-- drop table if exists public.game_reviews cascade;

-- ============================================================
-- Step 6: Drop legacy source catalog tables
-- (These may be kept if needed for reference)
-- ============================================================

-- drop table if exists public.books cascade;
-- drop table if exists public.tracks cascade;
-- drop table if exists public.albums cascade;
-- drop table if exists public.teams cascade;
-- drop table if exists public.fashion_brands cascade;
-- drop table if exists public.food_brands cascade;
-- drop table if exists public.car_brands cascade;

-- ============================================================
-- Step 7: Drop legacy misc tables
-- ============================================================

-- drop table if exists public.artist_list_items cascade;

-- ============================================================
-- Verification
-- ============================================================

do $$
declare
  v_remaining integer;
begin
  select count(*) into v_remaining
  from information_schema.tables
  where table_schema = 'public'
    and (table_name like '%list_items%'
    or table_name like '%_favorites'
    or table_name like '%_watchlist'
    or table_name like '%_watched'
    or table_name like '%_reviews'
    or table_name like '%_lists');
  raise notice 'Remaining legacy tables: %', v_remaining;
end;
$$;

commit;
