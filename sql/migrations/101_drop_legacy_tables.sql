-- =================================================================
-- DROP LEGACY PER-TYPE TABLES
-- =================================================================
-- Runs AFTER 100_unified_list_items.sql has been verified working.
-- Wraps each DROP in a regclass guard so it's safe to re-run.
-- =================================================================

-- ============================================================
-- 1. Drop legacy *_list_items / user_favorite_teams tables
-- ============================================================
-- These are child tables with FKs to parent entity tables (books, tracks, etc.)
-- Safe to drop: they're the referencing side, not the referenced side.

do $$ begin
  if to_regclass('public.movie_list_items') is not null then
    drop table public.movie_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.tv_list_items') is not null then
    drop table public.tv_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.anime_list_items') is not null then
    drop table public.anime_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.game_list_items') is not null then
    drop table public.game_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.book_list_items') is not null then
    drop table public.book_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.music_list_items') is not null then
    drop table public.music_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.travel_list_items') is not null then
    drop table public.travel_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.fashion_list_items') is not null then
    drop table public.fashion_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.food_list_items') is not null then
    drop table public.food_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.car_list_items') is not null then
    drop table public.car_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.artist_list_items') is not null then
    drop table public.artist_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.sports_list_items') is not null then
    drop table public.sports_list_items;
  end if;
end $$;

do $$ begin
  if to_regclass('public.user_favorite_teams') is not null then
    drop table public.user_favorite_teams;
  end if;
end $$;

-- ============================================================
-- 2. Drop legacy *_reviews / user_album_reviews tables
-- ============================================================

do $$ begin
  if to_regclass('public.movie_reviews') is not null then
    drop table public.movie_reviews;
  end if;
end $$;

do $$ begin
  if to_regclass('public.tv_reviews') is not null then
    drop table public.tv_reviews;
  end if;
end $$;

do $$ begin
  if to_regclass('public.anime_reviews') is not null then
    drop table public.anime_reviews;
  end if;
end $$;

do $$ begin
  if to_regclass('public.game_reviews') is not null then
    drop table public.game_reviews;
  end if;
end $$;

do $$ begin
  if to_regclass('public.book_reviews') is not null then
    drop table public.book_reviews;
  end if;
end $$;

do $$ begin
  if to_regclass('public.music_reviews') is not null then
    drop table public.music_reviews;
  end if;
end $$;

do $$ begin
  if to_regclass('public.travel_reviews') is not null then
    drop table public.travel_reviews;
  end if;
end $$;

do $$ begin
  if to_regclass('public.fashion_reviews') is not null then
    drop table public.fashion_reviews;
  end if;
end $$;

do $$ begin
  if to_regclass('public.food_reviews') is not null then
    drop table public.food_reviews;
  end if;
end $$;

do $$ begin
  if to_regclass('public.car_reviews') is not null then
    drop table public.car_reviews;
  end if;
end $$;

do $$ begin
  if to_regclass('public.user_album_reviews') is not null then
    drop table public.user_album_reviews;
  end if;
end $$;

-- ============================================================
-- 3. Drop legacy *_lists tables
-- ============================================================
-- NOTE: book_lists may have FK references from old book.html code paths.
-- list_collaborators.list_id and list_tier_meta.list_id may reference these.
-- The migration (100) already backfilled list_uuid from these, so safe to drop.

do $$ begin
  if to_regclass('public.movie_lists') is not null then
    drop table public.movie_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.tv_lists') is not null then
    drop table public.tv_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.anime_lists') is not null then
    drop table public.anime_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.game_lists') is not null then
    drop table public.game_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.book_lists') is not null then
    drop table public.book_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.music_lists') is not null then
    drop table public.music_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.travel_lists') is not null then
    drop table public.travel_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.fashion_lists') is not null then
    drop table public.fashion_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.food_lists') is not null then
    drop table public.food_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.car_lists') is not null then
    drop table public.car_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.artist_lists') is not null then
    drop table public.artist_lists;
  end if;
end $$;

do $$ begin
  if to_regclass('public.sports_lists') is not null then
    drop table public.sports_lists;
  end if;
end $$;

-- ============================================================
-- 4. Drop old list_id text columns from list_collaborators / list_tier_meta
-- ============================================================
-- After migration 100, these tables have list_uuid (UUID FK) instead.
-- The old list_id text columns are no longer used.

do $$ begin
  if to_regclass('public.list_collaborators') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'list_collaborators' and column_name = 'list_id'
     ) then
    alter table public.list_collaborators drop column list_id;
  end if;
end $$;

do $$ begin
  if to_regclass('public.list_tier_meta') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'list_tier_meta' and column_name = 'list_id'
     ) then
    alter table public.list_tier_meta drop column list_id;
  end if;
end $$;
