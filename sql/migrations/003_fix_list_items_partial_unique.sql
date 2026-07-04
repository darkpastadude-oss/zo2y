-- Migration: 003_fix_list_items_partial_unique
-- Replace 4-column unique indexes (user_id, item_id, list_type, list_id)
-- with partial unique indexes that properly handle quick lists vs custom lists.
--
-- WHY:
--   Quick lists (list_id IS NULL):  UNIQUE on (user_id, track_id, list_type)
--   Custom lists (list_id NOT NULL): UNIQUE on (user_id, track_id, list_id)
-- 
-- This is cleaner than NULLS NOT DISTINCT + 4-column index because:
--   1. Self-documenting — each partial index names exactly what it enforces
--   2. No reliance on the PostgreSQL 15+ NULLS NOT DISTINCT extension
--   3. A row can exist in BOTH a quick list AND a custom list (different columns differ)
--   4. The code can DELETE WHERE matching cols alone without guessing about NULLs
--
-- Run once in Supabase SQL Editor.

BEGIN;

-- ============================================================
-- MUSIC
-- ============================================================

-- Step 1: Deduplicate quick list rows (list_id IS NULL)
DELETE FROM public.music_list_items
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, track_id, list_type
             ORDER BY created_at DESC NULLS LAST, id DESC
           ) AS rn
    FROM public.music_list_items
    WHERE list_id IS NULL
  ) t
  WHERE rn > 1
);

-- Step 2: Deduplicate custom list rows (list_id IS NOT NULL)
DELETE FROM public.music_list_items
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, track_id, list_id
             ORDER BY created_at DESC NULLS LAST, id DESC
           ) AS rn
    FROM public.music_list_items
    WHERE list_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Step 3: Drop old 4-column index
DROP INDEX IF EXISTS ux_music_list_items_unique;

-- Step 4: Create partial indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_music_list_items_quick
  ON public.music_list_items (user_id, track_id, list_type)
  WHERE list_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_music_list_items_custom
  ON public.music_list_items (user_id, track_id, list_id)
  WHERE list_id IS NOT NULL;

-- ============================================================
-- BOOKS
-- ============================================================

-- Step 5: Deduplicate quick list rows (list_id IS NULL)
DELETE FROM book_list_items
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, book_id, list_type
             ORDER BY created_at DESC NULLS LAST, id DESC
           ) AS rn
    FROM book_list_items
    WHERE list_id IS NULL
  ) t
  WHERE rn > 1
);

-- Step 6: Deduplicate custom list rows (list_id IS NOT NULL)
DELETE FROM book_list_items
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, book_id, list_id
             ORDER BY created_at DESC NULLS LAST, id DESC
           ) AS rn
    FROM book_list_items
    WHERE list_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- Step 7: Drop old 4-column index
DROP INDEX IF EXISTS ux_book_list_items_unique;

-- Step 8: Create partial indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_book_list_items_quick
  ON book_list_items (user_id, book_id, list_type)
  WHERE list_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_book_list_items_custom
  ON book_list_items (user_id, book_id, list_id)
  WHERE list_id IS NOT NULL;

COMMIT;
