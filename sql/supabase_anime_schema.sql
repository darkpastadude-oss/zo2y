begin;

create extension if not exists "pgcrypto";

-- =========================
-- Tables
-- =========================

create table if not exists public.anime_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text default '',
  is_public boolean default false,
  list_kind text default 'anime',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anime_lists add column if not exists user_id uuid;
alter table public.anime_lists add column if not exists title text;
alter table public.anime_lists add column if not exists icon text;
alter table public.anime_lists add column if not exists description text default '';
alter table public.anime_lists add column if not exists is_public boolean default false;
alter table public.anime_lists add column if not exists list_kind text default 'anime';
alter table public.anime_lists add column if not exists created_at timestamptz default now();
alter table public.anime_lists add column if not exists updated_at timestamptz default now();

update public.anime_lists
set description = coalesce(description, ''),
    is_public = coalesce(is_public, false),
    list_kind = coalesce(nullif(trim(list_kind), ''), 'anime'),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now())
where description is null
   or is_public is null
   or list_kind is null
   or created_at is null
   or updated_at is null;

alter table public.anime_lists alter column description set default '';
alter table public.anime_lists alter column is_public set default false;
alter table public.anime_lists alter column list_kind set default 'anime';
alter table public.anime_lists alter column created_at set default now();
alter table public.anime_lists alter column updated_at set default now();

create table if not exists public.anime_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id bigint not null,
  list_type text,
  list_id uuid null references public.anime_lists(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.anime_list_items add column if not exists user_id uuid;
alter table public.anime_list_items add column if not exists anime_id bigint;
alter table public.anime_list_items add column if not exists list_type text;
alter table public.anime_list_items add column if not exists list_id uuid;
alter table public.anime_list_items add column if not exists created_at timestamptz default now();

update public.anime_list_items
set created_at = coalesce(created_at, now())
where created_at is null;

alter table public.anime_list_items alter column created_at set default now();

create table if not exists public.anime_reviews (
  id uuid primary key default gen_random_uuid(),
  anime_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anime_reviews add column if not exists anime_id bigint;
alter table public.anime_reviews add column if not exists user_id uuid;
alter table public.anime_reviews add column if not exists rating integer;
alter table public.anime_reviews add column if not exists comment text;
alter table public.anime_reviews add column if not exists created_at timestamptz default now();
alter table public.anime_reviews add column if not exists updated_at timestamptz default now();

update public.anime_reviews
set created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now())
where created_at is null
   or updated_at is null;

alter table public.anime_reviews alter column created_at set default now();
alter table public.anime_reviews alter column updated_at set default now();

-- Ensure foreign keys exist when table was created from an older draft.
do $$
begin
  if to_regclass('public.anime_lists') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'anime_lists_user_id_fkey'
        and conrelid = 'public.anime_lists'::regclass
    ) then
      alter table public.anime_lists
        add constraint anime_lists_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;
  end if;

  if to_regclass('public.anime_list_items') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'anime_list_items_user_id_fkey'
        and conrelid = 'public.anime_list_items'::regclass
    ) then
      alter table public.anime_list_items
        add constraint anime_list_items_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conname = 'anime_list_items_list_id_fkey'
        and conrelid = 'public.anime_list_items'::regclass
    ) then
      alter table public.anime_list_items
        add constraint anime_list_items_list_id_fkey
        foreign key (list_id) references public.anime_lists(id) on delete cascade;
    end if;
  end if;

  if to_regclass('public.anime_reviews') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'anime_reviews_user_id_fkey'
        and conrelid = 'public.anime_reviews'::regclass
    ) then
      alter table public.anime_reviews
        add constraint anime_reviews_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;
  end if;
end
$$;

-- =========================
-- Migration from old shared TV list tables (best-effort)
-- =========================

do $$
declare
  has_tv_lists boolean := to_regclass('public.tv_lists') is not null;
  has_tv_items boolean := to_regclass('public.tv_list_items') is not null;
  has_tv_list_kind boolean := false;
  has_tv_icon boolean := false;
  filter_sql text;
