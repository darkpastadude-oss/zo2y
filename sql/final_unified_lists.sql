-- ============================================================================
-- FINAL UNIFIED LISTS: SCHEMA UNIFICATION
--
-- This script unifies the database architecture while preserving the 
-- total independence of every list (watched, played, backlog, wishlist, etc).
--
-- 1. Alters 'type' column to TEXT (removing restrictive enum).
-- 2. Keeps category enum (movie, game, etc.) for scope.
-- 3. Updates RPCs to be category/type-pair aware, ensuring list independence.
-- ============================================================================

begin;

-- 1. Remove restrictive type enum
alter table public.user_lists alter column type type text;
drop type if exists public.user_list_type;

-- 2. Ensure unique identity for every list (user + category + type)
drop index if exists user_lists_identity_idx;
create unique index if not exists user_lists_identity_idx on public.user_lists(user_id, category, type);

-- 3. Optimized Toggle RPC
-- No longer casts list_type to enum, uses direct match in unified table.
create or replace function public.toggle_list_item(
  p_user_id uuid,
  p_category text,
  p_list_type text,
  p_external_id text,
  p_external_source text default 'local_db',
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list_id uuid;
  v_exists boolean;
  v_cat public.user_list_category;
begin
  -- Category MUST be valid enum (scope), but type is FREE text
  v_cat := p_category::public.user_list_category;

  -- Locate list exactly by category + type
  select id into v_list_id
  from public.user_lists
  where user_id = p_user_id
    and category = v_cat
    and type = p_list_type
  limit 1;

  if v_list_id is null then
    raise exception 'List not found for category % type %', p_category, p_list_type;
  end if;

  select exists(
    select 1 from public.list_items
    where list_id = v_list_id and external_id = p_external_id
  ) into v_exists;

  if v_exists then
    delete from public.list_items
    where list_id = v_list_id and external_id = p_external_id;
    return jsonb_build_object('action', 'removed', 'list_id', v_list_id);
  else
    insert into public.list_items (list_id, external_id, external_source, external_type, metadata)
    values (v_list_id, p_external_id, p_external_source, v_cat, coalesce(p_metadata, '{}'::jsonb))
    on conflict (list_id, external_id) do nothing;
    return jsonb_build_object('action', 'added', 'list_id', v_list_id);
  end if;
end;
$$;

-- 4. Unified List Retrieval
create or replace function public.get_list_status(
  p_user_id uuid,
  p_category text,
  p_external_id text
) returns table (list_id uuid, list_type text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select li.list_id, l.type
  from public.list_items li
  join public.user_lists l on l.id = li.list_id
  where l.user_id = p_user_id
    and l.category = p_category::public.user_list_category
    and li.external_id = p_external_id;
end;
$$;

-- 5. Final Legacy Cleanup (Only drop these once you confirm counts match)
-- drop table if exists public.movie_list_items cascade;
-- drop table if exists public.movie_lists cascade;
-- ... [All other legacy tables]

notify pgrst, 'reload schema';

commit;
