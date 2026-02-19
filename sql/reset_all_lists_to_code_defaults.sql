-- Full list-system rebuild + hard reset for frontend list features.
-- Target pages: index.html, movies.html, profile.html (and related media pages).
--
-- This script does four things:
-- 1) Ensures list tables/columns/indexes exist and match app expectations.
-- 2) Rebuilds RLS policies so frontend writes work with authenticated users.
-- 3) Deletes all old list data.
-- 4) Re-seeds default restaurant lists per user:
--    Favorites / Visited / Want to Go
--
-- Run in Supabase SQL Editor as project owner (privileged role).

begin;

create extension if not exists pgcrypto;

-- ============================================================================
-- Core helper
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Optional utility used by existing SQL/scripts/UI
create or replace function public.update_user_counts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_regclass('public.user_profiles') is null then
    return;
  end if;

  update public.user_profiles p
  set
    lists_count = coalesce(s.restaurant_lists_count, 0),
    favorites_count = coalesce(s.favorites_count, 0),
    visited_count = coalesce(s.visited_count, 0),
    updated_at = now()
  from (
    select
      u.id as user_id,
      (
        select count(*)
        from public.lists l
        where l.user_id = u.id
      ) as restaurant_lists_count,
      (
        select count(*)
        from public.lists_restraunts lr
        join public.lists l on l.id = lr.list_id
        where l.user_id = u.id
          and lower(l.title) = 'favorites'
      ) as favorites_count,
      (
        select count(*)
        from public.lists_restraunts lr
        join public.lists l on l.id = lr.list_id
        where l.user_id = u.id
          and lower(l.title) = 'visited'
      ) as visited_count
    from auth.users u
  ) s
  where p.id = s.user_id;
exception
  when undefined_column then
    -- Be tolerant if your user_profiles schema differs slightly.
    null;
end;
$$;

-- ============================================================================
-- Table definitions (create if missing)
-- ============================================================================

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

create table if not exists public.movie_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text default 'fas fa-film',
  description text default '',
  is_public boolean default false,
  list_kind text default 'movie',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tv_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text default 'fas fa-tv',
  description text default '',
  is_public boolean default false,
  list_kind text default 'tv',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.game_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text default 'fas fa-gamepad',
  description text default '',
  is_public boolean default false,
  list_kind text default 'game',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.book_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text default 'fas fa-book',
  description text default '',
  is_public boolean default false,
  list_kind text default 'book',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.music_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text default 'fas fa-music',
  description text default '',
  is_public boolean default false,
  list_kind text default 'music',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.movie_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id bigint not null,
  list_type text,
  list_id uuid references public.movie_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.tv_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tv_id bigint not null,
  list_type text,
  list_id uuid references public.tv_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.game_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id bigint not null,
  list_type text,
  list_id uuid references public.game_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.book_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null,
  list_type text,
  list_id uuid references public.book_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.music_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null,
  list_type text,
  list_id uuid references public.music_lists(id) on delete cascade,
  created_at timestamptz default now()
);

-- ============================================================================
-- Backfill missing columns on existing tables (safe, additive only)
-- ============================================================================

alter table public.lists add column if not exists description text default '';
alter table public.lists add column if not exists icon text default 'list';
alter table public.lists add column if not exists is_default boolean default false;
alter table public.lists add column if not exists is_public boolean default false;
alter table public.lists add column if not exists list_kind text default 'restaurant';
alter table public.lists add column if not exists created_at timestamptz default now();
alter table public.lists add column if not exists updated_at timestamptz default now();

alter table public.movie_lists add column if not exists icon text default 'fas fa-film';
alter table public.movie_lists add column if not exists description text default '';
alter table public.movie_lists add column if not exists is_public boolean default false;
alter table public.movie_lists add column if not exists list_kind text default 'movie';
alter table public.movie_lists add column if not exists created_at timestamptz default now();
alter table public.movie_lists add column if not exists updated_at timestamptz default now();

