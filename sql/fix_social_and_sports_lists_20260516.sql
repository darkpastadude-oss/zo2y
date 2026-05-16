-- Fixes for collaborative lists + social features + sports custom lists.
-- Run in Supabase SQL editor (one-time migration).

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Ensure legacy restaurant lists table has the columns expected by RPC + UI.
-- ---------------------------------------------------------------------------
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  icon text default 'list',
  is_default boolean default false,
  is_public boolean default false,
  list_kind text default 'restaurant',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.lists_restraunts (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  restraunt_id bigint not null,
  created_at timestamptz default now()
);

alter table public.lists enable row level security;
alter table public.lists_restraunts enable row level security;

drop policy if exists "Public select on lists" on public.lists;
drop policy if exists "Insert own lists" on public.lists;
drop policy if exists "Update own lists" on public.lists;
drop policy if exists "Delete own lists" on public.lists;
create policy "Public select on lists" on public.lists for select using (true);
create policy "Insert own lists" on public.lists for insert with check (user_id = auth.uid());
create policy "Update own lists" on public.lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own lists" on public.lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on lists_restraunts" on public.lists_restraunts;
drop policy if exists "Insert own lists_restraunts" on public.lists_restraunts;
drop policy if exists "Update own lists_restraunts" on public.lists_restraunts;
drop policy if exists "Delete own lists_restraunts" on public.lists_restraunts;
create policy "Public select on lists_restraunts" on public.lists_restraunts for select using (true);
create policy "Insert own lists_restraunts" on public.lists_restraunts for insert with check (exists (
  select 1 from public.lists l where l.id = lists_restraunts.list_id and l.user_id = auth.uid()
));
create policy "Update own lists_restraunts" on public.lists_restraunts for update using (exists (
  select 1 from public.lists l where l.id = lists_restraunts.list_id and l.user_id = auth.uid()
)) with check (exists (
  select 1 from public.lists l where l.id = lists_restraunts.list_id and l.user_id = auth.uid()
));
create policy "Delete own lists_restraunts" on public.lists_restraunts for delete using (exists (
  select 1 from public.lists l where l.id = lists_restraunts.list_id and l.user_id = auth.uid()
));

do $$
begin
  if to_regclass('public.lists') is not null then
    begin
      alter table public.lists add column if not exists description text default '';
    exception when duplicate_column then null;
    end;
    begin
      alter table public.lists add column if not exists icon text default 'list';
    exception when duplicate_column then null;
    end;
    begin
      alter table public.lists add column if not exists updated_at timestamptz default now();
    exception when duplicate_column then null;
    end;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Travel lists: profile UI queries list_kind + updated_at in some builds.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.travel_lists') is not null then
    begin
      alter table public.travel_lists add column if not exists description text default '';
    exception when duplicate_column then null;
    end;
    begin
      alter table public.travel_lists add column if not exists updated_at timestamptz default now();
    exception when duplicate_column then null;
    end;
    begin
      alter table public.travel_lists add column if not exists list_kind text default 'travel';
    exception when duplicate_column then null;
    end;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Sports custom lists (mirrors travel list structure).
-- ---------------------------------------------------------------------------
create table if not exists public.sports_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text default '',
  list_kind text default 'sports',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sports_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id text not null,
  list_type text check (list_type in ('favorites')),
  list_id uuid null references public.sports_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (
    list_id is not null
    or list_type in ('favorites')
  )
);

create index if not exists idx_sports_lists_user on public.sports_lists(user_id);
create index if not exists idx_sports_list_items_user on public.sports_list_items(user_id);
create index if not exists idx_sports_list_items_team on public.sports_list_items(team_id);

create unique index if not exists ux_sports_default_items_unique
  on public.sports_list_items (user_id, team_id, list_type)
  where list_id is null;
create unique index if not exists ux_sports_custom_items_unique
  on public.sports_list_items (list_id, team_id)
  where list_id is not null;

