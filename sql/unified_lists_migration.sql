-- ============================================================================
-- UNIFIED USER LISTS MIGRATION
-- 
-- Replaces all per-category list tables (movie_lists, tv_lists, etc.)
-- with a single unified system: user_lists + list_items
--
-- Run this in the Supabase SQL editor.
-- ============================================================================

begin;

-- ============================================================================
-- STEP 1: Create enum types
-- ============================================================================

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

-- ============================================================================
-- STEP 2: Create unified user_lists table
-- ============================================================================

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

-- ============================================================================
-- STEP 3: Create unified list_items table
-- ============================================================================

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

-- ============================================================================
-- STEP 4: Indexes
-- ============================================================================

create index if not exists idx_user_lists_user on public.user_lists(user_id);
create index if not exists idx_user_lists_user_category on public.user_lists(user_id, category);
create index if not exists idx_user_lists_category on public.user_lists(category);
create index if not exists idx_list_items_list on public.list_items(list_id);
create index if not exists idx_list_items_external on public.list_items(external_id, external_source);

-- ============================================================================
-- STEP 5: Updated_at trigger
-- ============================================================================

create or replace function public.user_lists_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_lists_touch_updated_at on public.user_lists;
create trigger user_lists_touch_updated_at
  before update on public.user_lists
  for each row execute function public.user_lists_touch_updated_at();

-- ============================================================================
-- STEP 6: RLS Policies for unified tables
-- ============================================================================

alter table public.user_lists enable row level security;
alter table public.list_items enable row level security;

-- user_lists: users can only see/modify their own lists
drop policy if exists "Users select own lists" on public.user_lists;
create policy "Users select own lists"
  on public.user_lists for select
  using (user_id = auth.uid());

drop policy if exists "Users insert own lists" on public.user_lists;
create policy "Users insert own lists"
  on public.user_lists for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update own lists" on public.user_lists;
create policy "Users update own lists"
  on public.user_lists for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users delete own lists" on public.user_lists;
create policy "Users delete own lists"
  on public.user_lists for delete
  using (user_id = auth.uid());

