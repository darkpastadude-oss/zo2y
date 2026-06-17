-- ============================================================================
-- UNIFIED LISTS CLEANUP & FIX
-- Run AFTER unified_lists_migration.sql and post_migration_fixes.sql
-- Fixes: duplicate defaults, missing RPC columns, stale old tables
-- ============================================================================

begin;

-- ============================================================================
-- FIX 1: Drop old per-category list tables (they are replaced by unified)
-- Uncomment any that still exist and need cleanup
-- ============================================================================

DO $$ BEGIN
  IF to_regclass('public.music_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.music_list_items CASCADE;
    RAISE NOTICE 'Dropped music_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.movie_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.movie_list_items CASCADE;
    RAISE NOTICE 'Dropped movie_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.tv_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.tv_list_items CASCADE;
    RAISE NOTICE 'Dropped tv_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.tvshow_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.tvshow_list_items CASCADE;
    RAISE NOTICE 'Dropped tvshow_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.anime_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.anime_list_items CASCADE;
    RAISE NOTICE 'Dropped anime_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.game_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.game_list_items CASCADE;
    RAISE NOTICE 'Dropped game_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.book_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.book_list_items CASCADE;
    RAISE NOTICE 'Dropped book_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.travel_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.travel_list_items CASCADE;
    RAISE NOTICE 'Dropped travel_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.sports_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.sports_list_items CASCADE;
    RAISE NOTICE 'Dropped sports_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.fashion_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.fashion_list_items CASCADE;
    RAISE NOTICE 'Dropped fashion_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.food_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.food_list_items CASCADE;
    RAISE NOTICE 'Dropped food_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.car_list_items') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.car_list_items CASCADE;
    RAISE NOTICE 'Dropped car_list_items';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.music_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.music_lists CASCADE;
    RAISE NOTICE 'Dropped music_lists';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.movie_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.movie_lists CASCADE;
    RAISE NOTICE 'Dropped movie_lists';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.tv_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.tv_lists CASCADE;
    RAISE NOTICE 'Dropped tv_lists';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.anime_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.anime_lists CASCADE;
    RAISE NOTICE 'Dropped anime_lists';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.game_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.game_lists CASCADE;
    RAISE NOTICE 'Dropped game_lists';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.book_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.book_lists CASCADE;
    RAISE NOTICE 'Dropped book_lists';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.travel_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.travel_lists CASCADE;
    RAISE NOTICE 'Dropped travel_lists';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.sports_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.sports_lists CASCADE;
    RAISE NOTICE 'Dropped sports_lists';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.fashion_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.fashion_lists CASCADE;
    RAISE NOTICE 'Dropped fashion_lists';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.food_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.food_lists CASCADE;
    RAISE NOTICE 'Dropped food_lists';
  END IF;
END $$;

DO $$ BEGIN
  IF to_regclass('public.car_lists') IS NOT NULL THEN
    DROP TABLE IF EXISTS public.car_lists CASCADE;
    RAISE NOTICE 'Dropped car_lists';
  END IF;
END $$;

-- ============================================================================
-- FIX 2: Ensure list_items has the correct schema (no list_type column)
-- If list_items has a stale list_type column from an old schema, remove it
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'list_items'
      AND column_name = 'list_type'
  ) THEN
    ALTER TABLE public.list_items DROP COLUMN IF EXISTS list_type;
    RAISE NOTICE 'Dropped stale list_type column from list_items';
  END IF;
END $$;

-- ============================================================================
-- FIX 3: Remove duplicate default lists
-- If a user has custom lists with the same name as a default list type,
-- merge items into the default list and delete the custom duplicate
-- ============================================================================

DO $$
DECLARE
  v_rec record;
  v_default_id uuid;
  v_item_count int;
  v_total_deleted int := 0;
  v_total_moved int := 0;
BEGIN
  FOR v_rec IN
    SELECT
      ul.id AS custom_id,
      ul.user_id,
      ul.category,
      ul.name,
      dl.id AS default_id
    FROM public.user_lists ul
    JOIN public.user_lists dl
      ON dl.user_id = ul.user_id
      AND dl.category = ul.category
      AND dl.type != 'custom'
      AND lower(dl.name) = lower(ul.name)
    WHERE ul.type = 'custom'
  LOOP
    -- Check if default list exists
    IF v_rec.default_id IS NULL THEN
      -- No matching default, skip
      CONTINUE;
    END IF;

    SELECT count(*) INTO v_item_count
    FROM public.list_items
    WHERE list_id = v_rec.custom_id;

    IF v_item_count > 0 THEN
      INSERT INTO public.list_items (list_id, external_id, external_source, external_type, added_at)
      SELECT v_rec.default_id, li.external_id, li.external_source, li.external_type, li.added_at
      FROM public.list_items li
      WHERE li.list_id = v_rec.custom_id
      ON CONFLICT (list_id, external_id) DO NOTHING;

      GET DIAGNOSTICS v_item_count = ROW_COUNT;
      v_total_moved := v_total_moved + v_item_count;
    END IF;

    DELETE FROM public.list_items WHERE list_id = v_rec.custom_id;
    DELETE FROM public.user_lists WHERE id = v_rec.custom_id;
    v_total_deleted := v_total_deleted + 1;
  END LOOP;

  RAISE NOTICE 'Cleanup: % duplicate custom lists deleted, % items moved to defaults', v_total_deleted, v_total_moved;
