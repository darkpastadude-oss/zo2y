-- SQL Migration for Profile Refactor

-- 1. Create the profile_showcase table
CREATE TABLE IF NOT EXISTS public.profile_showcase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL,
    list_id TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, media_type)
);

-- RLS for profile_showcase
ALTER TABLE public.profile_showcase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read showcase" 
ON public.profile_showcase FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own showcase" 
ON public.profile_showcase FOR ALL 
USING (auth.uid() = user_id);

-- 2. Ensure display_order columns exist on existing lists and list_items tables
-- This provides unified drag-and-drop order support without migrating everything to a single table.

-- Function to safely add column if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(table_name text, column_name text, column_type text, default_val text)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = add_column_if_not_exists.table_name 
        AND column_name = add_column_if_not_exists.column_name
    ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s DEFAULT %s', table_name, column_name, column_type, default_val);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to all known media lists
SELECT add_column_if_not_exists('movie_lists', 'display_order', 'INTEGER', '0');
SELECT add_column_if_not_exists('movie_list_items', 'display_order', 'INTEGER', '0');

SELECT add_column_if_not_exists('tv_lists', 'display_order', 'INTEGER', '0');
SELECT add_column_if_not_exists('tv_list_items', 'display_order', 'INTEGER', '0');

SELECT add_column_if_not_exists('anime_lists', 'display_order', 'INTEGER', '0');
SELECT add_column_if_not_exists('anime_list_items', 'display_order', 'INTEGER', '0');

SELECT add_column_if_not_exists('game_lists', 'display_order', 'INTEGER', '0');
SELECT add_column_if_not_exists('game_list_items', 'display_order', 'INTEGER', '0');

SELECT add_column_if_not_exists('book_lists', 'display_order', 'INTEGER', '0');
SELECT add_column_if_not_exists('book_list_items', 'display_order', 'INTEGER', '0');

SELECT add_column_if_not_exists('music_lists', 'display_order', 'INTEGER', '0');
SELECT add_column_if_not_exists('music_list_items', 'display_order', 'INTEGER', '0');

SELECT add_column_if_not_exists('travel_lists', 'display_order', 'INTEGER', '0');
SELECT add_column_if_not_exists('travel_list_items', 'display_order', 'INTEGER', '0');

SELECT add_column_if_not_exists('fashion_lists', 'display_order', 'INTEGER', '0');
SELECT add_column_if_not_exists('fashion_list_items', 'display_order', 'INTEGER', '0');

SELECT add_column_if_not_exists('food_lists', 'display_order', 'INTEGER', '0');
SELECT add_column_if_not_exists('food_list_items', 'display_order', 'INTEGER', '0');

SELECT add_column_if_not_exists('car_lists', 'display_order', 'INTEGER', '0');
SELECT add_column_if_not_exists('car_list_items', 'display_order', 'INTEGER', '0');

DROP FUNCTION add_column_if_not_exists;

-- Ensure indexes are present for performance
CREATE INDEX IF NOT EXISTS idx_profile_showcase_user ON public.profile_showcase(user_id);
