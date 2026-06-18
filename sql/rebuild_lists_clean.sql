-- ============================================================================
-- CLEAN REBUILD: Unified User Lists
-- Run this in Supabase SQL Editor to completely reset the list system.
-- ============================================================================

begin;

-- Drop existing RPC functions first
drop function if exists public.create_default_user_lists(uuid);
drop function if exists public.toggle_list_item(uuid,text,text,text,text,jsonb);
drop function if exists public.get_item_list_status(uuid,text,text);
drop function if exists public.add_item_to_list(uuid,uuid,text,text,jsonb);
drop function if exists public.remove_item_from_list(uuid,uuid,text);
drop function if exists public.get_user_lists(uuid,text);
drop function if exists public.get_list_items(uuid,uuid);
drop function if exists public.map_old_list_type(text,text);
drop function if exists public.default_external_source(text);
drop function if exists public.migrate_category_lists(text,text,text,text);
drop function if exists public.user_lists_touch_updated_at();
drop function if exists public.log_list_activity_iud_v2();
drop function if exists public.log_custom_list_activity_iud_v2();

-- Drop triggers
drop trigger if exists trg_list_items_add_activity on public.list_items;
drop trigger if exists trg_list_items_remove_activity on public.list_items;
drop trigger if exists trg_user_lists_create_activity on public.user_lists;
drop trigger if exists trg_user_lists_delete_activity on public.user_lists;
drop trigger if exists user_lists_touch_updated_at on public.user_lists;

-- Drop tables (cascade will clean up everything)
drop table if exists public.list_items cascade;
drop table if exists public.user_lists cascade;

-- Drop old per-category tables if they still exist
drop table if exists public.movie_lists cascade;
drop table if exists public.movie_list_items cascade;
drop table if exists public.tv_lists cascade;
drop table if exists public.tv_list_items cascade;
drop table if exists public.tvshow_list_items cascade;
drop table if exists public.anime_lists cascade;
drop table if exists public.anime_list_items cascade;
drop table if exists public.game_lists cascade;
drop table if exists public.game_list_items cascade;
drop table if exists public.book_lists cascade;
drop table if exists public.book_list_items cascade;
drop table if exists public.music_lists cascade;
drop table if exists public.music_list_items cascade;
drop table if exists public.travel_lists cascade;
drop table if exists public.travel_list_items cascade;
drop table if exists public.sports_lists cascade;
drop table if exists public.sports_list_items cascade;
drop table if exists public.fashion_lists cascade;
drop table if exists public.fashion_list_items cascade;
drop table if exists public.food_lists cascade;
drop table if exists public.food_list_items cascade;
drop table if exists public.car_lists cascade;
drop table if exists public.car_list_items cascade;
drop table if exists public.user_favorite_teams cascade;
drop table if exists public.list_collaborators cascade;
drop table if exists public.list_tier_meta cascade;
drop table if exists public.list_tier_ranks cascade;

-- ============================================================================
-- TABLES
-- ============================================================================

