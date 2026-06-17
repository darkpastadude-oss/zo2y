begin;

-- 1. Create Enums if they don't exist
do $$ begin
  create type public.user_list_category as enum (
    'movie', 'tv', 'book', 'anime', 'game', 'sport', 'car',
    'food', 'fashion', 'travel', 'music'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_list_type as enum (
    'favorites', 'watchlist', 'completed', 'custom'
  );
exception
  when duplicate_object then null;
end $$;

-- 2. Drop the overly complex broken tables if they exist
drop table if exists public.user_default_lists cascade;

-- 3. Create unified user_lists
create table if not exists public.user_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category public.user_list_category not null,
  type public.user_list_type not null,
  icon text,
  description text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, category, name)
);

-- 4. Create unified list_items
create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.user_lists(id) on delete cascade,
  external_id text not null,
  external_source text not null default 'local_db',
  external_type public.user_list_category not null,
  metadata jsonb not null default '{}'::jsonb,
  added_at timestamptz not null default now(),
  unique(list_id, external_id)
);

-- 5. RPC Functions

drop function if exists public.toggle_list_item;
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
  v_type public.user_list_type;
begin
  v_cat := p_category::public.user_list_category;
  v_type := p_list_type::public.user_list_type;

  if v_type = 'custom' then
    raise exception 'toggle_list_item does not support custom lists' using errcode = 'P0001';
  end if;

  -- Ensure the default list exists
  select id into v_list_id
  from public.user_lists
  where user_id = p_user_id
    and category = v_cat
    and type = v_type
  limit 1;

  if v_list_id is null then
    -- Create it on the fly
    insert into public.user_lists (user_id, name, category, type, description)
    values (p_user_id, initcap(p_list_type), v_cat, v_type, 'Auto-generated list')
    returning id into v_list_id;
  end if;

  -- Check if item exists
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
grant execute on function public.toggle_list_item(uuid, text, text, text, text, jsonb) to authenticated;

drop function if exists public.get_item_list_status(uuid, text, text);
create or replace function public.get_item_list_status(
  p_user_id uuid,
  p_category text,
  p_external_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_cat public.user_list_category;
begin
  v_cat := p_category::public.user_list_category;

  select jsonb_object_agg(ul.type::text, true)
  into v_result
  from public.list_items li
  join public.user_lists ul on ul.id = li.list_id
  where ul.user_id = p_user_id
    and ul.category = v_cat
    and li.external_id = p_external_id;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;
grant execute on function public.get_item_list_status(uuid, text, text) to authenticated;

commit;