alter table public.tv_lists add column if not exists icon text default 'fas fa-tv';
alter table public.tv_lists add column if not exists description text default '';
alter table public.tv_lists add column if not exists is_public boolean default false;
alter table public.tv_lists add column if not exists list_kind text default 'tv';
alter table public.tv_lists add column if not exists created_at timestamptz default now();
alter table public.tv_lists add column if not exists updated_at timestamptz default now();

alter table public.game_lists add column if not exists icon text default 'fas fa-gamepad';
alter table public.game_lists add column if not exists description text default '';
alter table public.game_lists add column if not exists is_public boolean default false;
alter table public.game_lists add column if not exists list_kind text default 'game';
alter table public.game_lists add column if not exists created_at timestamptz default now();
alter table public.game_lists add column if not exists updated_at timestamptz default now();

alter table public.book_lists add column if not exists icon text default 'fas fa-book';
alter table public.book_lists add column if not exists description text default '';
alter table public.book_lists add column if not exists is_public boolean default false;
alter table public.book_lists add column if not exists list_kind text default 'book';
alter table public.book_lists add column if not exists created_at timestamptz default now();
alter table public.book_lists add column if not exists updated_at timestamptz default now();

alter table public.music_lists add column if not exists icon text default 'fas fa-music';
alter table public.music_lists add column if not exists description text default '';
alter table public.music_lists add column if not exists is_public boolean default false;
alter table public.music_lists add column if not exists list_kind text default 'music';
alter table public.music_lists add column if not exists created_at timestamptz default now();
alter table public.music_lists add column if not exists updated_at timestamptz default now();

alter table public.movie_list_items add column if not exists list_type text;
alter table public.movie_list_items add column if not exists list_id uuid references public.movie_lists(id) on delete cascade;
alter table public.movie_list_items add column if not exists created_at timestamptz default now();

alter table public.tv_list_items add column if not exists list_type text;
alter table public.tv_list_items add column if not exists list_id uuid references public.tv_lists(id) on delete cascade;
alter table public.tv_list_items add column if not exists created_at timestamptz default now();

alter table public.game_list_items add column if not exists list_type text;
alter table public.game_list_items add column if not exists list_id uuid references public.game_lists(id) on delete cascade;
alter table public.game_list_items add column if not exists created_at timestamptz default now();

alter table public.book_list_items add column if not exists list_type text;
alter table public.book_list_items add column if not exists list_id uuid references public.book_lists(id) on delete cascade;
alter table public.book_list_items add column if not exists created_at timestamptz default now();

alter table public.music_list_items add column if not exists list_type text;
alter table public.music_list_items add column if not exists list_id uuid references public.music_lists(id) on delete cascade;
alter table public.music_list_items add column if not exists created_at timestamptz default now();

alter table public.lists_restraunts add column if not exists created_at timestamptz default now();

-- ============================================================================
-- Indexes + uniqueness
-- ============================================================================

create index if not exists idx_lists_user on public.lists(user_id);
create index if not exists idx_lists_restraunts_list on public.lists_restraunts(list_id);
create index if not exists idx_lists_restraunts_rest on public.lists_restraunts(restraunt_id);
create unique index if not exists ux_lists_user_title_lower on public.lists(user_id, lower(title));
create unique index if not exists ux_lists_restraunts_unique on public.lists_restraunts(list_id, restraunt_id);

create index if not exists idx_movie_lists_user on public.movie_lists(user_id);
create index if not exists idx_tv_lists_user on public.tv_lists(user_id);
create index if not exists idx_game_lists_user on public.game_lists(user_id);
create index if not exists idx_book_lists_user on public.book_lists(user_id);
create index if not exists idx_music_lists_user on public.music_lists(user_id);

