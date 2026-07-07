-- ============================================================
-- 100_unified_list_items.sql
-- Unified list_items + reviews schema.
-- Run this ONCE in Supabase SQL editor.
-- ============================================================

begin;

-- ============================================================
-- STEP 1: Create unified tables
-- ============================================================

-- Drop if previously created without all columns (safe: data is migrated from legacy tables)
drop table if exists public.user_lists cascade;
drop table if exists public.list_items cascade;
drop table if exists public.reviews cascade;

-- Unified custom lists (replaces movie_lists, tv_lists, anime_lists, game_lists,
-- book_lists, music_lists, artist_lists, travel_lists, fashion_lists, food_lists,
-- car_lists, sports_lists, lists)
create table public.user_lists (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  media_type     text not null,
  name           text not null,
  description    text default '',
  icon           text,
  is_public      boolean default false,
  display_order  integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_user_lists_user on public.user_lists(user_id);
create index if not exists idx_user_lists_media_type on public.user_lists(media_type);
create unique index if not exists ux_user_lists_user_media_name
  on public.user_lists(user_id, media_type, lower(name));

-- Unified list items (replaces all *_list_items + user_favorite_teams)
create table public.list_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  media_type     text not null,
  item_id        text not null,
  list_type      text,
  list_id        uuid references public.user_lists(id) on delete cascade,
  title          text,
  subtitle       text,
  image_url      text,
  notes          text,
  rating         numeric(2,1) check (rating >= 0 and rating <= 5),
  progress       numeric check (progress >= 0),
  position       integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint list_items_xor check (
    (list_id is null and list_type is not null)
    or (list_id is not null and list_type is null)
  )
);

-- Default list items: one item per user/type/ID/list_type
create unique index if not exists ux_list_items_default
  on public.list_items (user_id, media_type, item_id, list_type)
  where list_id is null;

-- Custom list items: one item per list/type/ID
create unique index if not exists ux_list_items_custom
  on public.list_items (list_id, media_type, item_id)
  where list_id is not null and list_type is null;

create index if not exists idx_list_items_user on public.list_items(user_id);
create index if not exists idx_list_items_media_type on public.list_items(media_type);
create index if not exists idx_list_items_item_id on public.list_items(item_id);
create index if not exists idx_list_items_list_id on public.list_items(list_id);

