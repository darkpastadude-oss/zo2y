-- Migration: 002_fix_list_items_unique_null
-- Fix duplicate rows and recreate unique indexes with NULLS NOT DISTINCT.
--
-- WHY: PostgreSQL standard unique indexes treat NULL != NULL, allowing
-- multiple rows with (user_id, item_id, list_type, NULL). Rows accumulated
-- over time. This migration deduplicates existing rows first, then recreates
-- the indexes correctly.
--
-- Run in Supabase SQL Editor. PostgreSQL 15+ required (Supabase cloud is fine).

-- -- Step 1: Deduplicate book_list_items (keep newest row per unique key) ----

DELETE FROM book_list_items
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, book_id, list_type, list_id
             ORDER BY created_at DESC NULLS LAST, id DESC
           ) AS rn
    FROM book_list_items
  ) t
  WHERE rn > 1
);

-- -- Step 2: Recreate unique index with NULLS NOT DISTINCT --------------------

DROP INDEX IF EXISTS ux_book_list_items_unique;

CREATE UNIQUE INDEX ux_book_list_items_unique
  ON book_list_items (user_id, book_id, list_type, list_id)
  NULLS NOT DISTINCT;

-- -- Step 3: Deduplicate music_list_items -------------------------------------

DELETE FROM public.music_list_items
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, track_id, list_type, list_id
             ORDER BY created_at DESC NULLS LAST, id DESC
           ) AS rn
    FROM public.music_list_items
  ) t
  WHERE rn > 1
);

-- -- Step 4: Recreate unique index with NULLS NOT DISTINCT --------------------

DROP INDEX IF EXISTS ux_music_list_items_unique;

CREATE UNIQUE INDEX ux_music_list_items_unique
  ON public.music_list_items (user_id, track_id, list_type, list_id)
  NULLS NOT DISTINCT;
