-- ==========================================================================
-- CLEAN LIST SYSTEM — Single source of truth
-- Tables: user_lists, list_items
-- Three default lists per media category + unlimited custom lists
-- ==========================================================================

-- Clean slate: drop old functions first (return type conflicts)
DROP FUNCTION IF EXISTS create_default_user_lists(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_default_user_lists(UUID) CASCADE;
DROP FUNCTION IF EXISTS toggle_list_item(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS get_user_lists(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_list_items(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_item_list_status(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_all_user_items(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS add_item_to_list(UUID, UUID, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS remove_item_from_list(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_list_status(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS ensure_user_default_lists(UUID) CASCADE;
DROP FUNCTION IF EXISTS zo2y_get_accessible_custom_lists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS _default_list_name(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS _default_list_icon(TEXT) CASCADE;
DROP FUNCTION IF EXISTS _default_list_icon(TEXT, TEXT) CASCADE;

-- Clean slate: drop old tables
DROP TABLE IF EXISTS list_tier_ranks CASCADE;
DROP TABLE IF EXISTS list_tier_meta CASCADE;
DROP TABLE IF EXISTS list_collaborators CASCADE;
DROP TABLE IF EXISTS list_items CASCADE;
DROP TABLE IF EXISTS user_lists CASCADE;

-- ==========================================================================
-- TABLES
-- ==========================================================================

CREATE TABLE user_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,       -- movie|tv|anime|game|book|music|fashion|food|travel|car|sport
  type TEXT NOT NULL DEFAULT 'custom', -- favorites|completed|watchlist|custom
  icon TEXT DEFAULT 'fas fa-list',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One default list per (user, category, type)
CREATE UNIQUE INDEX user_lists_default_idx
  ON user_lists (user_id, category, type) WHERE type != 'custom';

CREATE INDEX user_lists_user_idx ON user_lists (user_id);
CREATE INDEX user_lists_category_idx ON user_lists (user_id, category);

CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  external_source TEXT NOT NULL DEFAULT 'local_db',
  metadata JSONB DEFAULT '{}',
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, external_id)
);

CREATE INDEX list_items_list_idx ON list_items (list_id);

-- ==========================================================================
-- ROW LEVEL SECURITY
-- ==========================================================================

ALTER TABLE user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- user_lists
CREATE POLICY "select_own_lists" ON user_lists FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "insert_own_lists" ON user_lists FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_lists" ON user_lists FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete_own_lists" ON user_lists FOR DELETE
  USING (user_id = auth.uid());

-- list_items (ownership via join to user_lists)
CREATE POLICY "select_own_items" ON list_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_lists WHERE id = list_items.list_id AND user_id = auth.uid())
);
CREATE POLICY "insert_own_items" ON list_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_lists WHERE id = list_items.list_id AND user_id = auth.uid())
);
CREATE POLICY "update_own_items" ON list_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_lists WHERE id = list_items.list_id AND user_id = auth.uid())
);
CREATE POLICY "delete_own_items" ON list_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_lists WHERE id = list_items.list_id AND user_id = auth.uid())
);

-- ==========================================================================
-- HELPER: default list name per category
-- ==========================================================================