-- Unified reviews (replaces all *_reviews)
create table public.reviews (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  media_type         text not null,
  item_id            text not null,
  title              text,
  body               text,
  rating             integer not null check (rating between 1 and 5),
  contains_spoilers  boolean default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create unique index if not exists ux_reviews_user_item
  on public.reviews (user_id, media_type, item_id);

create index if not exists idx_reviews_user on public.reviews(user_id);
create index if not exists idx_reviews_media_type on public.reviews(media_type);
create index if not exists idx_reviews_item_id on public.reviews(item_id);

-- ============================================================
-- STEP 2: Touch updated_at trigger for unified tables
-- ============================================================

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_lists_touch_updated_at on public.user_lists;
create trigger user_lists_touch_updated_at
  before update on public.user_lists
  for each row execute function public.touch_updated_at();

drop trigger if exists list_items_touch_updated_at on public.list_items;
create trigger list_items_touch_updated_at
  before update on public.list_items
  for each row execute function public.touch_updated_at();

drop trigger if exists reviews_touch_updated_at on public.reviews;
create trigger reviews_touch_updated_at
  before update on public.reviews
  for each row execute function public.touch_updated_at();

-- ============================================================
-- STEP 3: RLS policies
-- ============================================================

alter table public.user_lists enable row level security;
alter table public.list_items enable row level security;
alter table public.reviews enable row level security;

-- user_lists
drop policy if exists "Public select on user_lists" on public.user_lists;
drop policy if exists "Insert own user_lists" on public.user_lists;
drop policy if exists "Update own user_lists" on public.user_lists;
drop policy if exists "Delete own user_lists" on public.user_lists;
create policy "Public select on user_lists" on public.user_lists for select using (true);
create policy "Insert own user_lists" on public.user_lists for insert with check (user_id = auth.uid());
create policy "Update own user_lists" on public.user_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own user_lists" on public.user_lists for delete using (user_id = auth.uid());

-- list_items
drop policy if exists "Public select on list_items" on public.list_items;
drop policy if exists "Insert own list_items" on public.list_items;
drop policy if exists "Update own list_items" on public.list_items;
drop policy if exists "Delete own list_items" on public.list_items;
create policy "Public select on list_items" on public.list_items for select using (true);
create policy "Insert own list_items" on public.list_items for insert with check (user_id = auth.uid());
create policy "Update own list_items" on public.list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own list_items" on public.list_items for delete using (user_id = auth.uid());

-- reviews
drop policy if exists "Public select on reviews" on public.reviews;
drop policy if exists "Insert own reviews" on public.reviews;
drop policy if exists "Update own reviews" on public.reviews;
drop policy if exists "Delete own reviews" on public.reviews;
create policy "Public select on reviews" on public.reviews for select using (true);
create policy "Insert own reviews" on public.reviews for insert with check (user_id = auth.uid());
create policy "Update own reviews" on public.reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own reviews" on public.reviews for delete using (user_id = auth.uid());

-- ============================================================
-- STEP 4: Migrate data from legacy tables into unified tables
-- Every INSERT is wrapped in a table-existence check so missing
-- legacy tables are silently skipped.
-- ============================================================

-- --- user_lists: copy from per-type *_lists tables ---

do $$ begin
  if to_regclass('public.movie_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, icon, created_at)
    select id, user_id, 'movie', title, icon, created_at from public.movie_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.tv_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, icon, created_at)
    select id, user_id, 'tv', title, icon, created_at from public.tv_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.anime_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, description, icon, is_public, created_at, updated_at)
    select id, user_id, 'anime', title, coalesce(description, ''), icon, coalesce(is_public, false), created_at, coalesce(updated_at, now()) from public.anime_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.game_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, icon, created_at)
    select id, user_id, 'game', title, icon, created_at from public.game_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.book_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, icon, created_at)
    select id, user_id, 'book', title, icon, created_at from public.book_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.music_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, icon, created_at)
    select id, user_id, 'music', title, icon, created_at from public.music_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.travel_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, icon, created_at)
    select id, user_id, 'travel', title, icon, created_at from public.travel_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.fashion_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, description, icon, created_at)
    select id, user_id, 'fashion', title, coalesce(description, ''), icon, created_at from public.fashion_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.food_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, description, icon, created_at)
    select id, user_id, 'food', title, coalesce(description, ''), icon, created_at from public.food_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.car_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, description, icon, created_at)
    select id, user_id, 'car', title, coalesce(description, ''), icon, created_at from public.car_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.sports_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, icon, created_at)
    select id, user_id, 'sports', title, icon, created_at from public.sports_lists on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.artist_lists') is not null then
    insert into public.user_lists (id, user_id, media_type, name, icon, created_at)
    select id, user_id, 'music', title, icon, created_at from public.artist_lists on conflict do nothing;
  end if;
end $$;

-- --- list_items: copy from per-type *_list_items tables ---

do $$ begin
  if to_regclass('public.movie_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'movie', movie_id::text, list_type, list_id, created_at from public.movie_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.tv_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'tv', tv_id::text, list_type, list_id, created_at from public.tv_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.anime_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'anime', anime_id::text, list_type, list_id, created_at from public.anime_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.game_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'game', game_id::text, list_type, list_id, created_at from public.game_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.book_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'book', book_id, list_type, list_id, created_at from public.book_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.music_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'music', track_id, list_type, list_id, created_at from public.music_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.travel_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'travel', country_code, list_type, list_id, created_at from public.travel_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.fashion_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'fashion', brand_id::text, list_type, list_id, created_at from public.fashion_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.food_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'food', brand_id::text, list_type, list_id, created_at from public.food_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.car_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'car', brand_id::text, list_type, list_id, created_at from public.car_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.user_favorite_teams') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'sports', team_id, 'favorites', null, created_at from public.user_favorite_teams on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.sports_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'sports', team_id, list_type, list_id, created_at from public.sports_list_items on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.artist_list_items') is not null then
    insert into public.list_items (user_id, media_type, item_id, list_type, list_id, created_at)
    select user_id, 'music', artist_id, list_type, list_id, created_at from public.artist_list_items on conflict do nothing;
  end if;
