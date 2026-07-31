-- ============================================================
-- Migration: Add avatar_url column to user_profiles
-- Allows users to set a custom profile image URL alongside default icon
-- ============================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
