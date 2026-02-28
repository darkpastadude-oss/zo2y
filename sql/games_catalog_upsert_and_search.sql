-- Games catalog migration for Zo2y
-- Purpose:
-- 1) Keep game metadata in Supabase (title, description, cover art, release, ratings)
-- 2) Support backend-only imports with dedupe-safe upserts
-- 3) Enable fast title/description search
--
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Canonical game metadata table
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id bigint primary key,
  source text not null default 'igdb',
  igdb_id bigint,
  rawg_id bigint,
  slug text,
  title text not null,
  description text,
  cover_url text,
  hero_url text,
  release_date date,
  rating numeric(5,2),
  rating_count integer,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.games is 'Canonical cached game metadata used by frontend/list pages.';
comment on column public.games.cover_url is 'Primary cover/poster art URL.';
comment on column public.games.hero_url is 'Optional hero/backdrop art URL.';
comment on column public.games.extra is 'Raw provider payload subset for future fields.';

-- Optional id-source uniqueness helpers for upstream reconciliation.
create unique index if not exists ux_games_igdb_id on public.games (igdb_id) where igdb_id is not null;
create unique index if not exists ux_games_rawg_id on public.games (rawg_id) where rawg_id is not null;

-- Query/search indexes.
create index if not exists idx_games_release_date on public.games (release_date desc);
create index if not exists idx_games_rating on public.games (rating desc);
create index if not exists idx_games_rating_count on public.games (rating_count desc);
create index if not exists idx_games_title_tsv
  on public.games
  using gin (to_tsvector('english', coalesce(title, '')));
create index if not exists idx_games_title_desc_tsv
  on public.games
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
create index if not exists idx_games_title_trgm
  on public.games
  using gin (title gin_trgm_ops);

-- Keep updated_at current on writes.
create or replace function public.touch_games_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_touch_updated_at on public.games;
create trigger games_touch_updated_at
before update on public.games
for each row
execute function public.touch_games_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: everyone can read games, backend service role writes
-- ---------------------------------------------------------------------------
alter table public.games enable row level security;

drop policy if exists "Public select on games" on public.games;
create policy "Public select on games"
on public.games
for select
using (true);

-- NOTE: No insert/update/delete policy is added intentionally.
-- With RLS enabled, clients cannot mutate rows unless you add policies.
-- Backend with SERVICE ROLE key bypasses RLS and can still write.

-- ---------------------------------------------------------------------------
-- Upsert helper for backend import route (dedupe-safe)
-- ---------------------------------------------------------------------------
create or replace function public.upsert_game_catalog(
  p_id bigint,
  p_title text,
  p_description text default null,
  p_cover_url text default null,
  p_release_date date default null,
  p_rating numeric default null,
  p_rating_count integer default null,
  p_source text default 'igdb',
  p_igdb_id bigint default null,
  p_rawg_id bigint default null,
  p_slug text default null,
  p_hero_url text default null,
  p_extra jsonb default '{}'::jsonb
)
returns public.games
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.games;
begin
  insert into public.games (
    id,
    source,
    igdb_id,
    rawg_id,
    slug,
    title,
    description,
    cover_url,
    hero_url,
    release_date,
    rating,
    rating_count,
    extra
  )
  values (
    p_id,
    coalesce(nullif(trim(p_source), ''), 'igdb'),
    p_igdb_id,
    p_rawg_id,
    nullif(trim(p_slug), ''),
    coalesce(nullif(trim(p_title), ''), 'Untitled'),
    nullif(trim(p_description), ''),
    nullif(trim(p_cover_url), ''),
    nullif(trim(p_hero_url), ''),
    p_release_date,
    p_rating,
    p_rating_count,
    coalesce(p_extra, '{}'::jsonb)
  )
  on conflict (id) do update
  set
    source = coalesce(nullif(trim(excluded.source), ''), games.source),
    igdb_id = coalesce(excluded.igdb_id, games.igdb_id),
    rawg_id = coalesce(excluded.rawg_id, games.rawg_id),
    slug = coalesce(nullif(trim(excluded.slug), ''), games.slug),
    title = coalesce(nullif(trim(excluded.title), ''), games.title),
    description = coalesce(nullif(trim(excluded.description), ''), games.description),
    cover_url = coalesce(nullif(trim(excluded.cover_url), ''), games.cover_url),
    hero_url = coalesce(nullif(trim(excluded.hero_url), ''), games.hero_url),
    release_date = coalesce(excluded.release_date, games.release_date),
    rating = coalesce(excluded.rating, games.rating),
    rating_count = coalesce(excluded.rating_count, games.rating_count),
    extra = coalesce(excluded.extra, games.extra),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.upsert_game_catalog(
  bigint, text, text, text, date, numeric, integer, text, bigint, bigint, text, text, jsonb
) from public;

revoke all on function public.upsert_game_catalog(
  bigint, text, text, text, date, numeric, integer, text, bigint, bigint, text, text, jsonb
) from anon, authenticated;

-- Let only service_role call this helper directly.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.upsert_game_catalog(
      bigint, text, text, text, date, numeric, integer, text, bigint, bigint, text, text, jsonb
    ) to service_role;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Compatibility checks for existing game list/review tables
-- ---------------------------------------------------------------------------
-- Ensure existing game relation tables keep their expected bigint IDs.
alter table public.game_list_items
  alter column game_id type bigint using game_id::bigint;

alter table public.game_reviews
  alter column game_id type bigint using game_id::bigint;

-- Keep lookup speed fast for joins from list/review -> games.
create index if not exists idx_game_list_items_game on public.game_list_items (game_id);
create index if not exists idx_game_reviews_game on public.game_reviews (game_id);

-- Optional FK (commented out intentionally):
-- Enable this only after backend guarantees every saved/reviewed game_id exists in public.games.
-- alter table public.game_list_items
--   add constraint fk_game_list_items_games
--   foreign key (game_id) references public.games(id);
-- alter table public.game_reviews
--   add constraint fk_game_reviews_games
--   foreign key (game_id) references public.games(id);
