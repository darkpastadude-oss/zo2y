-- Migration: 002_fix_list_items_unique_null
-- Fix 409 Conflict errors when saving books/music to quick lists.
--
-- Root cause: PostgreSQL standard unique indexes treat NULL != NULL.
-- So two rows with (user_id, book_id, 'favorites', NULL) are considered
-- distinct by the index, causing duplicate rows and 409 on re-insert.
--
-- Fix: Recreate the unique indexes with NULLS NOT DISTINCT (PostgreSQL 15+)
-- so that (user_id, book_id, list_type, NULL) is treated as a unique identity.
--
-- Run this in the Supabase SQL Editor.
-- NOTE: PostgreSQL 15+ is required for NULLS NOT DISTINCT.
-- Supabase cloud runs PostgreSQL 15+, so this is safe.

-- -- book_list_items ----------------------------------------------------------

DROP INDEX IF EXISTS ux_book_list_items_unique;

CREATE UNIQUE INDEX ux_book_list_items_unique
  ON book_list_items (user_id, book_id, list_type, list_id)
  NULLS NOT DISTINCT;

-- -- music_list_items ---------------------------------------------------------

DROP INDEX IF EXISTS ux_music_list_items_unique;

CREATE UNIQUE INDEX ux_music_list_items_unique
  ON public.music_list_items (user_id, track_id, list_type, list_id)
  NULLS NOT DISTINCT;