begin
  if has_tv_lists then
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'tv_lists'
        and column_name = 'list_kind'
    ) into has_tv_list_kind;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'tv_lists'
        and column_name = 'icon'
    ) into has_tv_icon;

    if has_tv_list_kind and has_tv_icon then
      filter_sql := '(lower(coalesce(tl.list_kind::text, '''')) = ''anime'' or coalesce(tl.icon::text, '''') ilike ''%dragon%'')';
    elsif has_tv_list_kind then
      filter_sql := 'lower(coalesce(tl.list_kind::text, '''')) = ''anime''';
    elsif has_tv_icon then
      filter_sql := 'coalesce(tl.icon::text, '''') ilike ''%dragon%''';
    else
      filter_sql := null;
    end if;

    if filter_sql is not null then
      execute format($sql$
        insert into public.anime_lists (
          id, user_id, title, icon, description, is_public, list_kind, created_at, updated_at
        )
        select
          tl.id,
          tl.user_id,
          tl.title,
          coalesce(nullif(tl.icon, ''), 'fas fa-dragon'),
          '',
          false,
          'anime',
          coalesce(tl.created_at, now()),
          now()
        from public.tv_lists tl
        where %s
        on conflict (id) do update
        set icon = excluded.icon,
            list_kind = 'anime',
            updated_at = now()
      $sql$, filter_sql);

      if has_tv_items then
        insert into public.anime_list_items (user_id, anime_id, list_type, list_id, created_at)
        select
          tli.user_id,
          tli.tv_id,
          tli.list_type,
          tli.list_id,
          coalesce(tli.created_at, now())
        from public.tv_list_items tli
        join public.anime_lists al
          on al.id = tli.list_id
        on conflict do nothing;
      end if;
    end if;
  end if;

  -- Migrate default list rows that can be confidently identified as anime via anime_reviews.
  if has_tv_items and to_regclass('public.anime_reviews') is not null then
    insert into public.anime_list_items (user_id, anime_id, list_type, list_id, created_at)
    select
      tli.user_id,
      tli.tv_id,
      tli.list_type,
      null,
      coalesce(tli.created_at, now())
    from public.tv_list_items tli
    where tli.list_id is null
      and tli.list_type in ('favorites', 'watched', 'watchlist')
      and exists (
        select 1
        from public.anime_reviews ar
        where ar.user_id = tli.user_id
          and ar.anime_id = tli.tv_id
      )
    on conflict do nothing;
  end if;
end
$$;

-- =========================
-- Indexes
-- =========================

create index if not exists idx_anime_lists_user on public.anime_lists(user_id);
create index if not exists idx_anime_list_items_user on public.anime_list_items(user_id);
create index if not exists idx_anime_list_items_anime on public.anime_list_items(anime_id);
create index if not exists idx_anime_list_items_list_id on public.anime_list_items(list_id);
create index if not exists idx_anime_reviews_anime on public.anime_reviews(anime_id);
create index if not exists idx_anime_reviews_user on public.anime_reviews(user_id);
create index if not exists idx_anime_reviews_created_at on public.anime_reviews(created_at desc);

drop index if exists public.ux_anime_lists_user_title_lower;
create unique index ux_anime_lists_user_title_lower
  on public.anime_lists(user_id, lower(title));

drop index if exists public.ux_anime_list_items_unique;
create unique index ux_anime_list_items_unique
  on public.anime_list_items(user_id, anime_id, coalesce(list_type, ''), coalesce(list_id::text, ''));

-- =========================
-- Triggers
-- =========================

create or replace function public.touch_anime_lists_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists anime_lists_touch_updated_at on public.anime_lists;
create trigger anime_lists_touch_updated_at
before update on public.anime_lists
for each row
execute function public.touch_anime_lists_updated_at();

create or replace function public.touch_anime_reviews_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists anime_reviews_touch_updated_at on public.anime_reviews;
create trigger anime_reviews_touch_updated_at
before update on public.anime_reviews
for each row
execute function public.touch_anime_reviews_updated_at();

-- =========================
-- RLS + Policies
-- =========================

alter table public.anime_lists enable row level security;
alter table public.anime_list_items enable row level security;
alter table public.anime_reviews enable row level security;

drop policy if exists "Public select on anime_lists" on public.anime_lists;
drop policy if exists "Insert own anime_lists" on public.anime_lists;
drop policy if exists "Update own anime_lists" on public.anime_lists;
drop policy if exists "Delete own anime_lists" on public.anime_lists;

create policy "Public select on anime_lists"
on public.anime_lists
for select
using (true);

create policy "Insert own anime_lists"
on public.anime_lists
for insert
with check (user_id = auth.uid());

create policy "Update own anime_lists"
on public.anime_lists
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Delete own anime_lists"
on public.anime_lists
for delete
using (user_id = auth.uid());

drop policy if exists "Public select on anime_list_items" on public.anime_list_items;
drop policy if exists "Insert own anime_list_items" on public.anime_list_items;
drop policy if exists "Update own anime_list_items" on public.anime_list_items;
drop policy if exists "Delete own anime_list_items" on public.anime_list_items;

create policy "Public select on anime_list_items"
on public.anime_list_items
for select
using (true);

create policy "Insert own anime_list_items"
on public.anime_list_items
for insert
with check (
  user_id = auth.uid()
  and (
    list_id is null
    or exists (
      select 1
      from public.anime_lists l
      where l.id = anime_list_items.list_id
        and l.user_id = auth.uid()
    )
  )
);