CREATE OR REPLACE FUNCTION _default_list_name(p_category TEXT, p_type TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_type = 'favorites' THEN RETURN 'Favorites'; END IF;

  RETURN CASE
    WHEN p_category IN ('movie','tv','anime') AND p_type = 'completed' THEN 'Watched'
    WHEN p_category IN ('movie','tv','anime') AND p_type = 'watchlist' THEN 'Watchlist'
    WHEN p_category = 'game' AND p_type = 'completed' THEN 'Played'
    WHEN p_category = 'game' AND p_type = 'watchlist' THEN 'Backlog'
    WHEN p_category = 'book' AND p_type = 'completed' THEN 'Read'
    WHEN p_category = 'book' AND p_type = 'watchlist' THEN 'Reading List'
    WHEN p_category = 'music' AND p_type = 'completed' THEN 'Listened'
    WHEN p_category = 'music' AND p_type = 'watchlist' THEN 'Listen Later'
    WHEN p_category = 'food' AND p_type = 'completed' THEN 'Tried'
    WHEN p_category = 'food' AND p_type = 'watchlist' THEN 'Go List'
    WHEN p_category = 'travel' AND p_type = 'completed' THEN 'Visited'
    WHEN p_category = 'travel' AND p_type = 'watchlist' THEN 'Bucket List'
    WHEN p_category IN ('car','fashion') AND p_type = 'completed' THEN 'Owned'
    WHEN p_category IN ('car','fashion') AND p_type = 'watchlist' THEN 'Wishlist'
    WHEN p_category = 'sport' AND p_type = 'completed' THEN 'Following'
    WHEN p_category = 'sport' AND p_type = 'watchlist' THEN 'Watchlist'
    ELSE initcap(p_type)
  END;
END;
$$;

CREATE OR REPLACE FUNCTION _default_list_icon(p_type TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN CASE
    WHEN p_type = 'favorites' THEN 'fas fa-heart'
    WHEN p_type = 'completed' THEN 'fas fa-check-circle'
    WHEN p_type = 'watchlist' THEN 'fas fa-clock'
    ELSE 'fas fa-list'
  END;
END;
$$;

-- ==========================================================================
-- RPC 1: create_default_user_lists
-- Creates the 3 default lists for a user + category (idempotent)
-- ==========================================================================

CREATE OR REPLACE FUNCTION create_default_user_lists(p_user_id UUID, p_category TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['favorites','completed','watchlist'] LOOP
    INSERT INTO user_lists (user_id, category, type, name, icon)
    VALUES (p_user_id, p_category, t, _default_list_name(p_category, t), _default_list_icon(t))
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- ==========================================================================
-- RPC 2: toggle_list_item
-- Add or remove an item from a default list. Auto-creates defaults if missing.
-- ==========================================================================

CREATE OR REPLACE FUNCTION toggle_list_item(
  p_user_id UUID,
  p_category TEXT,
  p_list_type TEXT,
  p_external_id TEXT,
  p_external_source TEXT DEFAULT 'local_db',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_list_id UUID;
  v_item_id UUID;
BEGIN
  PERFORM create_default_user_lists(p_user_id, p_category);

  SELECT id INTO v_list_id FROM user_lists
  WHERE user_id = p_user_id AND category = p_category AND type = p_list_type;

  IF v_list_id IS NULL THEN
    RETURN jsonb_build_object('action', 'error', 'message', 'List not found');
  END IF;

  SELECT id INTO v_item_id FROM list_items
  WHERE list_id = v_list_id AND external_id = p_external_id;

  IF v_item_id IS NOT NULL THEN
    DELETE FROM list_items WHERE id = v_item_id;
    RETURN jsonb_build_object('action', 'removed', 'list_id', v_list_id);
  ELSE
    INSERT INTO list_items (list_id, media_type, external_id, external_source, metadata)
    VALUES (v_list_id, p_category, p_external_id, p_external_source, p_metadata);
    RETURN jsonb_build_object('action', 'added', 'list_id', v_list_id);
  END IF;
END;
$$;

-- ==========================================================================
-- RPC 3: get_user_lists
-- Returns all lists (default + custom) for a user in a category, with counts
-- ==========================================================================

CREATE OR REPLACE FUNCTION get_user_lists(p_user_id UUID, p_category TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(r) ORDER BY
      CASE r.type
        WHEN 'favorites' THEN 0
        WHEN 'completed' THEN 1
        WHEN 'watchlist' THEN 2
        ELSE 3
      END,
      r.created_at
    )
    FROM (
      SELECT ul.id, ul.name, ul.category, ul.type, ul.icon, ul.description,
             ul.created_at, ul.updated_at,
             (SELECT count(*) FROM list_items WHERE list_id = ul.id) AS item_count
      FROM user_lists ul
      WHERE ul.user_id = p_user_id AND ul.category = p_category
    ) r
  ), '[]'::jsonb);
END;
$$;

-- ==========================================================================
-- RPC 4: get_list_items
-- Returns all items in a specific list (verifies ownership)
-- ==========================================================================

CREATE OR REPLACE FUNCTION get_list_items(p_list_id UUID, p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_lists WHERE id = p_list_id AND user_id = p_user_id) THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(li) ORDER BY li.added_at DESC)
    FROM list_items li WHERE li.list_id = p_list_id
  ), '[]'::jsonb);
