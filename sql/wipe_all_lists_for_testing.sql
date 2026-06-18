-- ============================================================================
-- WIPE ALL LISTS FOR TESTING
-- This will delete ALL lists and their items for all users, giving you a 
-- completely clean slate to test the default lists and custom lists again.
-- ============================================================================

-- Delete all list items first (this should cascade, but we do it explicitly to be safe)
DELETE FROM public.list_items;

-- Delete all user lists (custom, favorites, completed, watchlist)
DELETE FROM public.user_lists;

-- Delete all list collaborators
DELETE FROM public.list_collaborators;

-- Reset sequence if there are any (though UUIDs are used, so no sequences usually)