-- list_items: users can only see/modify items in their own lists
drop policy if exists "Users select own list items" on public.list_items;
create policy "Users select own list items"
  on public.list_items for select
  using (
    exists (
      select 1 from public.user_lists
      where user_lists.id = list_items.list_id
        and user_lists.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own list items" on public.list_items;
create policy "Users insert own list items"
  on public.list_items for insert
  with check (
    exists (
      select 1 from public.user_lists
      where user_lists.id = list_items.list_id
        and user_lists.user_id = auth.uid()
    )
  );

drop policy if exists "Users update own list items" on public.list_items;
create policy "Users update own list items"
  on public.list_items for update
  using (
    exists (
      select 1 from public.user_lists
      where user_lists.id = list_items.list_id
        and user_lists.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_lists
      where user_lists.id = list_items.list_id
        and user_lists.user_id = auth.uid()
    )
  );

drop policy if exists "Users delete own list items" on public.list_items;
create policy "Users delete own list items"
  on public.list_items for delete
  using (
    exists (
      select 1 from public.user_lists
      where user_lists.id = list_items.list_id
        and user_lists.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 7: Helper function - map old list_type to new unified type
-- ============================================================================

create or replace function public.map_old_list_type(
  p_category text,
  p_old_type text
) returns public.user_list_type
language plpgsql as $$
declare
  v_old text;
  v_result public.user_list_type;
begin
  v_old := lower(trim(coalesce(p_old_type, '')));

  -- favorites maps directly
  if v_old = 'favorites' then
    return 'favorites';
  end if;

  -- completed/watched/read/played/visited/listened/tried/owned
  if v_old in ('watched', 'read', 'played', 'visited', 'listened', 'tried', 'owned') then
    return 'completed';
  end if;

  -- watchlist/backlog/readlist/listenlist/bucketlist/wishlist/want_to_try
  if v_old in ('watchlist', 'backlog', 'readlist', 'listenlist', 'bucketlist', 'wishlist', 'want_to_try') then
    return 'watchlist';
  end if;

  return 'custom';
end;
$$;

-- ============================================================================
-- STEP 8: Helper function - determine external_source from category
-- ============================================================================

create or replace function public.default_external_source(p_category text)
returns text
language plpgsql as $$
begin
  return case lower(trim(p_category))
    when 'movie' then 'tmdb'
    when 'tv' then 'tmdb'
    when 'anime' then 'tmdb'
    when 'game' then 'igdb'
    when 'book' then 'openlibrary'
    when 'music' then 'spotify'
    when 'travel' then 'local_db'
    when 'sports' then 'sportsdb'
    when 'fashion' then 'local_db'
    when 'food' then 'local_db'
    when 'car' then 'local_db'
    else 'local_db'
  end;
end;
$$;

-- ============================================================================
-- STEP 9: Create default lists for a given user
-- ============================================================================

create or replace function public.create_default_user_lists(p_user_id uuid)
returns void
language plpgsql as $$
declare
  v_categories text[] := array[
    'movie', 'tv', 'book', 'anime', 'game', 'sport', 'car',
    'food', 'fashion', 'travel', 'music'
  ];
  v_cat text;
  v_icon text;
begin
  foreach v_cat in array v_categories
  loop
    v_icon := case v_cat
      when 'movie' then 'fas fa-film'
      when 'tv' then 'fas fa-tv'
      when 'book' then 'fas fa-book'
      when 'anime' then 'fas fa-dragon'
      when 'game' then 'fas fa-gamepad'
      when 'music' then 'fas fa-music'
      when 'travel' then 'fas fa-earth-americas'
      when 'sport' then 'fas fa-futbol'
      when 'fashion' then 'fas fa-shirt'
      when 'food' then 'fas fa-burger'
      when 'car' then 'fas fa-car'
      else 'fas fa-list'
    end;

    -- Favorites
    insert into public.user_lists (user_id, name, category, type, icon, sort_order)
    values (p_user_id, 'Favorites', v_cat::public.user_list_category, 'favorites', v_icon, 0)
    on conflict (user_id, category, name) do nothing;

    -- Completed (category-appropriate naming)
    insert into public.user_lists (user_id, name, category, type, icon, sort_order)
    values (
      p_user_id,
      case v_cat
        when 'movie' then 'Watched'
        when 'tv' then 'Watched'
        when 'anime' then 'Watched'
        when 'book' then 'Read'
        when 'game' then 'Played'
        when 'music' then 'Listened'
        when 'travel' then 'Visited'
        when 'sport' then 'Watched'
        when 'fashion' then 'Owned'
        when 'food' then 'Tried'
        when 'car' then 'Owned'
        else 'Completed'
      end,
      v_cat::public.user_list_category,
      'completed',
      case v_cat
        when 'movie' then 'fas fa-eye'
        when 'tv' then 'fas fa-eye'
        when 'anime' then 'fas fa-eye'
        when 'book' then 'fas fa-check'
        when 'game' then 'fas fa-check'
        when 'music' then 'fas fa-headphones'
        when 'travel' then 'fas fa-check'
        when 'sport' then 'fas fa-eye'
        when 'fashion' then 'fas fa-check'
        when 'food' then 'fas fa-utensils'
        when 'car' then 'fas fa-check'
        else 'fas fa-check'
      end,
      1
    )
    on conflict (user_id, category, name) do nothing;

    -- Watchlist/Backlog/Reading List (category-appropriate naming)
    insert into public.user_lists (user_id, name, category, type, icon, sort_order)
    values (
      p_user_id,
      case v_cat
        when 'movie' then 'Watchlist'
        when 'tv' then 'Watchlist'
        when 'anime' then 'Watchlist'
        when 'book' then 'Reading List'
        when 'game' then 'Backlog'
        when 'music' then 'Listen Later'
        when 'travel' then 'Bucket List'
        when 'sport' then 'Watchlist'
        when 'fashion' then 'Wishlist'
        when 'food' then 'Want to Try'
        when 'car' then 'Wishlist'
        else 'Watchlist'
      end,
      v_cat::public.user_list_category,
      'watchlist',
      case v_cat
        when 'movie' then 'fas fa-bookmark'
        when 'tv' then 'fas fa-bookmark'
        when 'anime' then 'fas fa-bookmark'
        when 'book' then 'fas fa-bookmark'
        when 'game' then 'fas fa-clock'
        when 'music' then 'fas fa-clock'
        when 'travel' then 'fas fa-map-marker-alt'
        when 'sport' then 'fas fa-bookmark'
        when 'fashion' then 'fas fa-cart-plus'
        when 'food' then 'fas fa-utensils'
        when 'car' then 'fas fa-cart-plus'
        else 'fas fa-bookmark'
      end,
      2
    )
    on conflict (user_id, category, name) do nothing;
  end loop;
end;
$$;

-- ============================================================================
-- STEP 10: MIGRATION - Migrate all data from old tables
-- ============================================================================

-- Helper: migrate list items for a specific category
create or replace function public.migrate_category_lists(
  p_category text,
  p_list_table text,
  p_items_table text,
  p_id_field text
) returns table (migrated_lists int, migrated_items int)
language plpgsql as $$
declare
  v_cat public.user_list_category;
  v_count_lists int := 0;
  v_count_items int := 0;
  v_new_id uuid;
  v_user_id uuid;
  v_old_type text;
  v_new_type public.user_list_type;
  v_external_source text;
  v_item_external_id text;
  v_item_row record;
  v_list_row record;
begin
  v_cat := p_category::public.user_list_category;
  v_external_source := public.default_external_source(p_category);

  -- Table might not exist; skip gracefully
  if to_regclass(format('public.%I', p_list_table)) is null
     and to_regclass(format('public.%I', p_items_table)) is null then
    return query select 0, 0;
    return;
  end if;

  -- Create temp table to map old list IDs to new list IDs
  create temp table if not exists tmp_list_id_map (
    old_id uuid primary key,
    new_id uuid not null
  ) on commit drop;
  delete from tmp_list_id_map;

  -- Migrate custom lists (preserving old→new ID mapping)
  if to_regclass(format('public.%I', p_list_table)) is not null then
    for v_list_row in
      execute format('select * from public.%I', p_list_table)
    loop
      -- Check if already migrated
      select id into v_new_id from public.user_lists
      where user_id = v_list_row.user_id
        and category = v_cat
        and name = v_list_row.title;

      if v_new_id is null then
        insert into public.user_lists (user_id, name, category, type, icon, description, created_at, updated_at)
        values (
          v_list_row.user_id, v_list_row.title, v_cat, 'custom'::public.user_list_type,
          coalesce(v_list_row.icon, 'fas fa-list'), coalesce(v_list_row.description, ''),
          now(), now()
        )
        returning id into v_new_id;
      end if;

      insert into tmp_list_id_map (old_id, new_id) values (v_list_row.id, v_new_id)
      on conflict (old_id) do nothing;
      v_count_lists := v_count_lists + 1;
    end loop;
  end if;

  -- Create default lists for all users who had items in this category
  for v_user_id in
    execute format('select distinct user_id from public.%I', p_items_table)
  loop
    perform public.create_default_user_lists(v_user_id);
  end loop;

  -- Migrate items from old list_items table
  if to_regclass(format('public.%I', p_items_table)) is not null then
    for v_item_row in
      execute format('select * from public.%I', p_items_table)
    loop
      v_user_id := v_item_row.user_id;
      v_old_type := v_item_row.list_type;
      v_new_type := public.map_old_list_type(p_category, v_old_type);

      -- Determine external_id
      begin
        execute format('select ($1).%I::text', p_id_field) into v_item_external_id using v_item_row;
      exception when others then
        continue;
      end;

      if v_item_external_id is null or v_item_external_id = '' then
        continue;
      end if;

      -- For custom lists, use the mapped list_id via temp table
      if v_new_type = 'custom' and v_item_row.list_id is not null then
        select new_id into v_new_id from tmp_list_id_map where old_id = v_item_row.list_id;

        if v_new_id is not null then
          insert into public.list_items (list_id, external_id, external_source, external_type, added_at)
          values (v_new_id, v_item_external_id, v_external_source, v_cat, coalesce(v_item_row.created_at, now()))
          on conflict (list_id, external_id) do nothing;
          v_count_items := v_count_items + 1;
        end if;

      -- For default lists (favorites/completed/watchlist)
      elsif v_new_type != 'custom' then
        select id into v_new_id from public.user_lists
        where user_id = v_user_id
          and category = v_cat
          and type = v_new_type
        limit 1;

        if v_new_id is not null then
          insert into public.list_items (list_id, external_id, external_source, external_type, added_at)
          values (v_new_id, v_item_external_id, v_external_source, v_cat, coalesce(v_item_row.created_at, now()))
          on conflict (list_id, external_id) do nothing;
          v_count_items := v_count_items + 1;
        end if;
      end if;
    end loop;
  end if;

  return query select v_count_lists, v_count_items;
end;
$$;

-- ============================================================================
-- STEP 11: Execute migrations for all categories
-- ============================================================================

do $$
declare
  v_result record;
  v_total_lists int := 0;
  v_total_items int := 0;
begin
  -- Movies
  select * into v_result from public.migrate_category_lists(
    'movie', 'movie_lists', 'movie_list_items', 'movie_id'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  -- TV
  select * into v_result from public.migrate_category_lists(
    'tv', 'tv_lists', 'tv_list_items', 'tv_id'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  -- TV (tvshow_list_items too)
  if to_regclass('public.tvshow_list_items') is not null then
    select * into v_result from public.migrate_category_lists(
      'tv', 'tv_lists', 'tvshow_list_items', 'tvshow_id'
    );
    v_total_lists := v_total_lists + v_result.migrated_lists;
    v_total_items := v_total_items + v_result.migrated_items;
  end if;

  -- Anime
  select * into v_result from public.migrate_category_lists(
    'anime', 'anime_lists', 'anime_list_items', 'anime_id'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  -- Games
  select * into v_result from public.migrate_category_lists(
    'game', 'game_lists', 'game_list_items', 'game_id'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  -- Books
  select * into v_result from public.migrate_category_lists(
    'book', 'book_lists', 'book_list_items', 'book_id'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  -- Music
  select * into v_result from public.migrate_category_lists(
    'music', 'music_lists', 'music_list_items', 'track_id'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  -- Travel
  select * into v_result from public.migrate_category_lists(
    'travel', 'travel_lists', 'travel_list_items', 'country_code'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  -- Sports
  select * into v_result from public.migrate_category_lists(
    'sport', 'sports_lists', 'sports_list_items', 'team_id'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  -- Migrate user_favorite_teams (special case)
  if to_regclass('public.user_favorite_teams') is not null then
    insert into public.list_items (list_id, external_id, external_source, external_type, added_at)
    select
      (select id from public.user_lists
       where user_lists.user_id = uft.user_id
         and user_lists.category = 'sport'::public.user_list_category
         and user_lists.type = 'favorites'::public.user_list_type
       limit 1),
      uft.team_id,
      'sportsdb',
      'sport'::public.user_list_category,
      uft.created_at
    from public.user_favorite_teams uft
    where exists (
      select 1 from public.user_lists
      where user_lists.user_id = uft.user_id
        and user_lists.category = 'sport'::public.user_list_category
        and user_lists.type = 'favorites'::public.user_list_type
    )
    on conflict (list_id, external_id) do nothing;
    v_total_items := v_total_items + 1;
  end if;

  -- Fashion
  select * into v_result from public.migrate_category_lists(
    'fashion', 'fashion_lists', 'fashion_list_items', 'brand_id'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  -- Food
  select * into v_result from public.migrate_category_lists(
    'food', 'food_lists', 'food_list_items', 'brand_id'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  -- Cars
  select * into v_result from public.migrate_category_lists(
    'car', 'car_lists', 'car_list_items', 'brand_id'
  );
  v_total_lists := v_total_lists + v_result.migrated_lists;
  v_total_items := v_total_items + v_result.migrated_items;

  raise notice 'Migration complete: % lists, % items migrated', v_total_lists, v_total_items;
end;
$$;

-- ============================================================================
-- STEP 12: Create API helper functions
-- ============================================================================

-- Get user lists for a specific category
create or replace function public.get_user_lists(
  p_user_id uuid,
  p_category text
) returns table (
  id uuid,
  name text,
  category public.user_list_category,
  type public.user_list_type,
  icon text,
  description text,
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
    l.id,
    l.name,
    l.category,
    l.type,
    l.icon,
    l.description,
    coalesce((select count(*) from public.list_items li where li.list_id = l.id), 0) as item_count,
    l.created_at,
    l.updated_at
  from public.user_lists l
  where l.user_id = p_user_id
    and l.category = p_category::public.user_list_category
  order by l.sort_order, l.name;
end;
$$;

-- Get items in a specific list
create or replace function public.get_list_items(
  p_list_id uuid,
  p_user_id uuid
) returns table (
  id uuid,
  external_id text,
  external_source text,
  external_type public.user_list_category,
  metadata jsonb,
  added_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    li.id,
    li.external_id,
    li.external_source,
    li.external_type,
    li.metadata,
    li.added_at
  from public.list_items li
  join public.user_lists l on l.id = li.list_id
  where li.list_id = p_list_id
    and l.user_id = p_user_id
  order by li.added_at desc;
end;
$$;

-- Add item to a list (with category enforcement)
create or replace function public.add_item_to_list(
  p_list_id uuid,
  p_user_id uuid,
  p_external_id text,
  p_external_source text,
  p_metadata jsonb default '{}'::jsonb
) returns public.list_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list public.user_lists;
  v_item public.list_items;
begin
  -- Verify the list belongs to the user
  select * into v_list
  from public.user_lists
  where id = p_list_id and user_id = p_user_id;

  if v_list.id is null then
    raise exception 'List not found or access denied' using errcode = 'P0002';
  end if;

  -- Category enforcement: external_type must match list category
  insert into public.list_items (list_id, external_id, external_source, external_type, metadata)
  values (p_list_id, p_external_id, p_external_source, v_list.category, coalesce(p_metadata, '{}'::jsonb))
  on conflict (list_id, external_id)
  do update set
    external_source = excluded.external_source,
    metadata = public.list_items.metadata || excluded.metadata,
    added_at = now()
  returning * into v_item;

  return v_item;
end;
$$;

-- Remove item from a list
create or replace function public.remove_item_from_list(
  p_list_id uuid,
  p_user_id uuid,
  p_external_id text
) returns boolean
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
    raise exception 'List not found or access denied' using errcode = 'P0002';
  end if;

  delete from public.list_items
  where list_id = p_list_id and external_id = p_external_id;

  return found;
end;
$$;

-- Toggle item in a default list (favorites/completed/watchlist)
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

  -- Find the default list
  select id into v_list_id
  from public.user_lists
  where user_id = p_user_id
    and category = v_cat
    and type = v_type
  limit 1;

  if v_list_id is null then
    raise exception 'Default list not found for category % type %', p_category, p_list_type using errcode = 'P0002';
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

-- Check if item is in any list for a user/category
create or replace function public.get_item_list_status(
  p_user_id uuid,
  p_category text,
  p_external_id text
) returns table (
  list_id uuid,
  list_name text,
  list_type public.user_list_type
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
    and l.category = p_category::public.user_list_category
    and li.external_id = p_external_id;
end;
$$;

-- Grant execute permissions
grant execute on function public.get_user_lists(uuid, text) to authenticated;
grant execute on function public.get_list_items(uuid, uuid) to authenticated;
grant execute on function public.add_item_to_list(uuid, uuid, text, text, jsonb) to authenticated;
grant execute on function public.remove_item_from_list(uuid, uuid, text) to authenticated;
grant execute on function public.toggle_list_item(uuid, text, text, text, text, jsonb) to authenticated;
grant execute on function public.get_item_list_status(uuid, text, text) to authenticated;

-- ============================================================================
-- STEP 13: Update cross-cutting tables (list_collaborators, list_tier_meta, list_tier_ranks)
-- ============================================================================

-- Update list_collaborators constraint to include all categories
do $$
begin
  if to_regclass('public.list_collaborators') is not null then
    alter table public.list_collaborators
      drop constraint if exists list_collaborators_media_type_check;
    alter table public.list_collaborators
      add constraint list_collaborators_media_type_check
      check (media_type in (
        'movie', 'tv', 'book', 'anime', 'game', 'sport', 'car',
        'food', 'fashion', 'travel', 'music'
      ));
  end if;
end $$;

-- Update list_tier_meta if it exists
do $$
begin
  if to_regclass('public.list_tier_meta') is not null then
    alter table public.list_tier_meta
      drop constraint if exists list_tier_meta_media_type_check;
    alter table public.list_tier_meta
      add constraint list_tier_meta_media_type_check
      check (media_type in (
        'movie', 'tv', 'book', 'anime', 'game', 'sport', 'car',
        'food', 'fashion', 'travel', 'music'
      ));
  end if;
end $$;

-- Update list_tier_ranks if it exists
do $$
begin
  if to_regclass('public.list_tier_ranks') is not null then
    alter table public.list_tier_ranks
      drop constraint if exists list_tier_ranks_media_type_check;
    alter table public.list_tier_ranks
      add constraint list_tier_ranks_media_type_check
      check (media_type in (
        'movie', 'tv', 'book', 'anime', 'game', 'sport', 'car',
        'food', 'fashion', 'travel', 'music'
      ));
  end if;
end $$;

-- ============================================================================
-- STEP 14: Update activity feed triggers for unified tables
-- ============================================================================

create or replace function public.log_list_activity_iud_v2()
returns trigger
language plpgsql
as $$
declare
  v_event_type text;
  v_media_type text;
  v_item_id text;
  v_actor_id uuid;
  v_list_type text;
  v_list_id uuid;
  v_list public.user_lists;
  v_payload jsonb;
begin
  v_event_type := case tg_op
    when 'INSERT' then 'list_add'
    when 'DELETE' then 'list_remove'
    else null
  end;
  if v_event_type is null then
    return coalesce(new, old);
  end if;

  v_payload := case
    when tg_op = 'INSERT' then to_jsonb(new)
    when tg_op = 'DELETE' then to_jsonb(old)
    else '{}'::jsonb
  end;

  v_item_id := nullif(v_payload->>'external_id', '');
  v_list_id := nullif(v_payload->>'list_id', '')::uuid;

  if v_list_id is not null then
    select * into v_list from public.user_lists where id = v_list_id;
    v_media_type := v_list.category::text;
    v_list_type := v_list.type::text;
    v_actor_id := v_list.user_id;
  end if;

  if v_media_type is null or v_item_id is null or v_actor_id is null then
    return coalesce(new, old);
  end if;

  insert into public.user_activity_feed (
    actor_id, event_type, media_type, item_id, list_type, list_id, metadata
  ) values (
    v_actor_id,
    v_event_type,
    v_media_type,
    v_item_id,
    v_list_type,
    v_list_id,
    jsonb_build_object(
      'source_table', tg_table_name,
      'source_pk', nullif(v_payload->>'id', '')
    )
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.log_custom_list_activity_iud_v2()
returns trigger
language plpgsql
as $$
declare
  v_event_type text;
  v_media_type text;
  v_actor_id uuid;
  v_list_id uuid;
  v_list_title text;
  v_payload jsonb;
begin
  v_event_type := case tg_op
    when 'INSERT' then 'list_create'
    when 'DELETE' then 'list_delete'
    else null
  end;
  if v_event_type is null then
    return coalesce(new, old);
  end if;

  v_payload := case
    when tg_op = 'INSERT' then to_jsonb(new)
    when tg_op = 'DELETE' then to_jsonb(old)
    else '{}'::jsonb
  end;

  v_actor_id := nullif(v_payload->>'user_id', '')::uuid;
  v_list_id := nullif(v_payload->>'id', '')::uuid;
  v_list_title := nullif(trim(v_payload->>'name'), '');
  v_media_type := nullif(v_payload->>'category', '');

  if v_media_type is null or v_actor_id is null or v_list_id is null then
    return coalesce(new, old);
  end if;

  insert into public.user_activity_feed (
    actor_id, event_type, media_type, list_id, metadata
  ) values (
    v_actor_id,
    v_event_type,
    v_media_type,
    v_list_id,
    jsonb_build_object(
      'source_table', tg_table_name,
      'source_pk', nullif(v_payload->>'id', ''),
      'list_title', v_list_title
    )
  );

  return coalesce(new, old);
end;
$$;

-- Create triggers on the new unified tables
drop trigger if exists trg_list_items_add_activity on public.list_items;
create trigger trg_list_items_add_activity
  after insert on public.list_items
  for each row execute function public.log_list_activity_iud_v2();

drop trigger if exists trg_list_items_remove_activity on public.list_items;
create trigger trg_list_items_remove_activity
  after delete on public.list_items
  for each row execute function public.log_list_activity_iud_v2();

drop trigger if exists trg_user_lists_create_activity on public.user_lists;
create trigger trg_user_lists_create_activity
  after insert on public.user_lists
  for each row execute function public.log_custom_list_activity_iud_v2();

drop trigger if exists trg_user_lists_delete_activity on public.user_lists;
create trigger trg_user_lists_delete_activity
  after delete on public.user_lists
  for each row execute function public.log_custom_list_activity_iud_v2();

-- ============================================================================
-- STEP 15: Validation queries (run AFTER migration, before dropping old tables)
-- ============================================================================

-- Check migrated data integrity
do $$
declare
  v_old_count bigint;
  v_new_count bigint;
  v_issue boolean := false;
begin
  -- Movie
  if to_regclass('public.movie_list_items') is not null then
    select count(*) into v_old_count from public.movie_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'movie';
    if v_new_count < v_old_count then
      raise warning 'MOVIE: old=% new=% (items may be missing. Check uniqueness constraints)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'MOVIE: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  -- TV
  if to_regclass('public.tv_list_items') is not null then
    select count(*) into v_old_count from public.tv_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'tv';
    if v_new_count < v_old_count then
      raise warning 'TV: old=% new=% (items may be missing)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'TV: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  -- Anime
  if to_regclass('public.anime_list_items') is not null then
    select count(*) into v_old_count from public.anime_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'anime';
    if v_new_count < v_old_count then
      raise warning 'ANIME: old=% new=% (items may be missing)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'ANIME: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  -- Game
  if to_regclass('public.game_list_items') is not null then
    select count(*) into v_old_count from public.game_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'game';
    if v_new_count < v_old_count then
      raise warning 'GAME: old=% new=% (items may be missing)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'GAME: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  -- Book
  if to_regclass('public.book_list_items') is not null then
    select count(*) into v_old_count from public.book_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'book';
    if v_new_count < v_old_count then
      raise warning 'BOOK: old=% new=% (items may be missing)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'BOOK: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  -- Music
  if to_regclass('public.music_list_items') is not null then
    select count(*) into v_old_count from public.music_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'music';
    if v_new_count < v_old_count then
      raise warning 'MUSIC: old=% new=% (items may be missing)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'MUSIC: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  -- Travel
  if to_regclass('public.travel_list_items') is not null then
    select count(*) into v_old_count from public.travel_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'travel';
    if v_new_count < v_old_count then
      raise warning 'TRAVEL: old=% new=% (items may be missing)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'TRAVEL: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  -- Sports
  if to_regclass('public.sports_list_items') is not null then
    select count(*) into v_old_count from public.sports_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'sport';
    if v_new_count < v_old_count then
      raise warning 'SPORTS: old=% new=% (items may be missing)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'SPORTS: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  -- Fashion
  if to_regclass('public.fashion_list_items') is not null then
    select count(*) into v_old_count from public.fashion_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'fashion';
    if v_new_count < v_old_count then
      raise warning 'FASHION: old=% new=% (items may be missing)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'FASHION: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  -- Food
  if to_regclass('public.food_list_items') is not null then
    select count(*) into v_old_count from public.food_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'food';
    if v_new_count < v_old_count then
      raise warning 'FOOD: old=% new=% (items may be missing)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'FOOD: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  -- Cars
  if to_regclass('public.car_list_items') is not null then
    select count(*) into v_old_count from public.car_list_items;
    select count(*) into v_new_count
    from public.list_items li
    join public.user_lists l on l.id = li.list_id
    where l.category = 'car';
    if v_new_count < v_old_count then
      raise warning 'CAR: old=% new=% (items may be missing)', v_old_count, v_new_count;
      v_issue := true;
    else
      raise notice 'CAR: old=% new=% - OK', v_old_count, v_new_count;
    end if;
  end if;

  if v_issue then
    raise notice 'VALIDATION COMPLETE: Some categories have fewer items than expected. Check warnings above.';
  else
    raise notice 'VALIDATION COMPLETE: All categories migrated successfully. Ready to drop old tables.';
  end if;
end;
$$;

-- ============================================================================
-- STEP 16: Drop old tables (run separately after validation)
-- ============================================================================
-- Uncomment these lines ONLY after running validation and confirming data integrity.
-- Run them as a separate transaction or manually.
--
-- drop table if exists public.movie_list_items cascade;
-- drop table if exists public.movie_lists cascade;
-- drop table if exists public.tv_list_items cascade;
-- drop table if exists public.tvshow_list_items cascade;
-- drop table if exists public.tv_lists cascade;
-- drop table if exists public.anime_list_items cascade;
-- drop table if exists public.anime_lists cascade;
-- drop table if exists public.game_list_items cascade;
-- drop table if exists public.game_lists cascade;
-- drop table if exists public.book_list_items cascade;
-- drop table if exists public.book_lists cascade;
-- drop table if exists public.music_list_items cascade;
-- drop table if exists public.music_lists cascade;
-- drop table if exists public.travel_list_items cascade;
-- drop table if exists public.travel_lists cascade;
-- drop table if exists public.sports_list_items cascade;
-- drop table if exists public.sports_lists cascade;
-- drop table if exists public.user_favorite_teams cascade;
-- drop table if exists public.fashion_list_items cascade;
-- drop table if exists public.fashion_lists cascade;
-- drop table if exists public.food_list_items cascade;
-- drop table if exists public.food_lists cascade;
-- drop table if exists public.car_list_items cascade;
-- drop table if exists public.car_lists cascade;

-- ============================================================================
-- STEP 17: Notify PostgREST to reload schema
-- ============================================================================

notify pgrst, 'reload schema';

commit;
