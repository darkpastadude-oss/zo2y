-- ============================================================
-- Migration: Profile Showcase System
-- Adds display_order to lists and list_items,
-- creates profile_showcase table, and migrates existing data.
-- ============================================================

-- 1. Add display_order to all custom list tables
ALTER TABLE movie_lists   ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE tv_lists      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE anime_lists   ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE game_lists    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE book_lists    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE music_lists   ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE travel_lists  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE fashion_lists ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE food_lists    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE car_lists     ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE sports_lists  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. Add display_order to all list item tables
ALTER TABLE movie_list_items   ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE tv_list_items      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE anime_list_items   ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE game_list_items    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE book_list_items    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE music_list_items   ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE travel_list_items  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE fashion_list_items ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE food_list_items    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE car_list_items     ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE sports_list_items  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 3. Create profile_showcase table
CREATE TABLE IF NOT EXISTS profile_showcase (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_type  TEXT NOT NULL,
    list_id     TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_hidden   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, media_type, list_id)
);

-- 4. Enable RLS
ALTER TABLE profile_showcase ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies: users can only manage their own showcase rows
CREATE POLICY "Users can view their own showcase"
    ON profile_showcase FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own showcase"
    ON profile_showcase FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own showcase"
    ON profile_showcase FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own showcase"
    ON profile_showcase FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Default migration: populate profile_showcase for existing users
-- For each media type, if the user has items in the 'favorites' default list,
-- create a showcase entry pointing to 'favorites'.
INSERT INTO profile_showcase (user_id, media_type, list_id, display_order)
SELECT uli.user_id, 'movie', 'favorites', 0
FROM (SELECT DISTINCT user_id FROM movie_list_items WHERE list_type = 'favorites') uli
WHERE NOT EXISTS (
    SELECT 1 FROM profile_showcase ps
    WHERE ps.user_id = uli.user_id AND ps.media_type = 'movie' AND ps.list_id = 'favorites'
)
ON CONFLICT (user_id, media_type, list_id) DO NOTHING;

INSERT INTO profile_showcase (user_id, media_type, list_id, display_order)
SELECT uli.user_id, 'tv', 'favorites', 1
FROM (SELECT DISTINCT user_id FROM tv_list_items WHERE list_type = 'favorites') uli
WHERE NOT EXISTS (
    SELECT 1 FROM profile_showcase ps
    WHERE ps.user_id = uli.user_id AND ps.media_type = 'tv' AND ps.list_id = 'favorites'
)
ON CONFLICT (user_id, media_type, list_id) DO NOTHING;

INSERT INTO profile_showcase (user_id, media_type, list_id, display_order)
SELECT uli.user_id, 'anime', 'favorites', 2
FROM (SELECT DISTINCT user_id FROM anime_list_items WHERE list_type = 'favorites') uli
WHERE NOT EXISTS (
    SELECT 1 FROM profile_showcase ps
    WHERE ps.user_id = uli.user_id AND ps.media_type = 'anime' AND ps.list_id = 'favorites'
)
ON CONFLICT (user_id, media_type, list_id) DO NOTHING;

INSERT INTO profile_showcase (user_id, media_type, list_id, display_order)
SELECT uli.user_id, 'game', 'favorites', 3
FROM (SELECT DISTINCT user_id FROM game_list_items WHERE list_type = 'favorites') uli
WHERE NOT EXISTS (
    SELECT 1 FROM profile_showcase ps
    WHERE ps.user_id = uli.user_id AND ps.media_type = 'game' AND ps.list_id = 'favorites'
)
ON CONFLICT (user_id, media_type, list_id) DO NOTHING;

INSERT INTO profile_showcase (user_id, media_type, list_id, display_order)
SELECT uli.user_id, 'book', 'favorites', 4
FROM (SELECT DISTINCT user_id FROM book_list_items WHERE list_type = 'favorites') uli
WHERE NOT EXISTS (
    SELECT 1 FROM profile_showcase ps
    WHERE ps.user_id = uli.user_id AND ps.media_type = 'book' AND ps.list_id = 'favorites'
)
ON CONFLICT (user_id, media_type, list_id) DO NOTHING;

INSERT INTO profile_showcase (user_id, media_type, list_id, display_order)
SELECT uli.user_id, 'music', 'favorites', 5
FROM (SELECT DISTINCT user_id FROM music_list_items WHERE list_type = 'favorites') uli
WHERE NOT EXISTS (
    SELECT 1 FROM profile_showcase ps
    WHERE ps.user_id = uli.user_id AND ps.media_type = 'music' AND ps.list_id = 'favorites'
)
ON CONFLICT (user_id, media_type, list_id) DO NOTHING;

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_showcase_user ON profile_showcase(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_showcase_user_type ON profile_showcase(user_id, media_type);
CREATE INDEX IF NOT EXISTS idx_list_items_display_order ON movie_list_items(user_id, list_type, display_order);
CREATE INDEX IF NOT EXISTS idx_tv_list_items_display_order ON tv_list_items(user_id, list_type, display_order);
CREATE INDEX IF NOT EXISTS idx_anime_list_items_display_order ON anime_list_items(user_id, list_type, display_order);
CREATE INDEX IF NOT EXISTS idx_game_list_items_display_order ON game_list_items(user_id, list_type, display_order);