create unique index if not exists ux_movie_lists_user_title_lower on public.movie_lists(user_id, lower(title));
create unique index if not exists ux_tv_lists_user_title_lower on public.tv_lists(user_id, lower(title));
create unique index if not exists ux_game_lists_user_title_lower on public.game_lists(user_id, lower(title));
create unique index if not exists ux_book_lists_user_title_lower on public.book_lists(user_id, lower(title));
create unique index if not exists ux_music_lists_user_title_lower on public.music_lists(user_id, lower(title));

create index if not exists idx_movie_list_items_user on public.movie_list_items(user_id);
create index if not exists idx_movie_list_items_item on public.movie_list_items(movie_id);
create index if not exists idx_tv_list_items_user on public.tv_list_items(user_id);
create index if not exists idx_tv_list_items_item on public.tv_list_items(tv_id);
create index if not exists idx_game_list_items_user on public.game_list_items(user_id);
create index if not exists idx_game_list_items_item on public.game_list_items(game_id);
create index if not exists idx_book_list_items_user on public.book_list_items(user_id);
create index if not exists idx_book_list_items_item on public.book_list_items(book_id);
create index if not exists idx_music_list_items_user on public.music_list_items(user_id);
create index if not exists idx_music_list_items_item on public.music_list_items(track_id);

create unique index if not exists ux_movie_list_items_unique_expr
  on public.movie_list_items(user_id, movie_id, coalesce(list_type, ''), coalesce(list_id::text, ''));
create unique index if not exists ux_tv_list_items_unique_expr
  on public.tv_list_items(user_id, tv_id, coalesce(list_type, ''), coalesce(list_id::text, ''));
create unique index if not exists ux_game_list_items_unique_expr
  on public.game_list_items(user_id, game_id, coalesce(list_type, ''), coalesce(list_id::text, ''));
create unique index if not exists ux_book_list_items_unique_expr
  on public.book_list_items(user_id, book_id, coalesce(list_type, ''), coalesce(list_id::text, ''));
create unique index if not exists ux_music_list_items_unique_expr
  on public.music_list_items(user_id, track_id, coalesce(list_type, ''), coalesce(list_id::text, ''));

-- ============================================================================
-- Updated-at triggers
-- ============================================================================

drop trigger if exists trg_lists_set_updated_at on public.lists;
create trigger trg_lists_set_updated_at
before update on public.lists
for each row execute function public.set_updated_at();

drop trigger if exists trg_movie_lists_set_updated_at on public.movie_lists;
create trigger trg_movie_lists_set_updated_at
before update on public.movie_lists
for each row execute function public.set_updated_at();

drop trigger if exists trg_tv_lists_set_updated_at on public.tv_lists;
create trigger trg_tv_lists_set_updated_at
before update on public.tv_lists
for each row execute function public.set_updated_at();

drop trigger if exists trg_game_lists_set_updated_at on public.game_lists;
create trigger trg_game_lists_set_updated_at
before update on public.game_lists
for each row execute function public.set_updated_at();

drop trigger if exists trg_book_lists_set_updated_at on public.book_lists;
create trigger trg_book_lists_set_updated_at
before update on public.book_lists
for each row execute function public.set_updated_at();

drop trigger if exists trg_music_lists_set_updated_at on public.music_lists;
create trigger trg_music_lists_set_updated_at
before update on public.music_lists
for each row execute function public.set_updated_at();

-- ============================================================================
-- Grants
-- ============================================================================

grant select on
  public.lists,
  public.lists_restraunts,
  public.movie_lists,
  public.movie_list_items,
  public.tv_lists,
  public.tv_list_items,
  public.game_lists,
  public.game_list_items,
  public.book_lists,
  public.book_list_items,
  public.music_lists,
  public.music_list_items
to anon;

grant select, insert, update, delete on
  public.lists,
  public.lists_restraunts,
  public.movie_lists,
  public.movie_list_items,
  public.tv_lists,
  public.tv_list_items,
  public.game_lists,
  public.game_list_items,
  public.book_lists,
  public.book_list_items,
  public.music_lists,
  public.music_list_items
to authenticated;

