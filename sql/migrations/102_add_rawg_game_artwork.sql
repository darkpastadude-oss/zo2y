-- 102: Add RAWG artwork columns to games table
-- Supports the hybrid game loading architecture:
--   hero_background -> cinematic hero backdrop (RAWG background_image)
--   hero_background_secondary -> alternate backdrop
--   screenshots -> array of screenshot URLs from RAWG
--   last_synced_at -> timestamp of last RAWG artwork sync

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS hero_background text DEFAULT '',
  ADD COLUMN IF NOT EXISTS hero_background_secondary text DEFAULT '',
  ADD COLUMN IF NOT EXISTS screenshots jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_games_last_synced
  ON public.games (last_synced_at)
  WHERE last_synced_at IS NOT NULL;
