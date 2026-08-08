-- ============================================================
-- 103_list_items_non_partial_unique.sql
-- Make list_items uniqueness PostgREST-addressable.
-- PostgREST on_conflict can ONLY target NON-partial unique
-- indexes/constraints. The partial indexes created by migration
-- 100 cannot be referenced, so EVERY upsert into list_items
-- failed with "no unique or exclusion constraint matching the
-- ON CONFLICT specification".
--
-- Semantics are preserved exactly: Postgres treats NULLs as
-- distinct in unique indexes, so:
--   - default rows (list_id IS NULL, list_type set) are unique
--     per (user_id, media_type, item_id, list_type) and never
--     collide with custom rows (list_type IS NULL).
--   - custom rows (list_id set) are unique per
--     (list_id, media_type, item_id) and never collide with
--     default rows (list_id IS NULL).
-- The list_items_xor CHECK keeps list_id/list_type mutually
-- exclusive, so the two indexes never overlap.
--
-- Run this ONCE in the Supabase SQL editor.
-- ============================================================

begin;

drop index if exists public.ux_list_items_default;
drop index if exists public.ux_list_items_custom;

create unique index if not exists ux_list_items_default
  on public.list_items (user_id, media_type, item_id, list_type);

create unique index if not exists ux_list_items_custom
  on public.list_items (list_id, media_type, item_id);

notify pgrst, 'reload schema';

commit;