-- ============================================================================
-- RLS policies (drop all existing policies on these tables, then recreate)
-- ============================================================================

do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'lists',
        'lists_restraunts',
        'movie_lists',
        'movie_list_items',
        'tv_lists',
        'tv_list_items',
        'game_lists',
        'game_list_items',
        'book_lists',
        'book_list_items',
        'music_lists',
        'music_list_items'
      )
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end;
$$;

alter table public.lists enable row level security;
alter table public.lists_restraunts enable row level security;
alter table public.movie_lists enable row level security;
alter table public.movie_list_items enable row level security;
alter table public.tv_lists enable row level security;
alter table public.tv_list_items enable row level security;
alter table public.game_lists enable row level security;
alter table public.game_list_items enable row level security;
alter table public.book_lists enable row level security;
alter table public.book_list_items enable row level security;
alter table public.music_lists enable row level security;
alter table public.music_list_items enable row level security;

-- lists
create policy lists_select_public on public.lists for select using (true);
create policy lists_insert_own on public.lists for insert with check (auth.uid() = user_id);
create policy lists_update_own on public.lists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy lists_delete_own on public.lists for delete using (auth.uid() = user_id);

-- lists_restraunts
create policy lists_restraunts_select_public on public.lists_restraunts for select using (true);
create policy lists_restraunts_insert_own on public.lists_restraunts
for insert with check (
  exists (
    select 1
    from public.lists l
    where l.id = lists_restraunts.list_id
      and l.user_id = auth.uid()
  )
);
create policy lists_restraunts_update_own on public.lists_restraunts
for update using (
  exists (
    select 1
    from public.lists l
    where l.id = lists_restraunts.list_id
      and l.user_id = auth.uid()
  )
);
create policy lists_restraunts_delete_own on public.lists_restraunts
for delete using (
  exists (
    select 1
    from public.lists l
    where l.id = lists_restraunts.list_id
      and l.user_id = auth.uid()
  )
);

-- movie
create policy movie_lists_select_public on public.movie_lists for select using (true);
create policy movie_lists_insert_own on public.movie_lists for insert with check (auth.uid() = user_id);
create policy movie_lists_update_own on public.movie_lists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy movie_lists_delete_own on public.movie_lists for delete using (auth.uid() = user_id);

create policy movie_list_items_select_public on public.movie_list_items for select using (true);
create policy movie_list_items_insert_own on public.movie_list_items
for insert with check (
  auth.uid() = user_id
  and (
    list_id is null
    or exists (
      select 1 from public.movie_lists l
      where l.id = movie_list_items.list_id
        and l.user_id = auth.uid()
    )
  )
);
create policy movie_list_items_update_own on public.movie_list_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy movie_list_items_delete_own on public.movie_list_items
for delete using (auth.uid() = user_id);

-- tv
create policy tv_lists_select_public on public.tv_lists for select using (true);
create policy tv_lists_insert_own on public.tv_lists for insert with check (auth.uid() = user_id);
create policy tv_lists_update_own on public.tv_lists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tv_lists_delete_own on public.tv_lists for delete using (auth.uid() = user_id);

create policy tv_list_items_select_public on public.tv_list_items for select using (true);
create policy tv_list_items_insert_own on public.tv_list_items
for insert with check (
  auth.uid() = user_id
  and (
    list_id is null
    or exists (
      select 1 from public.tv_lists l
      where l.id = tv_list_items.list_id
        and l.user_id = auth.uid()
    )
  )
);
create policy tv_list_items_update_own on public.tv_list_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tv_list_items_delete_own on public.tv_list_items
for delete using (auth.uid() = user_id);

-- game
create policy game_lists_select_public on public.game_lists for select using (true);
create policy game_lists_insert_own on public.game_lists for insert with check (auth.uid() = user_id);
create policy game_lists_update_own on public.game_lists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy game_lists_delete_own on public.game_lists for delete using (auth.uid() = user_id);

