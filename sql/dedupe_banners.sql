-- =========================================================
-- DEDUPLICATE BANNER ROWS IN PROFILE_SHOWCASE
-- Keeps only the single most recent row per user for media_type = 'banner'
-- and deletes all older duplicate rows.
-- =========================================================

-- 1. Delete all older duplicate banner rows per user, keeping the latest created_at row
DELETE FROM profile_showcase
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, media_type 
             ORDER BY created_at DESC
           ) as rn
    FROM profile_showcase
    WHERE media_type = 'banner'
  ) sub
  WHERE rn > 1
);

-- 2. Verify remaining banner rows (should be 1 row per user)
SELECT id, user_id, media_type, list_id, created_at
FROM profile_showcase
WHERE media_type = 'banner'
ORDER BY user_id, created_at DESC;