end $$;

-- --- reviews: copy from per-type *_reviews tables ---

do $$ begin
  if to_regclass('public.movie_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, rating, body, created_at, updated_at)
    select user_id, 'movie', movie_id::text, rating, comment, created_at, updated_at from public.movie_reviews on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.tv_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, rating, body, created_at, updated_at)
    select user_id, 'tv', tv_id::text, rating, comment, created_at, updated_at from public.tv_reviews on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.anime_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, rating, body, created_at, updated_at)
    select user_id, 'anime', anime_id::text, rating, comment, created_at, updated_at from public.anime_reviews on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.game_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, rating, body, created_at, updated_at)
    select user_id, 'game', game_id::text, rating, comment, created_at, updated_at from public.game_reviews on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.book_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, rating, body, created_at, updated_at)
    select user_id, 'book', book_id, rating, comment, created_at, updated_at from public.book_reviews on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.music_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, rating, body, created_at, updated_at)
    select user_id, 'music', track_id, rating, comment, created_at, updated_at from public.music_reviews on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.travel_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, rating, body, created_at, updated_at)
    select user_id, 'travel', country_code, rating, comment, created_at, updated_at from public.travel_reviews on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.fashion_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, rating, body, created_at, updated_at)
    select user_id, 'fashion', brand_id::text, rating, review_text, created_at, updated_at from public.fashion_reviews on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.food_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, rating, body, created_at, updated_at)
    select user_id, 'food', brand_id::text, rating, review_text, created_at, updated_at from public.food_reviews on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.car_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, rating, body, created_at, updated_at)
    select user_id, 'car', brand_id::text, rating, review_text, created_at, updated_at from public.car_reviews on conflict do nothing;
  end if;
end $$;

do $$ begin
  if to_regclass('public.user_album_reviews') is not null then
    insert into public.reviews (user_id, media_type, item_id, title, rating, body, created_at, updated_at)
    select user_id, 'music', album_id, 'Album Review', rating, comment, created_at, updated_at from public.user_album_reviews on conflict do nothing;
  end if;
end $$;

-- ============================================================
-- STEP 5: Update list_collaborators to reference user_lists UUID
-- ============================================================

-- Add list_uuid column, backfill from user_lists, then drop old text column
do $$ begin
  if to_regclass('public.list_collaborators') is not null then
    -- Add new UUID column if not present
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'list_collaborators' and column_name = 'list_uuid'
    ) then
      alter table public.list_collaborators add column list_uuid uuid;
    end if;

    -- Backfill list_uuid from user_lists
    update public.list_collaborators lc
    set list_uuid = ul.id
    from public.user_lists ul
    where lc.list_uuid is null
      and lc.list_id = ul.id::text
      and lc.media_type = ul.media_type;

    -- Add NOT NULL + FK after backfill
    alter table public.list_collaborators alter column list_uuid set not null;
    alter table public.list_collaborators
      add constraint list_collaborators_list_uuid_fkey
      foreign key (list_uuid) references public.user_lists(id) on delete cascade;

    -- Recreate unique index to use list_uuid
    drop index if exists public.ux_list_collaborators_unique;
    create unique index ux_list_collaborators_unique
      on public.list_collaborators(media_type, list_uuid, collaborator_id);
  end if;
end $$;

-- ============================================================
-- STEP 6: Update list_tier_meta to reference user_lists UUID
-- ============================================================

do $$ begin
  if to_regclass('public.list_tier_meta') is not null then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'list_tier_meta' and column_name = 'list_uuid'
    ) then
      alter table public.list_tier_meta add column list_uuid uuid;
    end if;

    update public.list_tier_meta lt
    set list_uuid = ul.id
    from public.user_lists ul
    where lt.list_uuid is null
      and lt.list_id = ul.id::text
      and lt.media_type = ul.media_type;

    alter table public.list_tier_meta alter column list_uuid set not null;
    alter table public.list_tier_meta
      add constraint list_tier_meta_list_uuid_fkey
      foreign key (list_uuid) references public.user_lists(id) on delete cascade;

    drop index if exists public.ux_list_tier_meta_unique;
    create unique index ux_list_tier_meta_unique
      on public.list_tier_meta(user_id, media_type, list_uuid, list_kind);
  end if;