alter table public.sports_lists enable row level security;
alter table public.sports_list_items enable row level security;

drop policy if exists "Public select on sports_lists" on public.sports_lists;
drop policy if exists "Insert own sports_lists" on public.sports_lists;
drop policy if exists "Update own sports_lists" on public.sports_lists;
drop policy if exists "Delete own sports_lists" on public.sports_lists;
create policy "Public select on sports_lists" on public.sports_lists for select using (true);
create policy "Insert own sports_lists" on public.sports_lists for insert with check (user_id = auth.uid());
create policy "Update own sports_lists" on public.sports_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own sports_lists" on public.sports_lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on sports_list_items" on public.sports_list_items;
drop policy if exists "Insert own sports_list_items" on public.sports_list_items;
drop policy if exists "Update own sports_list_items" on public.sports_list_items;
drop policy if exists "Delete own sports_list_items" on public.sports_list_items;
create policy "Public select on sports_list_items" on public.sports_list_items for select using (true);
create policy "Insert own sports_list_items" on public.sports_list_items for insert with check (user_id = auth.uid());
create policy "Update own sports_list_items" on public.sports_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own sports_list_items" on public.sports_list_items for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Social follow system used by profile.js.
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

alter table public.follows enable row level security;

drop policy if exists "Select follows" on public.follows;
create policy "Select follows" on public.follows for select using (true);

drop policy if exists "Insert own follows" on public.follows;
create policy "Insert own follows" on public.follows for insert with check (follower_id = auth.uid());

drop policy if exists "Delete own follows" on public.follows;
create policy "Delete own follows" on public.follows for delete using (follower_id = auth.uid());

commit;

-- ---------------------------------------------------------------------------
-- Collaborative list RPC: make sure it supports all list tables (incl sports).
-- Requires list_collaborators table from collaborative_lists.sql to exist.
-- ---------------------------------------------------------------------------
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
  list_table text;
  sql text;
begin
  if auth.uid() is null then
    return;
  end if;

  case safe_media_type
    when 'movie' then list_table := 'movie_lists';
    when 'tv' then list_table := 'tv_lists';
    when 'anime' then list_table := 'anime_lists';
    when 'game' then list_table := 'game_lists';
    when 'book' then list_table := 'book_lists';
    when 'music' then list_table := 'music_lists';
    when 'travel' then list_table := 'travel_lists';
    when 'fashion' then list_table := 'fashion_lists';
    when 'food' then list_table := 'food_lists';
    when 'car' then list_table := 'car_lists';
    when 'sports' then list_table := 'sports_lists';
    when 'restaurant' then list_table := 'lists';
    else
      return;
  end case;

  if to_regclass(format('public.%s', list_table)) is null then
    return;
  end if;

  sql := format($q$
    with own_lists as (
      select
        l.id::text as id,
        l.user_id,
        l.title,
        coalesce(l.description, '') as description,
        coalesce(l.icon, '') as icon,
        l.created_at,
        coalesce(l.updated_at, l.created_at) as updated_at,
        false as is_collaborative,
        true as can_edit,
        l.user_id as list_owner_id
      from public.%I l
      where l.user_id = auth.uid()
    ),
    shared_lists as (
      select
        l.id::text as id,
        l.user_id,
        l.title,
        coalesce(l.description, '') as description,
        coalesce(l.icon, '') as icon,
        l.created_at,
        coalesce(l.updated_at, l.created_at) as updated_at,
        true as is_collaborative,
        coalesce(lc.can_edit, false) as can_edit,
        lc.list_owner_id
      from public.%I l
      join public.list_collaborators lc
        on lc.media_type = %L
       and lc.list_id = l.id::text
      where lc.collaborator_id = auth.uid()
    )
    select * from own_lists
    union all
    select * from shared_lists
    order by created_at desc nulls last
  $q$, list_table, list_table, safe_media_type);

  return query execute sql;
end;
$$;

grant execute on function public.zo2y_get_accessible_custom_lists(text) to authenticated;
