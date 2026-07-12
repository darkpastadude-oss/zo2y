-- ============================================================
-- Seed brand images — CORRECTED VERSION
-- Pexels stock photos are for BACKGROUNDS only (brand-backgrounds.json)
-- logo_url uses: Clearbit (24 brands), Wikimedia Commons (66 fashion),
-- or NULL (falls back to /api/logo Wikipedia/Wikidata resolution)
-- ============================================================

-- This file intentionally left minimal.
-- Run sql/revert_logo_urls.sql FIRST to restore original logos.
-- Car brands have no seed data — they rely on /api/logo fallback.
