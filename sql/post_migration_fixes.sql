-- ============================================================================
-- POST-MIGRATION FIXES
-- Run this AFTER unified_lists_migration.sql
-- ============================================================================

begin;

-- ============================================================================
-- FIX 1: Update zo2y_get_accessible_custom_lists to query user_lists
-- ============================================================================

create or replace function public.zo2y_get_accessible_custom_lists(p_media_type text)
returns table (
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
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_media_type text := lower(trim(coalesce(p_media_type, '')));
  cat_map text;
begin
  if auth.uid() is null then
    return;
  end if;

  cat_map := case safe_media_type
    when 'movie' then 'movie'
    when 'anime' then 'anime'
    when 'tv' then 'tv'
    when 'game' then 'game'
    when 'book' then 'book'
    when 'music' then 'music'
    when 'sports' then 'sport'
    when 'travel' then 'travel'
    when 'fashion' then 'fashion'
    when 'food' then 'food'
    when 'car' then 'car'
    else null
  end;

  if cat_map is null then
    return;
  end if;

  if to_regclass('public.user_lists') is null then
    return;
  end if;

  return query
    with own_lists as (
      select
        l.id::text as id,
        l.user_id,
        l.name as title,
        l.description,
        l.icon,
        l.created_at,
        l.updated_at,
        false as is_collaborative,
        true as can_edit,
        l.user_id as list_owner_id
      from public.user_lists l
      where l.user_id = auth.uid()
        and l.category = cat_map::public.user_list_category
    ),
    shared_lists as (
      select
        l.id::text as id,
        l.user_id,
        l.name as title,
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
        and l.category = cat_map::public.user_list_category
    )
    select * from own_lists
    union all
    select * from shared_lists
    order by created_at desc nulls last;
end;
$$;

grant execute on function public.zo2y_get_accessible_custom_lists(text) to authenticated;

-- ============================================================================
-- FIX 2: Remove duplicate custom lists that shadow default lists
-- ============================================================================

do $$
declare
  v_rec record;
  v_default_id uuid;
  v_item_count int;
  v_total_deleted int := 0;
  v_total_moved int := 0;
begin
  for v_rec in
    select ul.id as custom_id, ul.user_id, ul.category, ul.name, dl.id as default_id
    from public.user_lists ul
    join public.user_lists dl on dl.user_id = ul.user_id
      and dl.category = ul.category
      and dl.type != 'custom'
      and dl.name = ul.name
    where ul.type = 'custom'
  loop
    select count(*) into v_item_count
    from public.list_items
    where list_id = v_rec.custom_id;

    if v_item_count > 0 then
      insert into public.list_items (list_id, external_id, external_source, external_type, added_at)
      select v_rec.default_id, li.external_id, li.external_source, li.external_type, li.added_at
      from public.list_items li
      where li.list_id = v_rec.custom_id
      on conflict (list_id, external_id) do nothing;

      get diagnostics v_item_count = row_count;
      v_total_moved := v_total_moved + v_item_count;
    end if;

    delete from public.list_items where list_id = v_rec.custom_id;
    delete from public.user_lists where id = v_rec.custom_id;
    v_total_deleted := v_total_deleted + 1;
  end loop;

  raise notice 'Cleanup complete: % duplicate custom lists deleted, % items moved to defaults', v_total_deleted, v_total_moved;
end;
$$;

commit;
