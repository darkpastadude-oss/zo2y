-- ============================================================================
-- BRAND NEW DEFAULT-ONLY LISTS ARCHITECTURE
-- Run this to completely reset your lists backend.
-- ============================================================================

-- 1. Drop existing objects completely
drop function if exists public.toggle_list_item(uuid, text, text, text, text, jsonb) cascade;
drop function if exists public.get_item_list_status(uuid, text, text) cascade;
drop function if exists public.zo2y_get_accessible_custom_lists(text) cascade;
drop function if exists public.zo2y_delete_custom_list(uuid, text, text) cascade;

drop table if exists public.list_items cascade;
drop table if exists public.list_collaborators cascade;
drop table if exists public.user_lists cascade;

-- 2. Drop and recreate ENUMs (No 'custom' type)
do $$ begin
  drop type if exists public.user_list_type cascade;
exception
  when dependent_objects_still_exist then null;
end $$;

create type public.user_list_type as enum (
  'favorites', 'watchlist', 'completed'
);

do $$ begin
  create type public.user_list_category as enum (
    'movie', 'tv', 'anime', 'game', 'book', 'music', 'sport', 'travel', 'fashion', 'food', 'car'
  );
exception
  when duplicate_object then null;
end $$;

-- 3. Create fresh schema
create table public.user_lists (
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
  unique(user_id, category, type) -- A user can only have one list per default type per category
);

alter table public.user_lists enable row level security;
create policy "Users can view their own lists" on public.user_lists for select using (auth.uid() = user_id);
create policy "Users can insert their own lists" on public.user_lists for insert with check (auth.uid() = user_id);
create policy "Users can update their own lists" on public.user_lists for update using (auth.uid() = user_id);
create policy "Users can delete their own lists" on public.user_lists for delete using (auth.uid() = user_id);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.user_lists(id) on delete cascade,
  external_id text not null,
  external_source text not null default 'local_db',
  external_type public.user_list_category not null,
  metadata jsonb not null default '{}'::jsonb,
  added_at timestamptz not null default now(),
  unique(list_id, external_id)
);

alter table public.list_items enable row level security;

-- Policy to view items in lists you own
create policy "Users can view items in their own lists" 
on public.list_items for select 
using (
  exists (
    select 1 from public.user_lists ul 
    where ul.id = list_items.list_id and ul.user_id = auth.uid()
  )
);

-- Policy to insert items into lists you own
create policy "Users can insert items into their own lists" 
on public.list_items for insert 
with check (
  exists (
    select 1 from public.user_lists ul 
    where ul.id = list_items.list_id and ul.user_id = auth.uid()
  )
);

-- Policy to delete items from lists you own
create policy "Users can delete items from their own lists" 
on public.list_items for delete 
using (
  exists (
    select 1 from public.user_lists ul 
    where ul.id = list_items.list_id and ul.user_id = auth.uid()
  )
);

-- 4. Recreate strict RPC functions
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

  -- Verify auth
  if auth.uid() != p_user_id then
    raise exception 'Unauthorized';
  end if;

  -- Find existing default list
  select id into v_list_id
  from public.user_lists
  where user_id = p_user_id
    and category = v_cat
    and type = v_type
  limit 1;

  -- Create default list if it doesn't exist
  if v_list_id is null then
    insert into public.user_lists (user_id, name, category, type, description)
    values (p_user_id, initcap(p_list_type), v_cat, v_type, 'Auto-generated list')
    returning id into v_list_id;
  end if;

  -- Toggle logic
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
  
  if auth.uid() != p_user_id then
    raise exception 'Unauthorized';
  end if;

  select jsonb_object_agg(ul.type::text, true) into v_result
  from public.list_items li
  join public.user_lists ul on ul.id = li.list_id
  where ul.user_id = p_user_id
    and ul.category = v_cat
    and li.external_id = p_external_id;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;
grant execute on function public.get_item_list_status(uuid, text, text) to authenticated;
