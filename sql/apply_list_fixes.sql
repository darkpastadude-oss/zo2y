-- ============================================================================
-- FIX: zo2y_get_accessible_custom_lists returning default lists as custom
-- This ensures we only return custom lists in the custom list modal
-- ============================================================================

CREATE OR REPLACE FUNCTION public.zo2y_get_accessible_custom_lists(p_media_type text)
RETURNS TABLE (
  id text,
  user_id uuid,
  title text,
  description text,
  icon text,
  created_at timestamptz,
  updated_at timestamptz,
  is_collaborative boolean,
  can_edit boolean,
  list_owner_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_media_type text := lower(trim(coalesce(p_media_type, '')));
  cat_map text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  cat_map := CASE safe_media_type
    WHEN 'movie' THEN 'movie'
    WHEN 'anime' THEN 'anime'
    WHEN 'tv' THEN 'tv'
    WHEN 'game' THEN 'game'
    WHEN 'book' THEN 'book'
    WHEN 'music' THEN 'music'
    WHEN 'sports' THEN 'sport'
    WHEN 'travel' THEN 'travel'
    WHEN 'fashion' THEN 'fashion'
    WHEN 'food' THEN 'food'
    WHEN 'car' THEN 'car'
    ELSE NULL
  END;

  IF cat_map IS NULL THEN
    RETURN;
  END IF;

  IF to_regclass('public.user_lists') IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
    WITH own_lists AS (
      SELECT
        l.id::text AS id,
        l.user_id,
        l.name AS title,
        l.description,
        l.icon,
        l.created_at,
        l.updated_at,
        false AS is_collaborative,
        true AS can_edit,
        l.user_id AS list_owner_id
      FROM public.user_lists l
      WHERE l.user_id = auth.uid()
        AND l.category = cat_map::public.user_list_category
        AND l.type = 'custom' -- CRITICAL FIX: Only return custom lists
    ),
    shared_lists AS (
      SELECT
        l.id::text AS id,
        l.user_id,
        l.name AS title,
        l.description,
        l.icon,
        l.created_at,
        l.updated_at,
        true AS is_collaborative,
        coalesce(lc.can_edit, false) AS can_edit,
        lc.list_owner_id
      FROM public.user_lists l
      JOIN public.list_collaborators lc
        ON lc.media_type = safe_media_type
       AND lc.list_id = l.id::text
      WHERE lc.collaborator_id = auth.uid()
        AND l.category = cat_map::public.user_list_category
        AND l.type = 'custom' -- CRITICAL FIX: Only return custom lists
    )
    SELECT * FROM own_lists
    UNION ALL
    SELECT * FROM shared_lists
    ORDER BY created_at DESC NULLS LAST;
END;
$$;
GRANT EXECUTE ON FUNCTION public.zo2y_get_accessible_custom_lists(text) TO authenticated;
