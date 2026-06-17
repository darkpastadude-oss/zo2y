-- ============================================================
-- RPC FUNCTIONS FOR NEW UNIFIED SCHEMA
-- ============================================================

BEGIN;

-- 1. Create Default User Lists Function
CREATE OR REPLACE FUNCTION public.create_default_user_lists(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_categories text[] := array[
    'movie', 'tv', 'book', 'anime', 'game', 'travel', 'music', 'fashion', 'food', 'car', 'restaurant'
  ];
  v_cat text;
  v_icon text;
  v_title text;
  v_list_id uuid;
  v_list_type text;
BEGIN
  foreach v_cat in array v_categories
  loop
    -- --- 1. FAVORITES ---
    v_title := 'Favorites';
    v_icon := 'fas fa-heart';
    
    select id into v_list_id 
    from public.user_default_lists 
    where user_id = p_user_id and media_type = v_cat and list_type = 'favorites' 
    limit 1;

    if v_list_id is null then
      v_list_id := gen_random_uuid();
      insert into public.user_lists (id, user_id, title, media_type, icon)
      values (v_list_id, p_user_id, v_title, v_cat, v_icon);

      insert into public.user_default_lists (id, user_id, media_type, list_type, title, icon)
      values (v_list_id, p_user_id, v_cat, 'favorites', v_title, v_icon);
    end if;

    -- --- 2. WATCHLIST (or equivalent) ---
    v_title := case v_cat
      when 'book' then 'Reading List'
      when 'game' then 'Backlog'
      when 'music' then 'Listen Later'
      when 'travel' then 'Bucket List'
      when 'fashion' then 'Wishlist'
      when 'food' then 'Want to Try'
      when 'car' then 'Wishlist'
      when 'restaurant' then 'Want to Go'
      else 'Watchlist'
    end;
    
    v_icon := case v_cat
      when 'game' then 'fas fa-clock'
      when 'music' then 'fas fa-clock'
      when 'travel' then 'fas fa-map-marker-alt'
      when 'fashion' then 'fas fa-cart-plus'
      when 'food' then 'fas fa-utensils'
      when 'car' then 'fas fa-cart-plus'
      else 'fas fa-bookmark'
    end;
    
    v_list_type := case v_cat
      when 'travel' then 'bucketlist'
      when 'food' then 'want_to_try'
      when 'restaurant' then 'want_to_try'
      when 'fashion' then 'wishlist'
      when 'car' then 'wishlist'
      else 'watchlist'
    end;

    select id into v_list_id 
    from public.user_default_lists 
    where user_id = p_user_id and media_type = v_cat and list_type = v_list_type 
    limit 1;

    if v_list_id is null then
      v_list_id := gen_random_uuid();
      insert into public.user_lists (id, user_id, title, media_type, icon)
      values (v_list_id, p_user_id, v_title, v_cat, v_icon);

      insert into public.user_default_lists (id, user_id, media_type, list_type, title, icon)
      values (v_list_id, p_user_id, v_cat, v_list_type, v_title, v_icon);
    end if;

    -- --- 3. WATCHED (or equivalent) ---
    v_title := case v_cat
      when 'book' then 'Read'
      when 'game' then 'Played'
      when 'music' then 'Listened'
      when 'travel' then 'Visited'
      when 'fashion' then 'Owned'
      when 'food' then 'Tried'
      when 'car' then 'Owned'
      when 'restaurant' then 'Visited'
      else 'Watched'
    end;
    
    v_icon := case v_cat
      when 'book' then 'fas fa-check'
      when 'game' then 'fas fa-check'
      when 'music' then 'fas fa-headphones'
      when 'travel' then 'fas fa-check'
      when 'fashion' then 'fas fa-check'
      when 'food' then 'fas fa-check'
      when 'car' then 'fas fa-check'
      else 'fas fa-eye'
    end;

    v_list_type := case v_cat
      when 'travel' then 'visited'
      when 'restaurant' then 'visited'
      when 'food' then 'tried'
      when 'fashion' then 'owned'
      when 'car' then 'owned'
      else 'watched'
    end;

    select id into v_list_id 
    from public.user_default_lists 
    where user_id = p_user_id and media_type = v_cat and list_type = v_list_type 
    limit 1;

    if v_list_id is null then
      v_list_id := gen_random_uuid();
      insert into public.user_lists (id, user_id, title, media_type, icon)
      values (v_list_id, p_user_id, v_title, v_cat, v_icon);

      insert into public.user_default_lists (id, user_id, media_type, list_type, title, icon)
      values (v_list_id, p_user_id, v_cat, v_list_type, v_title, v_icon);
    end if;
  end loop;
END;
$$;

-- 2. Accessible Custom Lists RPC
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
BEGIN
  if auth.uid() is null then
    return;
  end if;

  return query
  with own_lists as (
    select
      l.id::text as id,
      l.user_id,
      l.title as title,
      l.description,
      l.icon,
      l.created_at,
      l.updated_at,
      false as is_collaborative,
      true as can_edit,
      l.user_id as list_owner_id
    from public.user_lists l
    where l.user_id = auth.uid()
      and l.media_type = safe_media_type
  ),
  shared_lists as (
    select
      l.id::text as id,
      l.user_id,
      l.title as title,
      l.description,
      l.icon,
      l.created_at,
      l.updated_at,
      true as is_collaborative,
      coalesce(lc.can_edit, false) as can_edit,
      lc.list_owner_id
    from public.user_lists l
    join public.list_collaborators lc
      on lc.media_type = safe_media_type
     and lc.list_id = l.id::text
    where lc.collaborator_id = auth.uid()
      and l.media_type = safe_media_type
  )
  select * from own_lists
  union all
  select * from shared_lists
  order by created_at desc nulls last;
END;
$$;

-- 3. Get Item List Status RPC
CREATE OR REPLACE FUNCTION public.get_item_list_status(
  p_user_id uuid,
  p_category text,
  p_external_id text
) RETURNS TABLE (
  list_id uuid,
  list_name text,
  list_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  return query
  select 
    l.id as list_id, 
    l.title as list_name,
    coalesce(dl.list_type, 'custom') as list_type
  from public.user_list_items li
  join public.user_lists l on l.id = li.list_id
  left join public.user_default_lists dl on dl.id = l.id
  where l.user_id = p_user_id
    and l.media_type = p_category
    and li.media_id = p_external_id;
END;
$$;

-- 4. Toggle Default List Item RPC
CREATE OR REPLACE FUNCTION public.toggle_list_item(
  p_user_id uuid,
  p_category text,
  p_list_type text,
  p_external_id text,
  p_external_source text default 'local_db',
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_list_id uuid;
  v_exists boolean;
  v_title text;
  v_icon text;
BEGIN
  -- Locate default list
  select id into v_list_id
  from public.user_default_lists
  where user_id = p_user_id
    and media_type = p_category
    and list_type = p_list_type
  limit 1;

  -- Create default list if not found
  if v_list_id is null then
    v_list_id := gen_random_uuid();
    
    v_title := case p_list_type
      when 'favorites' then 'Favorites'
      when 'watchlist' then 
        case p_category
          when 'book' then 'Reading List'
          when 'game' then 'Backlog'
          when 'music' then 'Listen Later'
          when 'travel' then 'Bucket List'
          when 'fashion' then 'Wishlist'
          when 'food' then 'Want to Try'
          when 'car' then 'Wishlist'
          when 'restaurant' then 'Want to Go'
          else 'Watchlist'
        end
      else 
        case p_category
          when 'book' then 'Read'
          when 'game' then 'Played'
          when 'music' then 'Listened'
          when 'travel' then 'Visited'
          when 'fashion' then 'Owned'
          when 'food' then 'Tried'
          when 'car' then 'Owned'
          when 'restaurant' then 'Visited'
          else 'Watched'
        end
    end;

    v_icon := case p_list_type
      when 'favorites' then 'fas fa-heart'
      when 'watchlist' then
        case p_category
          when 'game' then 'fas fa-clock'
          when 'music' then 'fas fa-clock'
          when 'travel' then 'fas fa-map-marker-alt'
          when 'fashion' then 'fas fa-cart-plus'
          when 'food' then 'fas fa-utensils'
          when 'car' then 'fas fa-cart-plus'
          else 'fas fa-bookmark'
        end
      else
        case p_category
          when 'book' then 'fas fa-check'
          when 'game' then 'fas fa-check'
          when 'music' then 'fas fa-headphones'
          when 'travel' then 'fas fa-check'
          when 'fashion' then 'fas fa-check'
          when 'food' then 'fas fa-check'
          when 'car' then 'fas fa-check'
          else 'fas fa-eye'
        end
    end;

    -- Insert into user_lists
    insert into public.user_lists (id, user_id, title, media_type, icon)
    values (v_list_id, p_user_id, v_title, p_category, v_icon);

    -- Insert into user_default_lists
    insert into public.user_default_lists (id, user_id, media_type, list_type, title, icon)
    values (v_list_id, p_user_id, p_category, p_list_type, v_title, v_icon);
  end if;

  -- Toggle list item membership
  select exists(
    select 1 from public.user_list_items
    where list_id = v_list_id and media_id = p_external_id
  ) into v_exists;

  if v_exists then
    delete from public.user_list_items
    where list_id = v_list_id and media_id = p_external_id;
    return jsonb_build_object('action', 'removed', 'list_id', v_list_id);
  else
    insert into public.user_list_items (user_id, list_id, media_type, media_id, title, poster_url, metadata)
    values (
      p_user_id,
      v_list_id,
      p_category,
      p_external_id,
      coalesce(p_metadata->>'title', p_metadata->>'name', 'Untitled'),
      p_metadata->>'poster_url',
      coalesce(p_metadata, '{}'::jsonb)
    );
    return jsonb_build_object('action', 'added', 'list_id', v_list_id);
  end if;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_default_user_lists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zo2y_get_accessible_custom_lists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_item_list_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_list_item(uuid, text, text, text, text, jsonb) TO authenticated;

COMMIT;