END;
$$;

-- ==========================================================================
-- RPC 5: get_item_list_status
-- Returns which default + custom lists contain a specific item
-- ==========================================================================

CREATE OR REPLACE FUNCTION get_item_list_status(p_user_id UUID, p_category TEXT, p_external_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  v_result JSONB;
  v_custom JSONB;
BEGIN
  SELECT jsonb_build_object(
    'favorites', COALESCE(bool_or(ul.type = 'favorites' AND li.id IS NOT NULL), false),
    'completed', COALESCE(bool_or(ul.type = 'completed' AND li.id IS NOT NULL), false),
    'watchlist', COALESCE(bool_or(ul.type = 'watchlist' AND li.id IS NOT NULL), false)
  ) INTO v_result
  FROM user_lists ul
  LEFT JOIN list_items li ON li.list_id = ul.id AND li.external_id = p_external_id
  WHERE ul.user_id = p_user_id AND ul.category = p_category AND ul.type != 'custom';

  IF v_result IS NULL THEN
    v_result := '{"favorites":false,"completed":false,"watchlist":false}'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ul.id, 'name', ul.name)), '[]'::jsonb)
  INTO v_custom
  FROM user_lists ul
  INNER JOIN list_items li ON li.list_id = ul.id AND li.external_id = p_external_id
  WHERE ul.user_id = p_user_id AND ul.category = p_category AND ul.type = 'custom';

  RETURN v_result || jsonb_build_object('custom_lists', v_custom);
END;
$$;

-- ==========================================================================
-- RPC 6: get_all_user_items
-- Returns all items across all lists for a user + category (profile page)
-- ==========================================================================

CREATE OR REPLACE FUNCTION get_all_user_items(p_user_id UUID, p_category TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'list_id', ul.id,
      'list_name', ul.name,
      'list_type', ul.type,
      'list_icon', ul.icon,
      'item_id', li.id,
      'external_id', li.external_id,
      'external_source', li.external_source,
      'metadata', li.metadata,
      'added_at', li.added_at
    ) ORDER BY ul.type, li.added_at DESC)
    FROM user_lists ul
    INNER JOIN list_items li ON li.list_id = ul.id
    WHERE ul.user_id = p_user_id AND ul.category = p_category
  ), '[]'::jsonb);
END;
$$;

-- ==========================================================================
-- RPC 7: add_item_to_list
-- Add an item to any list (custom or default)
-- ==========================================================================

CREATE OR REPLACE FUNCTION add_item_to_list(
  p_list_id UUID,
  p_user_id UUID,
  p_external_id TEXT,
  p_external_source TEXT DEFAULT 'local_db',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_lists WHERE id = p_list_id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'List not found or not owned');
  END IF;

  INSERT INTO list_items (list_id, media_type, external_id, external_source, metadata)
  SELECT p_list_id, ul.category, p_external_id, p_external_source, p_metadata
  FROM user_lists ul WHERE ul.id = p_list_id
  ON CONFLICT (list_id, external_id) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ==========================================================================
-- RPC 8: remove_item_from_list
-- Remove an item from any list
-- ==========================================================================

CREATE OR REPLACE FUNCTION remove_item_from_list(
  p_list_id UUID,
  p_user_id UUID,
  p_external_id TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_lists WHERE id = p_list_id AND user_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'List not found or not owned');
  END IF;

  DELETE FROM list_items WHERE list_id = p_list_id AND external_id = p_external_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