create table public.user_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in (
    'movie','tv','anime','game','book','music','travel','sport','fashion','food','car'
  )),
  type text not null check (type in ('favorites','completed','watchlist','custom')),
  icon text default 'fas fa-list',
  description text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, category, name)
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.user_lists(id) on delete cascade,
  external_id text not null,
  external_source text not null default 'local_db',
  metadata jsonb not null default '{}'::jsonb,
  added_at timestamptz not null default now(),
  unique(list_id, external_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index idx_user_lists_user on public.user_lists(user_id);
create index idx_user_lists_user_category on public.user_lists(user_id, category);
create index idx_user_lists_category on public.user_lists(category);
create index idx_list_items_list on public.list_items(list_id);
create index idx_list_items_external on public.list_items(external_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_lists_touch_updated_at
  before update on public.user_lists
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.user_lists enable row level security;
alter table public.list_items enable row level security;

-- User lists: users see/modify only their own
create policy "Users select own lists"
  on public.user_lists for select
  using (user_id = auth.uid());

create policy "Users insert own lists"
  on public.user_lists for insert
  with check (user_id = auth.uid());

create policy "Users update own lists"
  on public.user_lists for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own lists"
  on public.user_lists for delete
  using (user_id = auth.uid());

-- List items: users see/modify items in their own lists
create policy "Users select own list items"
  on public.list_items for select
  using (exists (
    select 1 from public.user_lists
    where user_lists.id = list_items.list_id
      and user_lists.user_id = auth.uid()
  ));

create policy "Users insert own list items"
  on public.list_items for insert
  with check (exists (
    select 1 from public.user_lists
    where user_lists.id = list_items.list_id
      and user_lists.user_id = auth.uid()
  ));

create policy "Users update own list items"
  on public.list_items for update
  using (exists (
    select 1 from public.user_lists
    where user_lists.id = list_items.list_id
      and user_lists.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.user_lists
    where user_lists.id = list_items.list_id
      and user_lists.user_id = auth.uid()
  ));

create policy "Users delete own list items"
  on public.list_items for delete
  using (exists (
    select 1 from public.user_lists
    where user_lists.id = list_items.list_id
      and user_lists.user_id = auth.uid()
  ));

-- ============================================================================
-- RPC: Create default lists for a user in a specific category
-- ============================================================================

create or replace function public.create_default_user_lists(
  p_user_id uuid,
  p_category text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_icon_favorites text := 'fas fa-heart';
  v_icon_completed text;
  v_icon_watchlist text;
  v_name_completed text;
  v_name_watchlist text;
begin
  -- Determine names and icons based on category
  case p_category
    when 'movie' then
      v_name_completed := 'Watched'; v_icon_completed := 'fas fa-eye';
      v_name_watchlist := 'Watchlist'; v_icon_watchlist := 'fas fa-bookmark';
    when 'tv' then
      v_name_completed := 'Watched'; v_icon_completed := 'fas fa-eye';
      v_name_watchlist := 'Watchlist'; v_icon_watchlist := 'fas fa-bookmark';
    when 'anime' then
      v_name_completed := 'Watched'; v_icon_completed := 'fas fa-eye';
      v_name_watchlist := 'Watchlist'; v_icon_watchlist := 'fas fa-bookmark';
    when 'game' then
      v_name_completed := 'Played'; v_icon_completed := 'fas fa-check';
      v_name_watchlist := 'Backlog'; v_icon_watchlist := 'fas fa-clock';
    when 'book' then
      v_name_completed := 'Read'; v_icon_completed := 'fas fa-check';
      v_name_watchlist := 'Reading List'; v_icon_watchlist := 'fas fa-book-open';
    when 'music' then
      v_name_completed := 'Listened'; v_icon_completed := 'fas fa-headphones';
      v_name_watchlist := 'Listen Later'; v_icon_watchlist := 'fas fa-clock';
    when 'travel' then
      v_name_completed := 'Visited'; v_icon_completed := 'fas fa-check';
      v_name_watchlist := 'Bucket List'; v_icon_watchlist := 'fas fa-map-marker-alt';
    when 'sport' then
      v_name_completed := 'Watched'; v_icon_completed := 'fas fa-eye';
      v_name_watchlist := 'Watchlist'; v_icon_watchlist := 'fas fa-bookmark';
    when 'fashion' then
      v_name_completed := 'Owned'; v_icon_completed := 'fas fa-check';
      v_name_watchlist := 'Wishlist'; v_icon_watchlist := 'fas fa-cart-plus';
    when 'food' then
      v_name_completed := 'Tried'; v_icon_completed := 'fas fa-utensils';
      v_name_watchlist := 'Want to Try'; v_icon_watchlist := 'fas fa-utensils';
    when 'car' then
      v_name_completed := 'Owned'; v_icon_completed := 'fas fa-check';
      v_name_watchlist := 'Wishlist'; v_icon_watchlist := 'fas fa-cart-plus';
    else
      v_name_completed := 'Completed'; v_icon_completed := 'fas fa-check';
      v_name_watchlist := 'Watchlist'; v_icon_watchlist := 'fas fa-bookmark';
  end case;

  -- Favorites
  insert into public.user_lists (user_id, name, category, type, icon, sort_order)
  values (p_user_id, 'Favorites', p_category, 'favorites', v_icon_favorites, 0)
  on conflict (user_id, category, name) do nothing;

  -- Completed
  insert into public.user_lists (user_id, name, category, type, icon, sort_order)
  values (p_user_id, v_name_completed, p_category, 'completed', v_icon_completed, 1)
  on conflict (user_id, category, name) do nothing;

  -- Watchlist
  insert into public.user_lists (user_id, name, category, type, icon, sort_order)
  values (p_user_id, v_name_watchlist, p_category, 'watchlist', v_icon_watchlist, 2)
  on conflict (user_id, category, name) do nothing;
end;
$$;

-- ============================================================================
-- RPC: Toggle item in a default list (favorites/completed/watchlist)
-- ============================================================================

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
begin
  if p_list_type = 'custom' then
    raise exception 'toggle_list_item does not support custom lists';
  end if;

  -- Auto-create default lists if they don't exist
  perform public.create_default_user_lists(p_user_id, p_category);

  select id into v_list_id
  from public.user_lists
  where user_id = p_user_id
    and category = p_category
    and type = p_list_type
  limit 1;

  if v_list_id is null then
    raise exception 'Default list not found for category % type %', p_category, p_list_type;
  end if;

  select exists(
    select 1 from public.list_items
    where list_id = v_list_id and external_id = p_external_id
  ) into v_exists;

  if v_exists then
    delete from public.list_items
    where list_id = v_list_id and external_id = p_external_id;
    return jsonb_build_object('action', 'removed');
  else
    insert into public.list_items (list_id, external_id, external_source, metadata)
    values (v_list_id, p_external_id, p_external_source, coalesce(p_metadata, '{}'::jsonb))
    on conflict (list_id, external_id) do nothing;
    return jsonb_build_object('action', 'added');
  end if;
end;
$$;

-- ============================================================================
-- RPC: Get item list status (which lists an item is in)
-- ============================================================================

create or replace function public.get_item_list_status(
  p_user_id uuid,
  p_category text,
  p_external_id text
) returns table (
  list_id uuid,
  list_name text,
  list_type text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select l.id, l.name, l.type
  from public.list_items li
  join public.user_lists l on l.id = li.list_id
  where l.user_id = p_user_id
    and l.category = p_category
    and li.external_id = p_external_id;
end;
$$;

-- ============================================================================
-- RPC: Add item to a custom list
-- ============================================================================

create or replace function public.add_item_to_list(
  p_list_id uuid,
  p_user_id uuid,
  p_external_id text,
  p_external_source text,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list public.user_lists;
begin
  select * into v_list
  from public.user_lists
  where id = p_list_id and user_id = p_user_id;

  if v_list.id is null then
    raise exception 'List not found or access denied';
  end if;

  insert into public.list_items (list_id, external_id, external_source, metadata)
  values (p_list_id, p_external_id, p_external_source, coalesce(p_metadata, '{}'::jsonb))
  on conflict (list_id, external_id) do nothing;

  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================================
-- RPC: Remove item from a custom list
-- ============================================================================

create or replace function public.remove_item_from_list(
  p_list_id uuid,
  p_user_id uuid,
  p_external_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list public.user_lists;
begin
  select * into v_list
  from public.user_lists
  where id = p_list_id and user_id = p_user_id;

  if v_list.id is null then
    raise exception 'List not found or access denied';
  end if;

  delete from public.list_items
  where list_id = p_list_id and external_id = p_external_id;

  return jsonb_build_object('removed', found);
end;
$$;

-- ============================================================================
-- RPC: Get all lists for a user in a category
-- ============================================================================

create or replace function public.get_user_lists(
  p_user_id uuid,
  p_category text
) returns table (
  id uuid,
  name text,
  category text,
  type text,
  icon text,
  description text,
  sort_order int,
  item_count bigint,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    l.id, l.name, l.category, l.type, l.icon, l.description, l.sort_order,
    coalesce((select count(*) from public.list_items li where li.list_id = l.id), 0) as item_count,
    l.created_at, l.updated_at
  from public.user_lists l
  where l.user_id = p_user_id
    and l.category = p_category
  order by l.sort_order, l.created_at;
end;
$$;

-- ============================================================================
-- RPC: Get items in a specific list
-- ============================================================================

create or replace function public.get_list_items(
  p_list_id uuid,
  p_user_id uuid
) returns table (
  id uuid,
  external_id text,
  external_source text,
  metadata jsonb,
  added_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select li.id, li.external_id, li.external_source, li.metadata, li.added_at
  from public.list_items li
  join public.user_lists l on l.id = li.list_id
  where li.list_id = p_list_id
    and l.user_id = p_user_id
  order by li.added_at desc;
end;
$$;

-- ============================================================================
-- RPC: Get all items for a user in a category (for profile pages)
-- ============================================================================

create or replace function public.get_all_user_items(
  p_user_id uuid,
  p_category text
) returns table (
  id uuid,
  list_id uuid,
  list_name text,
  list_type text,
  external_id text,
  external_source text,
  metadata jsonb,
  added_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select li.id, l.id, l.name, l.type, li.external_id, li.external_source, li.metadata, li.added_at
  from public.list_items li
  join public.user_lists l on l.id = li.list_id
  where l.user_id = p_user_id
    and l.category = p_category
  order by li.added_at desc;
end;
$$;

-- ============================================================================
-- GRANT EXECUTE
-- ============================================================================

grant execute on function public.create_default_user_lists(uuid, text) to authenticated;
grant execute on function public.toggle_list_item(uuid, text, text, text, text, jsonb) to authenticated;
grant execute on function public.get_item_list_status(uuid, text, text) to authenticated;
grant execute on function public.add_item_to_list(uuid, uuid, text, text, jsonb) to authenticated;
grant execute on function public.remove_item_from_list(uuid, uuid, text) to authenticated;
grant execute on function public.get_user_lists(uuid, text) to authenticated;
grant execute on function public.get_list_items(uuid, uuid) to authenticated;
grant execute on function public.get_all_user_items(uuid, text) to authenticated;

notify pgrst, 'reload schema';

commit;