create policy "Update own anime_list_items"
on public.anime_list_items
for update
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
  and (
    list_id is null
    or exists (
      select 1
      from public.anime_lists l
      where l.id = anime_list_items.list_id
        and l.user_id = auth.uid()
    )
  )
);

create policy "Delete own anime_list_items"
on public.anime_list_items
for delete
using (user_id = auth.uid());

drop policy if exists "Public select on anime_reviews" on public.anime_reviews;
drop policy if exists "Insert own anime_reviews" on public.anime_reviews;
drop policy if exists "Update own anime_reviews" on public.anime_reviews;
drop policy if exists "Delete own anime_reviews" on public.anime_reviews;

create policy "Public select on anime_reviews"
on public.anime_reviews
for select
using (true);

create policy "Insert own anime_reviews"
on public.anime_reviews
for insert
with check (user_id = auth.uid());

create policy "Update own anime_reviews"
on public.anime_reviews
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Delete own anime_reviews"
on public.anime_reviews
for delete
using (user_id = auth.uid());

-- =========================
-- Compatibility patches for shared infra tables
-- =========================

-- Allow anime media type in collaboration + tier tables.
do $$
begin
  if to_regclass('public.list_collaborators') is not null then
    alter table public.list_collaborators
      drop constraint if exists list_collaborators_media_type_check;
    alter table public.list_collaborators
      add constraint list_collaborators_media_type_check
      check (media_type in ('restaurant', 'movie', 'anime', 'tv', 'game', 'book', 'music'));
  end if;

  if to_regclass('public.list_tier_meta') is not null then
    alter table public.list_tier_meta
      drop constraint if exists list_tier_meta_media_type_check;
    alter table public.list_tier_meta
      add constraint list_tier_meta_media_type_check
      check (media_type in ('movie', 'anime', 'tv', 'game', 'book', 'music', 'restaurant'));
  end if;

  if to_regclass('public.list_tier_ranks') is not null then
    alter table public.list_tier_ranks
      drop constraint if exists list_tier_ranks_media_type_check;
    alter table public.list_tier_ranks
      add constraint list_tier_ranks_media_type_check
      check (media_type in ('movie', 'anime', 'tv', 'game', 'book', 'music', 'restaurant'));
  end if;
end
$$;

-- Update collaborative helper functions to understand anime tables.
create or replace function public.zo2y_custom_list_owner_matches(
  p_media_type text,
  p_list_id text,
  p_owner_id uuid
)
returns boolean
language plpgsql
stable
as $$
declare
  safe_media_type text := lower(trim(coalesce(p_media_type, '')));
  safe_list_id text := trim(coalesce(p_list_id, ''));
  matches_owner boolean := false;
begin
  if p_owner_id is null or safe_list_id = '' then
    return false;
  end if;

  case safe_media_type
    when 'movie' then
      if to_regclass('public.movie_lists') is null then return false; end if;
      select exists (
        select 1 from public.movie_lists l
        where l.id::text = safe_list_id and l.user_id = p_owner_id
      ) into matches_owner;
    when 'anime' then
      if to_regclass('public.anime_lists') is null then return false; end if;
      select exists (
        select 1 from public.anime_lists l
        where l.id::text = safe_list_id and l.user_id = p_owner_id
      ) into matches_owner;
    when 'tv' then
      if to_regclass('public.tv_lists') is null then return false; end if;
      select exists (
        select 1 from public.tv_lists l
        where l.id::text = safe_list_id and l.user_id = p_owner_id
      ) into matches_owner;
    when 'game' then
      if to_regclass('public.game_lists') is null then return false; end if;
      select exists (
        select 1 from public.game_lists l
        where l.id::text = safe_list_id and l.user_id = p_owner_id
      ) into matches_owner;
    when 'book' then
      if to_regclass('public.book_lists') is null then return false; end if;
      select exists (
        select 1 from public.book_lists l
        where l.id::text = safe_list_id and l.user_id = p_owner_id
      ) into matches_owner;
    when 'music' then
      if to_regclass('public.music_lists') is null then return false; end if;
      select exists (
        select 1 from public.music_lists l
        where l.id::text = safe_list_id and l.user_id = p_owner_id
      ) into matches_owner;
    when 'restaurant' then
      if to_regclass('public.lists') is null then return false; end if;
      select exists (
        select 1 from public.lists l
        where l.id::text = safe_list_id and l.user_id = p_owner_id
      ) into matches_owner;
    else
      return false;
  end case;

  return coalesce(matches_owner, false);
end;
$$;

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
    when 'anime' then list_table := 'anime_lists';
    when 'tv' then list_table := 'tv_lists';
    when 'game' then list_table := 'game_lists';
    when 'book' then list_table := 'book_lists';
    when 'music' then list_table := 'music_lists';
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
        l.description,
        l.icon,
        l.created_at,
        l.updated_at,
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
        l.description,
        l.icon,
        l.created_at,
        l.updated_at,
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

commit;