END;
$$;

-- ============================================================================
-- FIX 4: Ensure every user has default lists for all categories
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_user_default_lists(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_categories text[] := array[
    'movie', 'tv', 'book', 'anime', 'game', 'sport', 'car',
    'food', 'fashion', 'travel', 'music'
  ];
  v_cat text;
  v_icon text;
BEGIN
  FOREACH v_cat IN ARRAY v_categories
  LOOP
    v_icon := CASE v_cat
      WHEN 'movie' THEN 'fas fa-film'
      WHEN 'tv' THEN 'fas fa-tv'
      WHEN 'book' THEN 'fas fa-book'
      WHEN 'anime' THEN 'fas fa-dragon'
      WHEN 'game' THEN 'fas fa-gamepad'
      WHEN 'music' THEN 'fas fa-music'
      WHEN 'travel' THEN 'fas fa-earth-americas'
      WHEN 'sport' THEN 'fas fa-futbol'
      WHEN 'fashion' THEN 'fas fa-shirt'
      WHEN 'food' THEN 'fas fa-burger'
      WHEN 'car' THEN 'fas fa-car'
      ELSE 'fas fa-list'
    END;

    -- Favorites
    INSERT INTO public.user_lists (user_id, name, category, type, icon, sort_order)
    VALUES (p_user_id, 'Favorites', v_cat::public.user_list_category, 'favorites', v_icon, 0)
    ON CONFLICT (user_id, category, name) DO NOTHING;

    -- Completed
    INSERT INTO public.user_lists (user_id, name, category, type, icon, sort_order)
    VALUES (
      p_user_id,
      CASE v_cat
        WHEN 'movie' THEN 'Watched'
        WHEN 'tv' THEN 'Watched'
        WHEN 'anime' THEN 'Watched'
        WHEN 'book' THEN 'Read'
        WHEN 'game' THEN 'Played'
        WHEN 'music' THEN 'Listened'
        WHEN 'travel' THEN 'Visited'
        WHEN 'sport' THEN 'Watched'
        WHEN 'fashion' THEN 'Owned'
        WHEN 'food' THEN 'Tried'
        WHEN 'car' THEN 'Owned'
        ELSE 'Completed'
      END,
      v_cat::public.user_list_category,
      'completed',
      CASE v_cat
        WHEN 'movie' THEN 'fas fa-eye'
        WHEN 'tv' THEN 'fas fa-eye'
        WHEN 'anime' THEN 'fas fa-eye'
        WHEN 'book' THEN 'fas fa-check'
        WHEN 'game' THEN 'fas fa-check'
        WHEN 'music' THEN 'fas fa-headphones'
        WHEN 'travel' THEN 'fas fa-check'
        WHEN 'sport' THEN 'fas fa-eye'
        WHEN 'fashion' THEN 'fas fa-check'
        WHEN 'food' THEN 'fas fa-utensils'
        WHEN 'car' THEN 'fas fa-check'
        ELSE 'fas fa-check'
      END,
      1
    )
    ON CONFLICT (user_id, category, name) DO NOTHING;

    -- Watchlist
    INSERT INTO public.user_lists (user_id, name, category, type, icon, sort_order)
    VALUES (
      p_user_id,
      CASE v_cat
        WHEN 'movie' THEN 'Watchlist'
        WHEN 'tv' THEN 'Watchlist'
        WHEN 'anime' THEN 'Watchlist'
        WHEN 'book' THEN 'Reading List'
        WHEN 'game' THEN 'Backlog'
        WHEN 'music' THEN 'Listen Later'
        WHEN 'travel' THEN 'Bucket List'
        WHEN 'sport' THEN 'Watchlist'
        WHEN 'fashion' THEN 'Wishlist'
        WHEN 'food' THEN 'Want to Try'
        WHEN 'car' THEN 'Wishlist'
        ELSE 'Watchlist'
      END,
      v_cat::public.user_list_category,
      'watchlist',
      CASE v_cat
        WHEN 'movie' THEN 'fas fa-bookmark'
        WHEN 'tv' THEN 'fas fa-bookmark'
        WHEN 'anime' THEN 'fas fa-bookmark'
        WHEN 'book' THEN 'fas fa-bookmark'
        WHEN 'game' THEN 'fas fa-clock'
        WHEN 'music' THEN 'fas fa-clock'
        WHEN 'travel' THEN 'fas fa-list'
        WHEN 'sport' THEN 'fas fa-bookmark'
        WHEN 'fashion' THEN 'fas fa-heart'
        WHEN 'food' THEN 'fas fa-clipboard-list'
        WHEN 'car' THEN 'fas fa-heart'
        ELSE 'fas fa-bookmark'
      END,
      2
    )
    ON CONFLICT (user_id, category, name) DO NOTHING;
  END LOOP;
END;
$$;

-- ============================================================================
-- FIX 5: Ensure zo2y_get_accessible_custom_lists returns only custom lists
-- (not default lists that should be filtered on the client)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.zo2y_get_accessible_custom_lists(p_media_type text)
RETURNS TABLE (
  id text,
  user_id uuid,
  title text,
  description text,
  icon text,
  created_at timestamptz,
  updated_at timestamptz,
  is_collaborative boolean,
  can_edit boolean,
  list_owner_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_media_type text := lower(trim(coalesce(p_media_type, '')));
  cat_map text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  cat_map := CASE safe_media_type
    WHEN 'movie' THEN 'movie'
    WHEN 'anime' THEN 'anime'
    WHEN 'tv' THEN 'tv'
    WHEN 'game' THEN 'game'
    WHEN 'book' THEN 'book'
    WHEN 'music' THEN 'music'
    WHEN 'sports' THEN 'sport'
    WHEN 'travel' THEN 'travel'
    WHEN 'fashion' THEN 'fashion'
    WHEN 'food' THEN 'food'
    WHEN 'car' THEN 'car'
    ELSE NULL
  END;

  IF cat_map IS NULL THEN
    RETURN;
  END IF;

  IF to_regclass('public.user_lists') IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
    WITH own_lists AS (
      SELECT
        l.id::text AS id,
        l.user_id,
        l.name AS title,
        l.description,
        l.icon,
        l.created_at,
        l.updated_at,
        false AS is_collaborative,
        true AS can_edit,
        l.user_id AS list_owner_id
      FROM public.user_lists l
      WHERE l.user_id = auth.uid()
        AND l.category = cat_map::public.user_list_category
        AND l.type = 'custom'
    ),
    shared_lists AS (
      SELECT
        l.id::text AS id,
        l.user_id,
        l.name AS title,
        l.description,
        l.icon,
        l.created_at,
        l.updated_at,
        true AS is_collaborative,
        coalesce(lc.can_edit, false) AS can_edit,
        lc.list_owner_id
      FROM public.user_lists l
      JOIN public.list_collaborators lc
        ON lc.media_type = safe_media_type
       AND lc.list_id = l.id::text
      WHERE lc.collaborator_id = auth.uid()
        AND l.category = cat_map::public.user_list_category
        AND l.type = 'custom'
    )
    SELECT * FROM own_lists
    UNION ALL
    SELECT * FROM shared_lists
    ORDER BY created_at DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.zo2y_get_accessible_custom_lists(text) TO authenticated;

-- ============================================================================
-- FIX 6: Revoke execute on old RPC functions that may have stale params
-- ============================================================================

-- Ensure toggle_list_item properly handles the unified types
CREATE OR REPLACE FUNCTION public.toggle_list_item(
  p_user_id uuid,
  p_category text,
  p_list_type text,
  p_external_id text,
  p_external_source text DEFAULT 'local_db',
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_list_id uuid;
  v_exists boolean;
  v_cat public.user_list_category;
  v_type public.user_list_type;
BEGIN
  v_cat := p_category::public.user_list_category;
  v_type := p_list_type::public.user_list_type;

  IF v_type = 'custom' THEN
    RAISE EXCEPTION 'toggle_list_item does not support custom lists' USING errcode = 'P0001';
  END IF;

  -- Find the default list
  SELECT id INTO v_list_id
  FROM public.user_lists
  WHERE user_id = p_user_id
    AND category = v_cat
    AND type = v_type
  LIMIT 1;

  IF v_list_id IS NULL THEN
    -- Auto-create default lists for this user if missing
    PERFORM public.create_default_user_lists(p_user_id);
    SELECT id INTO v_list_id
    FROM public.user_lists
    WHERE user_id = p_user_id
      AND category = v_cat
      AND type = v_type
    LIMIT 1;
  END IF;

  IF v_list_id IS NULL THEN
    RAISE EXCEPTION 'Default list not found for category % type %', p_category, p_list_type USING errcode = 'P0002';
  END IF;

  -- Check if item exists
  SELECT EXISTS(
    SELECT 1 FROM public.list_items
    WHERE list_id = v_list_id AND external_id = p_external_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.list_items
    WHERE list_id = v_list_id AND external_id = p_external_id;
    RETURN jsonb_build_object('action', 'removed', 'list_id', v_list_id);
  ELSE
    INSERT INTO public.list_items (list_id, external_id, external_source, external_type, metadata)
    VALUES (v_list_id, p_external_id, p_external_source, v_cat, coalesce(p_metadata, '{}'::jsonb))
    ON CONFLICT (list_id, external_id) DO NOTHING;
    RETURN jsonb_build_object('action', 'added', 'list_id', v_list_id);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_list_item(uuid, text, text, text, text, jsonb) TO authenticated;

-- ============================================================================
-- FIX 7: Add index on list_items.external_id for faster status lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_list_items_external_id
  ON public.list_items(external_id);

-- ============================================================================
-- DONE
-- ============================================================================

RAISE NOTICE 'Unified lists cleanup complete. Old per-category tables dropped, defaults deduplicated, RPCs fixed.';

commit;