create policy game_list_items_select_public on public.game_list_items for select using (true);
create policy game_list_items_insert_own on public.game_list_items
for insert with check (
  auth.uid() = user_id
  and (
    list_id is null
    or exists (
      select 1 from public.game_lists l
      where l.id = game_list_items.list_id
        and l.user_id = auth.uid()
    )
  )
);
create policy game_list_items_update_own on public.game_list_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy game_list_items_delete_own on public.game_list_items
for delete using (auth.uid() = user_id);

-- book
create policy book_lists_select_public on public.book_lists for select using (true);
create policy book_lists_insert_own on public.book_lists for insert with check (auth.uid() = user_id);
create policy book_lists_update_own on public.book_lists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy book_lists_delete_own on public.book_lists for delete using (auth.uid() = user_id);

create policy book_list_items_select_public on public.book_list_items for select using (true);
create policy book_list_items_insert_own on public.book_list_items
for insert with check (
  auth.uid() = user_id
  and (
    list_id is null
    or exists (
      select 1 from public.book_lists l
      where l.id = book_list_items.list_id
        and l.user_id = auth.uid()
    )
  )
);
create policy book_list_items_update_own on public.book_list_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy book_list_items_delete_own on public.book_list_items
for delete using (auth.uid() = user_id);

-- music
create policy music_lists_select_public on public.music_lists for select using (true);
create policy music_lists_insert_own on public.music_lists for insert with check (auth.uid() = user_id);
create policy music_lists_update_own on public.music_lists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy music_lists_delete_own on public.music_lists for delete using (auth.uid() = user_id);

create policy music_list_items_select_public on public.music_list_items for select using (true);
create policy music_list_items_insert_own on public.music_list_items
for insert with check (
  auth.uid() = user_id
  and (
    list_id is null
    or exists (
      select 1 from public.music_lists l
      where l.id = music_list_items.list_id
        and l.user_id = auth.uid()
    )
  )
);
create policy music_list_items_update_own on public.music_list_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy music_list_items_delete_own on public.music_list_items
for delete using (auth.uid() = user_id);

-- ============================================================================
-- HARD RESET (delete all old list data)
-- ============================================================================

create temp table if not exists _reset_list_users (
  user_id uuid primary key
) on commit drop;

insert into _reset_list_users(user_id)
select distinct id from auth.users
on conflict do nothing;

do $$
begin
  if to_regclass('public.user_profiles') is not null then
    insert into _reset_list_users(user_id)
    select distinct id
    from public.user_profiles
    where id is not null
    on conflict do nothing;
  end if;
end;
$$;

do $$
declare
  tbl text;
begin
  for tbl in
    select * from unnest(array[
      'public.backup_lists_restraunts',
      'public.lists_restraunts',
      'public.movie_list_items',
      'public.tv_list_items',
      'public.game_list_items',
      'public.book_list_items',
      'public.music_list_items',
      'public.mixed_list_items',
      'public.tier_list_items',
      'public.backup_lists',
      'public.lists',
      'public.movie_lists',
      'public.tv_lists',
      'public.game_lists',
      'public.book_lists',
      'public.music_lists',
      'public.mixed_lists',
      'public.tier_lists'
    ])
  loop
    if to_regclass(tbl) is not null then
      execute format('truncate table %s restart identity cascade', tbl);
    end if;
  end loop;
end;
$$;

insert into public.lists (
  user_id,
  title,
  description,
  icon,
  is_default,
  is_public,
  list_kind,
  created_at,
  updated_at
)
select
  u.user_id,
  d.title,
  d.description,
  d.icon,
  true,
  false,
  'restaurant',
  now(),
  now()
from _reset_list_users u
cross join (
  values
    ('Favorites', 'My favorite restaurants', 'heart'),
    ('Visited', 'Restaurants I have visited', 'check'),
    ('Want to Go', 'Restaurants I want to try', 'bookmark')
) as d(title, description, icon)
where u.user_id is not null;

select public.update_user_counts();

commit;