end $$;

-- ============================================================
-- STEP 7: Update activity feed triggers for unified tables
-- ============================================================

-- New list_item activity trigger (fires on unified list_items)
create or replace function public.log_list_items_activity_iud()
returns trigger language plpgsql as $$
declare
  v_event_type text;
  v_payload jsonb;
begin
  v_event_type := case tg_op
    when 'INSERT' then 'list_add'
    when 'DELETE' then 'list_remove'
    else null
  end;
  if v_event_type is null then return coalesce(new, old); end if;

  v_payload := case when tg_op = 'INSERT' then to_jsonb(new) else to_jsonb(old) end;

  insert into public.user_activity_feed (
    actor_id, event_type, media_type, item_id, list_type, list_id, metadata
  ) values (
    (v_payload->>'user_id')::uuid,
    v_event_type,
    v_payload->>'media_type',
    v_payload->>'item_id',
    v_payload->>'list_type',
    (v_payload->>'list_id')::uuid,
    jsonb_build_object('source_table', 'list_items', 'source_pk', v_payload->>'id')
  );
  return coalesce(new, old);
end;
$$;

-- New custom list activity trigger (fires on unified user_lists)
create or replace function public.log_user_lists_activity_iud()
returns trigger language plpgsql as $$
declare
  v_event_type text;
  v_payload jsonb;
begin
  v_event_type := case tg_op
    when 'INSERT' then 'list_create'
    when 'DELETE' then 'list_delete'
    else null
  end;
  if v_event_type is null then return coalesce(new, old); end if;

  v_payload := case when tg_op = 'INSERT' then to_jsonb(new) else to_jsonb(old) end;

  insert into public.user_activity_feed (
    actor_id, event_type, media_type, list_id, metadata
  ) values (
    (v_payload->>'user_id')::uuid,
    v_event_type,
    v_payload->>'media_type',
    (v_payload->>'id')::uuid,
    jsonb_build_object(
      'source_table', 'user_lists',
      'source_pk', v_payload->>'id',
      'list_title', v_payload->>'name'
    )
  );
  return coalesce(new, old);
end;
$$;

-- New review activity trigger (fires on unified reviews)
create or replace function public.log_reviews_activity_iud()
returns trigger language plpgsql as $$
declare
  v_event_type text;
  v_payload jsonb;
begin
  v_event_type := case tg_op
    when 'INSERT' then 'review_add'
    when 'UPDATE' then 'review_edit'
    when 'DELETE' then 'review_delete'
    else null
  end;
  if v_event_type is null then return coalesce(new, old); end if;

  v_payload := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else to_jsonb(old) end;

  insert into public.user_activity_feed (
    actor_id, event_type, media_type, item_id, rating, review_text, metadata
  ) values (
    (v_payload->>'user_id')::uuid,
    v_event_type,
    v_payload->>'media_type',
    v_payload->>'item_id',
    (v_payload->>'rating')::numeric(3,1),
    v_payload->>'body',
    jsonb_build_object('source_table', 'reviews', 'source_pk', v_payload->>'id')
  );
  return coalesce(new, old);
end;
$$;

-- Attach triggers to unified tables
drop trigger if exists trg_list_items_activity on public.list_items;
create trigger trg_list_items_activity
  after insert or delete on public.list_items
  for each row execute function public.log_list_items_activity_iud();

drop trigger if exists trg_user_lists_activity on public.user_lists;
create trigger trg_user_lists_activity
  after insert or delete on public.user_lists
  for each row execute function public.log_user_lists_activity_iud();

drop trigger if exists trg_reviews_activity on public.reviews;
create trigger trg_reviews_activity
  after insert or update or delete on public.reviews
  for each row execute function public.log_reviews_activity_iud();

-- ============================================================
-- STEP 8: Ensure Supabase REST picks up new tables
-- ============================================================

notify pgrst, 'reload schema';

commit;
