-- ============================================================
-- fix_unified_revert.sql
-- Run this ONCE in your Supabase SQL editor.
-- Drops all unified tables/views and recreates per-category tables.
-- ============================================================

begin;

-- ============================================================
-- STEP 1: Drop unified tables and views from the migration
-- ============================================================

-- Drop unified tables (if they still exist)
drop table if exists public.list_items cascade;
drop table if exists public.user_lists cascade;
drop table if exists public.list_collaborators cascade;
drop table if exists public.list_tier_meta cascade;

-- Drop views that conflict with per-category table names.
-- The unified migration may have turned some review tables into views.
do $$
declare
  rec record;
begin
  for rec in
    select table_name
    from information_schema.views
    where table_schema = 'public'
      and table_name in (
        'tv_reviews', 'movie_reviews', 'anime_reviews', 'game_reviews',
        'book_reviews', 'music_reviews', 'user_album_reviews',
        'fashion_reviews', 'food_reviews', 'car_reviews', 'travel_reviews'
      )
  loop
    execute format('drop view if exists public.%I cascade', rec.table_name);
    raise notice 'Dropped view: %', rec.table_name;
  end loop;
end;
$$;

-- Drop conflicting restaurant tables from unified migration
drop table if exists public.lists_restraunts cascade;
drop table if exists public.custom_list_items cascade;

-- ============================================================
-- STEP 2: Recreate per-category schema files
-- ============================================================

-- ---------- TV schema ----------
create extension if not exists "pgcrypto";

create table if not exists public.tv_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.tv_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tv_id bigint not null,
  list_type text,
  list_id uuid null references public.tv_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.tv_reviews (
  id uuid primary key default gen_random_uuid(),
  tv_id bigint not null,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tv_lists_user on public.tv_lists(user_id);
create index if not exists idx_tv_list_items_user on public.tv_list_items(user_id);
create index if not exists idx_tv_list_items_tv on public.tv_list_items(tv_id);
create index if not exists idx_tv_reviews_tv on public.tv_reviews(tv_id);
create index if not exists idx_tv_reviews_user on public.tv_reviews(user_id);

create unique index if not exists ux_tv_list_items_unique
  on public.tv_list_items (user_id, tv_id, list_type, list_id);

create or replace function public.touch_tv_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tv_reviews_touch_updated_at on public.tv_reviews;
create trigger tv_reviews_touch_updated_at
  before update on public.tv_reviews
  for each row
  execute function public.touch_tv_reviews_updated_at();

alter table public.tv_lists enable row level security;
alter table public.tv_list_items enable row level security;
alter table public.tv_reviews enable row level security;

drop policy if exists "Public select on tv_lists" on public.tv_lists;
drop policy if exists "Insert own tv_lists" on public.tv_lists;
drop policy if exists "Update own tv_lists" on public.tv_lists;
drop policy if exists "Delete own tv_lists" on public.tv_lists;
create policy "Public select on tv_lists" on public.tv_lists for select using (true);
create policy "Insert own tv_lists" on public.tv_lists for insert with check (user_id = auth.uid());
create policy "Update own tv_lists" on public.tv_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own tv_lists" on public.tv_lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on tv_list_items" on public.tv_list_items;
drop policy if exists "Insert own tv_list_items" on public.tv_list_items;
drop policy if exists "Update own tv_list_items" on public.tv_list_items;
drop policy if exists "Delete own tv_list_items" on public.tv_list_items;
create policy "Public select on tv_list_items" on public.tv_list_items for select using (true);
create policy "Insert own tv_list_items" on public.tv_list_items for insert with check (user_id = auth.uid());
create policy "Update own tv_list_items" on public.tv_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own tv_list_items" on public.tv_list_items for delete using (user_id = auth.uid());

drop policy if exists "Public select on tv_reviews" on public.tv_reviews;
drop policy if exists "Insert own tv_reviews" on public.tv_reviews;
drop policy if exists "Update own tv_reviews" on public.tv_reviews;
drop policy if exists "Delete own tv_reviews" on public.tv_reviews;
create policy "Public select on tv_reviews" on public.tv_reviews for select using (true);
create policy "Insert own tv_reviews" on public.tv_reviews for insert with check (user_id = auth.uid());
create policy "Update own tv_reviews" on public.tv_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own tv_reviews" on public.tv_reviews for delete using (user_id = auth.uid());

-- ---------- Movie schema ----------
create table if not exists public.movie_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.movie_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  movie_id bigint not null,
  list_type text,
  list_id uuid null references public.movie_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.movie_reviews (
  id uuid primary key default gen_random_uuid(),
  movie_id bigint not null,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_movie_lists_user on public.movie_lists(user_id);
create index if not exists idx_movie_list_items_user on public.movie_list_items(user_id);
create index if not exists idx_movie_list_items_movie on public.movie_list_items(movie_id);
create index if not exists idx_movie_reviews_movie on public.movie_reviews(movie_id);
create index if not exists idx_movie_reviews_user on public.movie_reviews(user_id);
create unique index if not exists ux_movie_list_items_unique
  on public.movie_list_items (user_id, movie_id, list_type, list_id);

create or replace function public.touch_movie_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists movie_reviews_touch_updated_at on public.movie_reviews;
create trigger movie_reviews_touch_updated_at
before update on public.movie_reviews
for each row
execute function public.touch_movie_reviews_updated_at();

alter table public.movie_lists enable row level security;
alter table public.movie_list_items enable row level security;
alter table public.movie_reviews enable row level security;

 drop policy if exists "Public select on movie_lists" on public.movie_lists;
 drop policy if exists "Insert own movie_lists" on public.movie_lists;
 drop policy if exists "Update own movie_lists" on public.movie_lists;
 drop policy if exists "Delete own movie_lists" on public.movie_lists;
create policy "Public select on movie_lists" on public.movie_lists for select using (true);
create policy "Insert own movie_lists" on public.movie_lists for insert with check (user_id = auth.uid());
create policy "Update own movie_lists" on public.movie_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own movie_lists" on public.movie_lists for delete using (user_id = auth.uid());

 drop policy if exists "Public select on movie_list_items" on public.movie_list_items;
 drop policy if exists "Insert own movie_list_items" on public.movie_list_items;
 drop policy if exists "Update own movie_list_items" on public.movie_list_items;
 drop policy if exists "Delete own movie_list_items" on public.movie_list_items;
create policy "Public select on movie_list_items" on public.movie_list_items for select using (true);
create policy "Insert own movie_list_items" on public.movie_list_items for insert with check (user_id = auth.uid());
create policy "Update own movie_list_items" on public.movie_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own movie_list_items" on public.movie_list_items for delete using (user_id = auth.uid());

 drop policy if exists "Public select on movie_reviews" on public.movie_reviews;
 drop policy if exists "Insert own movie_reviews" on public.movie_reviews;
 drop policy if exists "Update own movie_reviews" on public.movie_reviews;
 drop policy if exists "Delete own movie_reviews" on public.movie_reviews;
create policy "Public select on movie_reviews" on public.movie_reviews for select using (true);
create policy "Insert own movie_reviews" on public.movie_reviews for insert with check (user_id = auth.uid());
create policy "Update own movie_reviews" on public.movie_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own movie_reviews" on public.movie_reviews for delete using (user_id = auth.uid());

-- ---------- Sports lists schema ----------
create table if not exists public.sports_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.sports_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  team_id text not null,
  list_type text,
  list_id uuid null references public.sports_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_sports_lists_user on public.sports_lists(user_id);
create index if not exists idx_sports_list_items_user on public.sports_list_items(user_id);
create index if not exists idx_sports_list_items_team on public.sports_list_items(team_id);
create unique index if not exists ux_sports_list_items_unique
  on public.sports_list_items (user_id, team_id, list_type, list_id);

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

-- ---------- Sports user_favorite_teams (simple favorites, not custom lists) ----------
create table if not exists public.teams (
  id text primary key,
  name text not null,
  sport text,
  league text,
  logo_url text,
  banner_url text,
  stadium text,
  stadium_url text,
  jersey_url text,
  fanart_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_favorite_teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  team_id text not null references public.teams(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_teams_name on public.teams using gin (to_tsvector('english', coalesce(name, '')));
create index if not exists idx_user_favorite_teams_user on public.user_favorite_teams(user_id);
create index if not exists idx_user_favorite_teams_team on public.user_favorite_teams(team_id);
create unique index if not exists ux_user_favorite_teams on public.user_favorite_teams(user_id, team_id);

create or replace function public.touch_teams_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists teams_touch_updated_at on public.teams;
create trigger teams_touch_updated_at
before update on public.teams
for each row
execute function public.touch_teams_updated_at();

alter table public.teams enable row level security;
alter table public.user_favorite_teams enable row level security;

 drop policy if exists "Public select on teams" on public.teams;
 drop policy if exists "Insert teams" on public.teams;
 drop policy if exists "Update teams" on public.teams;
create policy "Public select on teams" on public.teams for select using (true);
create policy "Insert teams" on public.teams for insert with check (auth.uid() is not null);
create policy "Update teams" on public.teams for update using (auth.uid() is not null) with check (auth.uid() is not null);

 drop policy if exists "Public select on user_favorite_teams" on public.user_favorite_teams;
 drop policy if exists "Insert own user_favorite_teams" on public.user_favorite_teams;
 drop policy if exists "Delete own user_favorite_teams" on public.user_favorite_teams;
create policy "Public select on user_favorite_teams" on public.user_favorite_teams for select using (true);
create policy "Insert own user_favorite_teams" on public.user_favorite_teams for insert with check (user_id = auth.uid());
create policy "Delete own user_favorite_teams" on public.user_favorite_teams for delete using (user_id = auth.uid());

-- ---------- Collaborative list sharing tables ----------
create table if not exists public.list_collaborators (
  id uuid primary key default gen_random_uuid(),
  media_type text not null,
  list_id text not null,
  list_owner_id uuid not null,
  collaborator_id uuid not null,
  can_edit boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_list_collaborators_collaborator on public.list_collaborators(collaborator_id);
create index if not exists idx_list_collaborators_list on public.list_collaborators(media_type, list_id);
create unique index if not exists ux_list_collaborators_unique on public.list_collaborators(media_type, list_id, collaborator_id);

alter table public.list_collaborators enable row level security;

 drop policy if exists "Select own list_collaborators" on public.list_collaborators;
 drop policy if exists "Insert own list_collaborators" on public.list_collaborators;
 drop policy if exists "Delete own list_collaborators" on public.list_collaborators;
create policy "Select own list_collaborators" on public.list_collaborators for select using (collaborator_id = auth.uid() or list_owner_id = auth.uid());
create policy "Insert own list_collaborators" on public.list_collaborators for insert with check (list_owner_id = auth.uid());
create policy "Delete own list_collaborators" on public.list_collaborators for delete using (list_owner_id = auth.uid() or collaborator_id = auth.uid());

create table if not exists public.list_tier_meta (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  list_id text not null,
  media_type text not null,
  list_kind text not null,
  max_rank integer default 5,
  created_at timestamptz default now()
);

create index if not exists idx_list_tier_meta_user on public.list_tier_meta(user_id);
create index if not exists idx_list_tier_meta_list on public.list_tier_meta(media_type, list_id);
create unique index if not exists ux_list_tier_meta_unique on public.list_tier_meta(user_id, media_type, list_id, list_kind);

alter table public.list_tier_meta enable row level security;

 drop policy if exists "Select own list_tier_meta" on public.list_tier_meta;
 drop policy if exists "Insert own list_tier_meta" on public.list_tier_meta;
 drop policy if exists "Update own list_tier_meta" on public.list_tier_meta;
 drop policy if exists "Delete own list_tier_meta" on public.list_tier_meta;
create policy "Select own list_tier_meta" on public.list_tier_meta for select using (user_id = auth.uid());
create policy "Insert own list_tier_meta" on public.list_tier_meta for insert with check (user_id = auth.uid());
create policy "Update own list_tier_meta" on public.list_tier_meta for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own list_tier_meta" on public.list_tier_meta for delete using (user_id = auth.uid());

-- ---------- Game schema ----------
create table if not exists public.game_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.game_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  game_id bigint not null,
  list_type text,
  list_id uuid null references public.game_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.game_reviews (
  id uuid primary key default gen_random_uuid(),
  game_id bigint not null,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_game_lists_user on public.game_lists(user_id);
create index if not exists idx_game_list_items_user on public.game_list_items(user_id);
create index if not exists idx_game_list_items_game on public.game_list_items(game_id);
create index if not exists idx_game_reviews_game on public.game_reviews(game_id);
create index if not exists idx_game_reviews_user on public.game_reviews(user_id);

create unique index if not exists ux_game_list_items_unique
  on public.game_list_items (user_id, game_id, list_type, list_id);

create or replace function public.touch_game_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists game_reviews_touch_updated_at on public.game_reviews;
create trigger game_reviews_touch_updated_at
  before update on public.game_reviews
  for each row
  execute function public.touch_game_reviews_updated_at();

alter table public.game_lists enable row level security;
alter table public.game_list_items enable row level security;
alter table public.game_reviews enable row level security;

drop policy if exists "Public select on game_lists" on public.game_lists;
drop policy if exists "Insert own game_lists" on public.game_lists;
drop policy if exists "Update own game_lists" on public.game_lists;
drop policy if exists "Delete own game_lists" on public.game_lists;
create policy "Public select on game_lists" on public.game_lists for select using (true);
create policy "Insert own game_lists" on public.game_lists for insert with check (user_id = auth.uid());
create policy "Update own game_lists" on public.game_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own game_lists" on public.game_lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on game_list_items" on public.game_list_items;
drop policy if exists "Insert own game_list_items" on public.game_list_items;
drop policy if exists "Update own game_list_items" on public.game_list_items;
drop policy if exists "Delete own game_list_items" on public.game_list_items;
create policy "Public select on game_list_items" on public.game_list_items for select using (true);
create policy "Insert own game_list_items" on public.game_list_items for insert with check (user_id = auth.uid());
create policy "Update own game_list_items" on public.game_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own game_list_items" on public.game_list_items for delete using (user_id = auth.uid());

drop policy if exists "Public select on game_reviews" on public.game_reviews;
drop policy if exists "Insert own game_reviews" on public.game_reviews;
drop policy if exists "Update own game_reviews" on public.game_reviews;
drop policy if exists "Delete own game_reviews" on public.game_reviews;
create policy "Public select on game_reviews" on public.game_reviews for select using (true);
create policy "Insert own game_reviews" on public.game_reviews for insert with check (user_id = auth.uid());
create policy "Update own game_reviews" on public.game_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own game_reviews" on public.game_reviews for delete using (user_id = auth.uid());

-- ---------- Book schema ----------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS book_list_items CASCADE;
DROP TABLE IF EXISTS book_lists CASCADE;
DROP TABLE IF EXISTS books CASCADE;

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT,
  thumbnail TEXT,
  published_date DATE,
  categories TEXT[],
  description TEXT,
  page_count INTEGER,
  publisher TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS book_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS book_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  list_type TEXT,
  list_id UUID NULL REFERENCES book_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_title ON books USING gin (to_tsvector('english', coalesce(title,'')));
CREATE INDEX IF NOT EXISTS idx_books_authors ON books USING gin (to_tsvector('english', coalesce(authors,'')));
CREATE INDEX IF NOT EXISTS idx_book_list_items_user ON book_list_items (user_id);
CREATE INDEX IF NOT EXISTS idx_book_list_items_book ON book_list_items (book_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_book_list_items_quick
  ON book_list_items (user_id, book_id, list_type)
  WHERE list_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_book_list_items_custom
  ON book_list_items (user_id, book_id, list_id)
  WHERE list_id IS NOT NULL;

INSERT INTO books (id, title, authors, thumbnail, published_date, categories, description, page_count, publisher)
VALUES
('OL1W', 'Pride and Prejudice', 'Jane Austen', 'https://covers.openlibrary.org/b/olid/OL1M-M.jpg', '1813-01-01', ARRAY['Fiction','Romance'], 'A classic novel of manners.', 432, 'T. Egerton'),
('OL2W', 'Murder on the Orient Express', 'Agatha Christie', 'https://covers.openlibrary.org/b/isbn/9780007119318-M.jpg', '1934-01-01', ARRAY['Mystery','Fiction'], 'Hercule Poirot investigates a murder on a train.', 256, 'Collins Crime Club'),
('OL3W', 'The Hobbit', 'J.R.R. Tolkien', 'https://covers.openlibrary.org/b/isbn/9780261102217-M.jpg', '1937-09-21', ARRAY['Fantasy','Fiction'], 'Bilbo Baggins goes on an unexpected journey.', 310, 'George Allen & Unwin'),
('OL4W', 'Sapiens', 'Yuval Noah Harari', 'https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg', '2011-01-01', ARRAY['History','Science'], 'A brief history of humankind.', 498, 'Harper'),
('OL5W', 'Atomic Habits', 'James Clear', 'https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg', '2018-10-16', ARRAY['Self-Help','Business'], 'Tiny changes, remarkable results.', 320, 'Avery')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS books_touch_updated_at ON books;
CREATE TRIGGER books_touch_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();

CREATE TABLE IF NOT EXISTS book_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_book_reviews_book ON book_reviews (book_id);
CREATE INDEX IF NOT EXISTS idx_book_reviews_user ON book_reviews (user_id);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select on books" ON books;
CREATE POLICY "Public select on books" ON books FOR SELECT USING (true);

ALTER TABLE book_lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select on book_lists" ON book_lists;
DROP POLICY IF EXISTS "Insert own book_lists" ON book_lists;
DROP POLICY IF EXISTS "Update own book_lists" ON book_lists;
DROP POLICY IF EXISTS "Delete own book_lists" ON book_lists;
CREATE POLICY "Public select on book_lists" ON book_lists FOR SELECT USING (true);
CREATE POLICY "Insert own book_lists" ON book_lists FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own book_lists" ON book_lists FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own book_lists" ON book_lists FOR DELETE USING (user_id = auth.uid());

ALTER TABLE book_list_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select on book_list_items" ON book_list_items;
DROP POLICY IF EXISTS "Insert own book_list_items" ON book_list_items;
DROP POLICY IF EXISTS "Update own book_list_items" ON book_list_items;
DROP POLICY IF EXISTS "Delete own book_list_items" ON book_list_items;
CREATE POLICY "Public select on book_list_items" ON book_list_items FOR SELECT USING (true);
CREATE POLICY "Insert own book_list_items" ON book_list_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own book_list_items" ON book_list_items FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own book_list_items" ON book_list_items FOR DELETE USING (user_id = auth.uid());

ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select on book_reviews" ON book_reviews;
DROP POLICY IF EXISTS "Insert own book_reviews" ON book_reviews;
DROP POLICY IF EXISTS "Update own book_reviews" ON book_reviews;
DROP POLICY IF EXISTS "Delete own book_reviews" ON book_reviews;
CREATE POLICY "Public select on book_reviews" ON book_reviews FOR SELECT USING (true);
CREATE POLICY "Insert own book_reviews" ON book_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own book_reviews" ON book_reviews FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own book_reviews" ON book_reviews FOR DELETE USING (user_id = auth.uid());

-- ---------- Anime schema ----------
create extension if not exists "pgcrypto";

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
where created_at is null or updated_at is null;

alter table public.anime_reviews alter column created_at set default now();
alter table public.anime_reviews alter column updated_at set default now();

do $$
begin
  if to_regclass('public.anime_lists') is not null then
    if not exists (
      select 1 from pg_constraint
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
      select 1 from pg_constraint
      where conname = 'anime_list_items_user_id_fkey'
        and conrelid = 'public.anime_list_items'::regclass
    ) then
      alter table public.anime_list_items
        add constraint anime_list_items_user_id_fkey
        foreign key (user_id) references auth.users(id) on delete cascade;
    end if;

    if not exists (
      select 1 from pg_constraint
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
      select 1 from pg_constraint
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
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'tv_lists' and column_name = 'list_kind'
    ) into has_tv_list_kind;

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'tv_lists' and column_name = 'icon'
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
        insert into public.anime_lists (id, user_id, title, icon, description, is_public, list_kind, created_at, updated_at)
        select tl.id, tl.user_id, tl.title, coalesce(nullif(tl.icon, ''), 'fas fa-dragon'), '', false, 'anime', coalesce(tl.created_at, now()), now()
        from public.tv_lists tl where %s
        on conflict (id) do update set icon = excluded.icon, list_kind = 'anime', updated_at = now()
      $sql$, filter_sql);

      if has_tv_items then
        insert into public.anime_list_items (user_id, anime_id, list_type, list_id, created_at)
        select tli.user_id, tli.tv_id, tli.list_type, tli.list_id, coalesce(tli.created_at, now())
        from public.tv_list_items tli
        join public.anime_lists al on al.id = tli.list_id
        on conflict do nothing;
      end if;
    end if;
  end if;

  if has_tv_items and to_regclass('public.anime_reviews') is not null then
    insert into public.anime_list_items (user_id, anime_id, list_type, list_id, created_at)
    select tli.user_id, tli.tv_id, tli.list_type, null, coalesce(tli.created_at, now())
    from public.tv_list_items tli
    where tli.list_id is null
      and tli.list_type in ('favorites', 'watched', 'watchlist')
      and exists (select 1 from public.anime_reviews ar where ar.user_id = tli.user_id and ar.anime_id = tli.tv_id)
    on conflict do nothing;
  end if;
end
$$;

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

create or replace function public.touch_anime_lists_updated_at()
returns trigger language plpgsql as $$
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
returns trigger language plpgsql as $$
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

alter table public.anime_lists enable row level security;
alter table public.anime_list_items enable row level security;
alter table public.anime_reviews enable row level security;

drop policy if exists "Public select on anime_lists" on public.anime_lists;
drop policy if exists "Insert own anime_lists" on public.anime_lists;
drop policy if exists "Update own anime_lists" on public.anime_lists;
drop policy if exists "Delete own anime_lists" on public.anime_lists;
create policy "Public select on anime_lists" on public.anime_lists for select using (true);
create policy "Insert own anime_lists" on public.anime_lists for insert with check (user_id = auth.uid());
create policy "Update own anime_lists" on public.anime_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own anime_lists" on public.anime_lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on anime_list_items" on public.anime_list_items;
drop policy if exists "Insert own anime_list_items" on public.anime_list_items;
drop policy if exists "Update own anime_list_items" on public.anime_list_items;
drop policy if exists "Delete own anime_list_items" on public.anime_list_items;
create policy "Public select on anime_list_items" on public.anime_list_items for select using (true);
create policy "Insert own anime_list_items" on public.anime_list_items for insert with check (user_id = auth.uid() and (list_id is null or exists (select 1 from public.anime_lists l where l.id = anime_list_items.list_id and l.user_id = auth.uid())));
create policy "Update own anime_list_items" on public.anime_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid() and (list_id is null or exists (select 1 from public.anime_lists l where l.id = anime_list_items.list_id and l.user_id = auth.uid())));
create policy "Delete own anime_list_items" on public.anime_list_items for delete using (user_id = auth.uid());

drop policy if exists "Public select on anime_reviews" on public.anime_reviews;
drop policy if exists "Insert own anime_reviews" on public.anime_reviews;
drop policy if exists "Update own anime_reviews" on public.anime_reviews;
drop policy if exists "Delete own anime_reviews" on public.anime_reviews;
create policy "Public select on anime_reviews" on public.anime_reviews for select using (true);
create policy "Insert own anime_reviews" on public.anime_reviews for insert with check (user_id = auth.uid());
create policy "Update own anime_reviews" on public.anime_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own anime_reviews" on public.anime_reviews for delete using (user_id = auth.uid());

do $$
begin
  if to_regclass('public.list_collaborators') is not null then
    alter table public.list_collaborators drop constraint if exists list_collaborators_media_type_check;
    alter table public.list_collaborators add constraint list_collaborators_media_type_check check (media_type in ('restaurant', 'movie', 'anime', 'tv', 'game', 'book', 'music'));
  end if;
  if to_regclass('public.list_tier_meta') is not null then
    alter table public.list_tier_meta drop constraint if exists list_tier_meta_media_type_check;
    alter table public.list_tier_meta add constraint list_tier_meta_media_type_check check (media_type in ('movie', 'anime', 'tv', 'game', 'book', 'music', 'restaurant'));
  end if;
  if to_regclass('public.list_tier_ranks') is not null then
    alter table public.list_tier_ranks drop constraint if exists list_tier_ranks_media_type_check;
    alter table public.list_tier_ranks add constraint list_tier_ranks_media_type_check check (media_type in ('movie', 'anime', 'tv', 'game', 'book', 'music', 'restaurant'));
  end if;
end
$$;

create or replace function public.zo2y_custom_list_owner_matches(p_media_type text, p_list_id text, p_owner_id uuid)
returns boolean language plpgsql stable as $$
declare
  safe_media_type text := lower(trim(coalesce(p_media_type, '')));
  safe_list_id text := trim(coalesce(p_list_id, ''));
  matches_owner boolean := false;
begin
  if p_owner_id is null or safe_list_id = '' then return false; end if;
  case safe_media_type
    when 'movie' then
      if to_regclass('public.movie_lists') is null then return false; end if;
      select exists (select 1 from public.movie_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'anime' then
      if to_regclass('public.anime_lists') is null then return false; end if;
      select exists (select 1 from public.anime_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'tv' then
      if to_regclass('public.tv_lists') is null then return false; end if;
      select exists (select 1 from public.tv_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'game' then
      if to_regclass('public.game_lists') is null then return false; end if;
      select exists (select 1 from public.game_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'book' then
      if to_regclass('public.book_lists') is null then return false; end if;
      select exists (select 1 from public.book_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'music' then
      if to_regclass('public.music_lists') is null then return false; end if;
      select exists (select 1 from public.music_lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    when 'restaurant' then
      if to_regclass('public.lists') is null then return false; end if;
      select exists (select 1 from public.lists l where l.id::text = safe_list_id and l.user_id = p_owner_id) into matches_owner;
    else return false;
  end case;
  return coalesce(matches_owner, false);
end;
$$;

create or replace function public.zo2y_get_accessible_custom_lists(p_media_type text)
returns table (id text, user_id uuid, title text, description text, icon text, created_at timestamptz, updated_at timestamptz, is_collaborative boolean, can_edit boolean, list_owner_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  safe_media_type text := lower(trim(coalesce(p_media_type, '')));
  list_table text;
  sql text;
begin
  if auth.uid() is null then return; end if;
  case safe_media_type
    when 'movie' then list_table := 'movie_lists';
    when 'anime' then list_table := 'anime_lists';
    when 'tv' then list_table := 'tv_lists';
    when 'game' then list_table := 'game_lists';
    when 'book' then list_table := 'book_lists';
    when 'music' then list_table := 'music_lists';
    when 'sports' then list_table := 'sports_lists';
    when 'restaurant' then list_table := 'lists';
    else return;
  end case;
  if to_regclass(format('public.%s', list_table)) is null then return; end if;
  sql := format($q$
    with own_lists as (
      select l.id::text as id, l.user_id, l.title, l.description, l.icon, l.created_at, l.updated_at, false as is_collaborative, true as can_edit, l.user_id as list_owner_id
      from public.%I l where l.user_id = auth.uid()
    ),
    shared_lists as (
      select l.id::text as id, l.user_id, l.title, l.description, l.icon, l.created_at, l.updated_at, true as is_collaborative, coalesce(lc.can_edit, false) as can_edit, lc.list_owner_id
      from public.%I l
      join public.list_collaborators lc on lc.media_type = %L and lc.list_id = l.id::text
      where lc.collaborator_id = auth.uid()
    )
    select * from own_lists union all select * from shared_lists order by created_at desc nulls last
  $q$, list_table, list_table, safe_media_type);
  return query execute sql;
end;
$$;

grant execute on function public.zo2y_get_accessible_custom_lists(text) to authenticated;

-- ---------- Music schema ----------
create extension if not exists "pgcrypto";

create table if not exists public.tracks (
  id text primary key,
  name text not null,
  artists text,
  album_name text,
  image_url text,
  preview_url text,
  external_url text,
  popularity integer,
  duration_ms integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.music_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.music_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  track_id text not null references public.tracks(id) on delete cascade,
  list_type text,
  list_id uuid null references public.music_lists(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.music_reviews (
  id uuid primary key default gen_random_uuid(),
  track_id text not null references public.tracks(id) on delete cascade,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tracks_name on public.tracks using gin (to_tsvector('english', coalesce(name, '')));
create index if not exists idx_tracks_artists on public.tracks using gin (to_tsvector('english', coalesce(artists, '')));
create index if not exists idx_music_lists_user on public.music_lists(user_id);
create index if not exists idx_music_list_items_user on public.music_list_items(user_id);
create index if not exists idx_music_list_items_track on public.music_list_items(track_id);
create index if not exists idx_music_reviews_track on public.music_reviews(track_id);
create index if not exists idx_music_reviews_user on public.music_reviews(user_id);

create unique index if not exists ux_music_list_items_quick
  on public.music_list_items (user_id, track_id, list_type) where list_id is null;

create unique index if not exists ux_music_list_items_custom
  on public.music_list_items (user_id, track_id, list_id) where list_id is not null;

create or replace function public.touch_tracks_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new;
end;
$$ language plpgsql;

drop trigger if exists tracks_touch_updated_at on public.tracks;
create trigger tracks_touch_updated_at
  before update on public.tracks for each row
  execute function public.touch_tracks_updated_at();

create or replace function public.touch_music_reviews_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new;
end;
$$ language plpgsql;

drop trigger if exists music_reviews_touch_updated_at on public.music_reviews;
create trigger music_reviews_touch_updated_at
  before update on public.music_reviews for each row
  execute function public.touch_music_reviews_updated_at();

alter table public.tracks enable row level security;
alter table public.music_lists enable row level security;
alter table public.music_list_items enable row level security;
alter table public.music_reviews enable row level security;

drop policy if exists "Public select on tracks" on public.tracks;
drop policy if exists "Insert tracks for authenticated users" on public.tracks;
drop policy if exists "Update tracks for authenticated users" on public.tracks;
create policy "Public select on tracks" on public.tracks for select using (true);
create policy "Insert tracks for authenticated users" on public.tracks for insert with check (auth.uid() is not null);
create policy "Update tracks for authenticated users" on public.tracks for update using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "Public select on music_lists" on public.music_lists;
drop policy if exists "Insert own music_lists" on public.music_lists;
drop policy if exists "Update own music_lists" on public.music_lists;
drop policy if exists "Delete own music_lists" on public.music_lists;
create policy "Public select on music_lists" on public.music_lists for select using (true);
create policy "Insert own music_lists" on public.music_lists for insert with check (user_id = auth.uid());
create policy "Update own music_lists" on public.music_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own music_lists" on public.music_lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on music_list_items" on public.music_list_items;
drop policy if exists "Insert own music_list_items" on public.music_list_items;
drop policy if exists "Update own music_list_items" on public.music_list_items;
drop policy if exists "Delete own music_list_items" on public.music_list_items;
create policy "Public select on music_list_items" on public.music_list_items for select using (true);
create policy "Insert own music_list_items" on public.music_list_items for insert with check (user_id = auth.uid());
create policy "Update own music_list_items" on public.music_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own music_list_items" on public.music_list_items for delete using (user_id = auth.uid());

drop policy if exists "Public select on music_reviews" on public.music_reviews;
drop policy if exists "Insert own music_reviews" on public.music_reviews;
drop policy if exists "Update own music_reviews" on public.music_reviews;
drop policy if exists "Delete own music_reviews" on public.music_reviews;
create policy "Public select on music_reviews" on public.music_reviews for select using (true);
create policy "Insert own music_reviews" on public.music_reviews for insert with check (user_id = auth.uid());
create policy "Update own music_reviews" on public.music_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own music_reviews" on public.music_reviews for delete using (user_id = auth.uid());

-- ---------- Travel schema ----------
create extension if not exists "pgcrypto";

create table if not exists public.travel_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.travel_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null check (char_length(country_code) between 2 and 3),
  list_type text check (list_type in ('favorites', 'visited', 'bucketlist')),
  list_id uuid null references public.travel_lists(id) on delete cascade,
  check (list_id is not null or list_type in ('favorites', 'visited', 'bucketlist')),
  created_at timestamptz default now()
);

create table if not exists public.travel_reviews (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check (char_length(country_code) between 2 and 3),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_code text not null check (char_length(country_code) between 2 and 3),
  cities text[] not null default '{}',
  activities text[] not null default '{}',
  budget_tier text check (budget_tier in ('budget', 'midrange', 'luxury')),
  best_months text[] not null default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_travel_lists_user on public.travel_lists(user_id);
create index if not exists idx_travel_list_items_user on public.travel_list_items(user_id);
create index if not exists idx_travel_list_items_country on public.travel_list_items(country_code);
create index if not exists idx_travel_reviews_country on public.travel_reviews(country_code);
create index if not exists idx_travel_reviews_user on public.travel_reviews(user_id);
create index if not exists idx_travel_plans_user on public.travel_plans(user_id);
create index if not exists idx_travel_plans_country on public.travel_plans(country_code);

drop index if exists ux_travel_list_items_unique;
create unique index if not exists ux_travel_default_items_unique
  on public.travel_list_items (user_id, country_code, list_type) where list_id is null;
create unique index if not exists ux_travel_custom_items_unique
  on public.travel_list_items (list_id, country_code) where list_id is not null;
create unique index if not exists ux_travel_reviews_user_country
  on public.travel_reviews (user_id, country_code);
create unique index if not exists ux_travel_plans_user_country
  on public.travel_plans (user_id, country_code);

create or replace function public.touch_travel_reviews_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new;
end;
$$ language plpgsql;

drop trigger if exists travel_reviews_touch_updated_at on public.travel_reviews;
create trigger travel_reviews_touch_updated_at
  before update on public.travel_reviews for each row
  execute function public.touch_travel_reviews_updated_at();

drop trigger if exists travel_plans_touch_updated_at on public.travel_plans;
create trigger travel_plans_touch_updated_at
  before update on public.travel_plans for each row
  execute function public.touch_travel_reviews_updated_at();

alter table public.travel_lists enable row level security;
alter table public.travel_list_items enable row level security;
alter table public.travel_reviews enable row level security;
alter table public.travel_plans enable row level security;

drop policy if exists "Public select on travel_lists" on public.travel_lists;
drop policy if exists "Insert own travel_lists" on public.travel_lists;
drop policy if exists "Update own travel_lists" on public.travel_lists;
drop policy if exists "Delete own travel_lists" on public.travel_lists;
create policy "Public select on travel_lists" on public.travel_lists for select using (true);
create policy "Insert own travel_lists" on public.travel_lists for insert with check (user_id = auth.uid());
create policy "Update own travel_lists" on public.travel_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own travel_lists" on public.travel_lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on travel_list_items" on public.travel_list_items;
drop policy if exists "Insert own travel_list_items" on public.travel_list_items;
drop policy if exists "Update own travel_list_items" on public.travel_list_items;
drop policy if exists "Delete own travel_list_items" on public.travel_list_items;
create policy "Public select on travel_list_items" on public.travel_list_items for select using (true);
create policy "Insert own travel_list_items" on public.travel_list_items for insert with check (user_id = auth.uid());
create policy "Update own travel_list_items" on public.travel_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own travel_list_items" on public.travel_list_items for delete using (user_id = auth.uid());

drop policy if exists "Public select on travel_reviews" on public.travel_reviews;
drop policy if exists "Insert own travel_reviews" on public.travel_reviews;
drop policy if exists "Update own travel_reviews" on public.travel_reviews;
drop policy if exists "Delete own travel_reviews" on public.travel_reviews;
create policy "Public select on travel_reviews" on public.travel_reviews for select using (true);
create policy "Insert own travel_reviews" on public.travel_reviews for insert with check (user_id = auth.uid());
create policy "Update own travel_reviews" on public.travel_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own travel_reviews" on public.travel_reviews for delete using (user_id = auth.uid());

drop policy if exists "Public select on travel_plans" on public.travel_plans;
drop policy if exists "Insert own travel_plans" on public.travel_plans;
drop policy if exists "Update own travel_plans" on public.travel_plans;
drop policy if exists "Delete own travel_plans" on public.travel_plans;
create policy "Public select on travel_plans" on public.travel_plans for select using (true);
create policy "Insert own travel_plans" on public.travel_plans for insert with check (user_id = auth.uid());
create policy "Update own travel_plans" on public.travel_plans for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own travel_plans" on public.travel_plans for delete using (user_id = auth.uid());

-- ---------- Fashion + Food schema ----------
create extension if not exists "pgcrypto";

create table if not exists public.fashion_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  domain text,
  logo_url text,
  description text,
  category text,
  country text,
  founded text,
  tags text[] not null default '{}',
  created_at timestamptz default now()
);

create table if not exists public.food_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  domain text,
  logo_url text,
  description text,
  category text,
  country text,
  founded text,
  tags text[] not null default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_fashion_brands_name on public.fashion_brands(name);
create index if not exists idx_food_brands_name on public.food_brands(name);

create table if not exists public.fashion_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.food_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.fashion_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references public.fashion_brands(id) on delete cascade,
  list_type text check (list_type in ('favorites', 'owned', 'wishlist')),
  list_id uuid null references public.fashion_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (list_id is not null or list_type in ('favorites', 'owned', 'wishlist'))
);

create table if not exists public.food_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references public.food_brands(id) on delete cascade,
  list_type text check (list_type in ('favorites', 'tried', 'want_to_try')),
  list_id uuid null references public.food_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (list_id is not null or list_type in ('favorites', 'tried', 'want_to_try'))
);

create index if not exists idx_fashion_lists_user on public.fashion_lists(user_id);
create index if not exists idx_food_lists_user on public.food_lists(user_id);
create index if not exists idx_fashion_list_items_user on public.fashion_list_items(user_id);
create index if not exists idx_food_list_items_user on public.food_list_items(user_id);
create index if not exists idx_fashion_list_items_brand on public.fashion_list_items(brand_id);
create index if not exists idx_food_list_items_brand on public.food_list_items(brand_id);

create unique index if not exists ux_fashion_default_items_unique
  on public.fashion_list_items (user_id, brand_id, list_type) where list_id is null;
create unique index if not exists ux_fashion_custom_items_unique
  on public.fashion_list_items (list_id, brand_id) where list_id is not null;
create unique index if not exists ux_food_default_items_unique
  on public.food_list_items (user_id, brand_id, list_type) where list_id is null;
create unique index if not exists ux_food_custom_items_unique
  on public.food_list_items (list_id, brand_id) where list_id is not null;

create table if not exists public.fashion_reviews (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.fashion_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.food_reviews (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.food_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_fashion_reviews_brand on public.fashion_reviews(brand_id);
create index if not exists idx_food_reviews_brand on public.food_reviews(brand_id);
create index if not exists idx_fashion_reviews_user on public.fashion_reviews(user_id);
create index if not exists idx_food_reviews_user on public.food_reviews(user_id);

create unique index if not exists ux_fashion_reviews_user_brand on public.fashion_reviews (user_id, brand_id);
create unique index if not exists ux_food_reviews_user_brand on public.food_reviews (user_id, brand_id);

create or replace function public.touch_brand_reviews_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new;
end;
$$ language plpgsql;

drop trigger if exists fashion_reviews_touch_updated_at on public.fashion_reviews;
create trigger fashion_reviews_touch_updated_at
  before update on public.fashion_reviews for each row
  execute function public.touch_brand_reviews_updated_at();

drop trigger if exists food_reviews_touch_updated_at on public.food_reviews;
create trigger food_reviews_touch_updated_at
  before update on public.food_reviews for each row
  execute function public.touch_brand_reviews_updated_at();

alter table public.fashion_brands enable row level security;
alter table public.food_brands enable row level security;
alter table public.fashion_lists enable row level security;
alter table public.food_lists enable row level security;
alter table public.fashion_list_items enable row level security;
alter table public.food_list_items enable row level security;
alter table public.fashion_reviews enable row level security;
alter table public.food_reviews enable row level security;

drop policy if exists "Public select on fashion_brands" on public.fashion_brands;
create policy "Public select on fashion_brands" on public.fashion_brands for select using (true);
drop policy if exists "Public select on food_brands" on public.food_brands;
create policy "Public select on food_brands" on public.food_brands for select using (true);

drop policy if exists "Public select on fashion_lists" on public.fashion_lists;
drop policy if exists "Insert own fashion_lists" on public.fashion_lists;
drop policy if exists "Update own fashion_lists" on public.fashion_lists;
drop policy if exists "Delete own fashion_lists" on public.fashion_lists;
create policy "Public select on fashion_lists" on public.fashion_lists for select using (true);
create policy "Insert own fashion_lists" on public.fashion_lists for insert with check (user_id = auth.uid());
create policy "Update own fashion_lists" on public.fashion_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own fashion_lists" on public.fashion_lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on food_lists" on public.food_lists;
drop policy if exists "Insert own food_lists" on public.food_lists;
drop policy if exists "Update own food_lists" on public.food_lists;
drop policy if exists "Delete own food_lists" on public.food_lists;
create policy "Public select on food_lists" on public.food_lists for select using (true);
create policy "Insert own food_lists" on public.food_lists for insert with check (user_id = auth.uid());
create policy "Update own food_lists" on public.food_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own food_lists" on public.food_lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on fashion_list_items" on public.fashion_list_items;
drop policy if exists "Insert own fashion_list_items" on public.fashion_list_items;
drop policy if exists "Update own fashion_list_items" on public.fashion_list_items;
drop policy if exists "Delete own fashion_list_items" on public.fashion_list_items;
create policy "Public select on fashion_list_items" on public.fashion_list_items for select using (true);
create policy "Insert own fashion_list_items" on public.fashion_list_items for insert with check (user_id = auth.uid());
create policy "Update own fashion_list_items" on public.fashion_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own fashion_list_items" on public.fashion_list_items for delete using (user_id = auth.uid());

drop policy if exists "Public select on food_list_items" on public.food_list_items;
drop policy if exists "Insert own food_list_items" on public.food_list_items;
drop policy if exists "Update own food_list_items" on public.food_list_items;
drop policy if exists "Delete own food_list_items" on public.food_list_items;
create policy "Public select on food_list_items" on public.food_list_items for select using (true);
create policy "Insert own food_list_items" on public.food_list_items for insert with check (user_id = auth.uid());
create policy "Update own food_list_items" on public.food_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own food_list_items" on public.food_list_items for delete using (user_id = auth.uid());

drop policy if exists "Public select on fashion_reviews" on public.fashion_reviews;
drop policy if exists "Insert own fashion_reviews" on public.fashion_reviews;
drop policy if exists "Update own fashion_reviews" on public.fashion_reviews;
drop policy if exists "Delete own fashion_reviews" on public.fashion_reviews;
create policy "Public select on fashion_reviews" on public.fashion_reviews for select using (true);
create policy "Insert own fashion_reviews" on public.fashion_reviews for insert with check (user_id = auth.uid());
create policy "Update own fashion_reviews" on public.fashion_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own fashion_reviews" on public.fashion_reviews for delete using (user_id = auth.uid());

drop policy if exists "Public select on food_reviews" on public.food_reviews;
drop policy if exists "Insert own food_reviews" on public.food_reviews;
drop policy if exists "Update own food_reviews" on public.food_reviews;
drop policy if exists "Delete own food_reviews" on public.food_reviews;
create policy "Public select on food_reviews" on public.food_reviews for select using (true);
create policy "Insert own food_reviews" on public.food_reviews for insert with check (user_id = auth.uid());
create policy "Update own food_reviews" on public.food_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own food_reviews" on public.food_reviews for delete using (user_id = auth.uid());

insert into public.fashion_brands (name, slug, domain, logo_url, description, category, country, founded, tags)
values
  ('Nike', 'nike', 'nike.com', 'https://logo.clearbit.com/nike.com', 'Global sportswear brand.', 'Sportswear', 'USA', '1964', array['sportswear','sneakers']),
  ('Adidas', 'adidas', 'adidas.com', 'https://logo.clearbit.com/adidas.com', 'Athletic apparel and footwear.', 'Sportswear', 'Germany', '1949', array['sportswear','sneakers']),
  ('Zara', 'zara', 'zara.com', 'https://logo.clearbit.com/zara.com', 'Spanish fashion retailer.', 'Fast Fashion', 'Spain', '1975', array['fast fashion']),
  ('Uniqlo', 'uniqlo', 'uniqlo.com', 'https://logo.clearbit.com/uniqlo.com', 'Japanese casualwear brand.', 'Basics', 'Japan', '1949', array['basics']),
  ('H&M', 'hm', 'hm.com', 'https://logo.clearbit.com/hm.com', 'Global fashion retailer.', 'Fast Fashion', 'Sweden', '1947', array['fast fashion']),
  ('Gucci', 'gucci', 'gucci.com', 'https://logo.clearbit.com/gucci.com', 'Italian luxury fashion.', 'Luxury', 'Italy', '1921', array['luxury']),
  ('Prada', 'prada', 'prada.com', 'https://logo.clearbit.com/prada.com', 'Luxury fashion house.', 'Luxury', 'Italy', '1913', array['luxury']),
  ('Louis Vuitton', 'louis-vuitton', 'louisvuitton.com', 'https://logo.clearbit.com/louisvuitton.com', 'French luxury fashion.', 'Luxury', 'France', '1854', array['luxury']),
  ('Supreme', 'supreme', 'supremenewyork.com', 'https://logo.clearbit.com/supremenewyork.com', 'Streetwear brand.', 'Streetwear', 'USA', '1994', array['streetwear']),
  ('Off-White', 'off-white', 'offwhite.com', 'https://logo.clearbit.com/offwhite.com', 'Luxury streetwear label.', 'Streetwear', 'Italy', '2012', array['streetwear','luxury']),
  ('Balenciaga', 'balenciaga', 'balenciaga.com', 'https://logo.clearbit.com/balenciaga.com', 'Luxury fashion house.', 'Luxury', 'France', '1917', array['luxury']),
  ('Stone Island', 'stone-island', 'stoneisland.com', 'https://logo.clearbit.com/stoneisland.com', 'Technical outerwear.', 'Streetwear', 'Italy', '1982', array['outerwear'])
on conflict do nothing;

insert into public.food_brands (name, slug, domain, logo_url, description, category, country, founded, tags)
values
  ('McDonald''s', 'mcdonalds', 'mcdonalds.com', 'https://logo.clearbit.com/mcdonalds.com', 'American fast-food chain.', 'Fast Food', 'USA', '1940', array['burgers','fast food']),
  ('KFC', 'kfc', 'kfc.com', 'https://logo.clearbit.com/kfc.com', 'Fried chicken specialists.', 'Fast Food', 'USA', '1952', array['chicken','fast food']),
  ('Burger King', 'burger-king', 'burgerking.com', 'https://logo.clearbit.com/burgerking.com', 'Home of the Whopper.', 'Fast Food', 'USA', '1954', array['burgers','fast food']),
  ('Subway', 'subway', 'subway.com', 'https://logo.clearbit.com/subway.com', 'Sandwich chain.', 'Fast Food', 'USA', '1965', array['sandwiches','fast food']),
  ('Taco Bell', 'taco-bell', 'tacobell.com', 'https://logo.clearbit.com/tacobell.com', 'Mexican-inspired fast food.', 'Fast Food', 'USA', '1962', array['tacos','fast food']),
  ('Domino''s', 'dominos', 'dominos.com', 'https://logo.clearbit.com/dominos.com', 'Pizza delivery chain.', 'Pizza', 'USA', '1960', array['pizza']),
  ('Pizza Hut', 'pizza-hut', 'pizzahut.com', 'https://logo.clearbit.com/pizzahut.com', 'Pizza restaurant chain.', 'Pizza', 'USA', '1958', array['pizza']),
  ('Starbucks', 'starbucks', 'starbucks.com', 'https://logo.clearbit.com/starbucks.com', 'Coffeehouse chain.', 'Coffee', 'USA', '1971', array['coffee']),
  ('Chipotle', 'chipotle', 'chipotle.com', 'https://logo.clearbit.com/chipotle.com', 'Fast casual Mexican grill.', 'Fast Casual', 'USA', '1993', array['mexican','fast casual']),
  ('Chick-fil-A', 'chick-fil-a', 'chick-fil-a.com', 'https://logo.clearbit.com/chick-fil-a.com', 'Chicken sandwich chain.', 'Fast Food', 'USA', '1946', array['chicken','fast food']),
  ('Wendy''s', 'wendys', 'wendys.com', 'https://logo.clearbit.com/wendys.com', 'Fast-food hamburger chain.', 'Fast Food', 'USA', '1969', array['burgers','fast food']),
  ('Shake Shack', 'shake-shack', 'shakeshack.com', 'https://logo.clearbit.com/shakeshack.com', 'Modern burger stand.', 'Fast Casual', 'USA', '2004', array['burgers','fast casual'])
on conflict do nothing;

-- ---------- Car schema ----------
create extension if not exists "pgcrypto";

create table if not exists public.car_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  domain text,
  logo_url text,
  description text,
  category text,
  country text,
  founded text,
  tags text[] not null default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_car_brands_name on public.car_brands(name);

create table if not exists public.car_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  icon text,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.car_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references public.car_brands(id) on delete cascade,
  list_type text check (list_type in ('favorites', 'owned', 'wishlist')),
  list_id uuid null references public.car_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (list_id is not null or list_type in ('favorites', 'owned', 'wishlist'))
);

create index if not exists idx_car_lists_user on public.car_lists(user_id);
create index if not exists idx_car_list_items_user on public.car_list_items(user_id);
create index if not exists idx_car_list_items_brand on public.car_list_items(brand_id);

create unique index if not exists ux_car_default_items_unique
  on public.car_list_items (user_id, brand_id, list_type) where list_id is null;
create unique index if not exists ux_car_custom_items_unique
  on public.car_list_items (list_id, brand_id) where list_id is not null;

create table if not exists public.car_reviews (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.car_brands(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_car_reviews_brand on public.car_reviews(brand_id);
create index if not exists idx_car_reviews_user on public.car_reviews(user_id);
create unique index if not exists ux_car_reviews_user_brand on public.car_reviews (user_id, brand_id);

create or replace function public.touch_car_reviews_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new;
end;
$$ language plpgsql;

drop trigger if exists car_reviews_touch_updated_at on public.car_reviews;
create trigger car_reviews_touch_updated_at
  before update on public.car_reviews for each row
  execute function public.touch_car_reviews_updated_at();

alter table public.car_brands enable row level security;
alter table public.car_lists enable row level security;
alter table public.car_list_items enable row level security;
alter table public.car_reviews enable row level security;

drop policy if exists "Public select on car_brands" on public.car_brands;
create policy "Public select on car_brands" on public.car_brands for select using (true);

drop policy if exists "Public select on car_lists" on public.car_lists;
drop policy if exists "Insert own car_lists" on public.car_lists;
drop policy if exists "Update own car_lists" on public.car_lists;
drop policy if exists "Delete own car_lists" on public.car_lists;
create policy "Public select on car_lists" on public.car_lists for select using (true);
create policy "Insert own car_lists" on public.car_lists for insert with check (user_id = auth.uid());
create policy "Update own car_lists" on public.car_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own car_lists" on public.car_lists for delete using (user_id = auth.uid());

drop policy if exists "Public select on car_list_items" on public.car_list_items;
drop policy if exists "Insert own car_list_items" on public.car_list_items;
drop policy if exists "Update own car_list_items" on public.car_list_items;
drop policy if exists "Delete own car_list_items" on public.car_list_items;
create policy "Public select on car_list_items" on public.car_list_items for select using (true);
create policy "Insert own car_list_items" on public.car_list_items for insert with check (user_id = auth.uid());
create policy "Update own car_list_items" on public.car_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own car_list_items" on public.car_list_items for delete using (user_id = auth.uid());

drop policy if exists "Public select on car_reviews" on public.car_reviews;
drop policy if exists "Insert own car_reviews" on public.car_reviews;
drop policy if exists "Update own car_reviews" on public.car_reviews;
drop policy if exists "Delete own car_reviews" on public.car_reviews;
create policy "Public select on car_reviews" on public.car_reviews for select using (true);
create policy "Insert own car_reviews" on public.car_reviews for insert with check (user_id = auth.uid());
create policy "Update own car_reviews" on public.car_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own car_reviews" on public.car_reviews for delete using (user_id = auth.uid());

-- ============================================================
-- STEP 3: Activity feed (schema + triggers + backfill)
-- ============================================================

create table if not exists public.user_activity_feed (
  id bigint generated by default as identity primary key,
  actor_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (
    event_type in ('list_create','list_delete','list_add','list_remove','review_add','review_edit','review_delete')
  ),
  media_type text not null,
  item_id text,
  list_type text,
  list_id uuid,
  rating numeric(3,1),
  review_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_activity_feed_actor_created
  on public.user_activity_feed (actor_id, created_at desc);
create index if not exists idx_user_activity_feed_created
  on public.user_activity_feed (created_at desc);

alter table public.user_activity_feed enable row level security;

alter table public.user_activity_feed
  drop constraint if exists user_activity_feed_event_type_check;
alter table public.user_activity_feed
  add constraint user_activity_feed_event_type_check
  check (event_type in ('list_create','list_delete','list_add','list_remove','review_add','review_edit','review_delete'));

drop policy if exists "activity_feed_select_public" on public.user_activity_feed;
create policy "activity_feed_select_public"
  on public.user_activity_feed for select to anon, authenticated using (true);

drop policy if exists "activity_feed_insert_own" on public.user_activity_feed;
create policy "activity_feed_insert_own"
  on public.user_activity_feed for insert to authenticated with check (auth.uid() = actor_id);

create or replace function public.log_list_activity_iud()
returns trigger language plpgsql as $$
declare
  v_event_type text; v_media_type text; v_item_id text; v_actor_id uuid;
  v_list_type text; v_list_id uuid; v_payload jsonb;
begin
  v_event_type := case tg_op when 'INSERT' then 'list_add' when 'DELETE' then 'list_remove' else null end;
  if v_event_type is null then return coalesce(new, old); end if;
  v_media_type := case tg_table_name
    when 'movie_list_items' then 'movie' when 'tv_list_items' then 'tv'
    when 'anime_list_items' then 'anime' when 'game_list_items' then 'game'
    when 'book_list_items' then 'book' when 'music_list_items' then 'music'
    else null
  end;
  v_payload := case when tg_op = 'INSERT' then to_jsonb(new) when tg_op = 'DELETE' then to_jsonb(old) else '{}'::jsonb end;
  v_item_id := case tg_table_name
    when 'movie_list_items' then nullif(v_payload->>'movie_id', '') when 'tv_list_items' then nullif(v_payload->>'tv_id', '')
    when 'anime_list_items' then nullif(v_payload->>'anime_id', '') when 'game_list_items' then nullif(v_payload->>'game_id', '')
    when 'book_list_items' then nullif(v_payload->>'book_id', '') when 'music_list_items' then nullif(v_payload->>'track_id', '')
    else null
  end;
  v_actor_id := nullif(v_payload->>'user_id', '')::uuid;
  v_list_type := nullif(v_payload->>'list_type', '');
  v_list_id := nullif(v_payload->>'list_id', '')::uuid;
  if v_media_type is null or v_item_id is null or v_actor_id is null then return coalesce(new, old); end if;
  insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, list_type, list_id, metadata)
  values (v_actor_id, v_event_type, v_media_type, v_item_id, v_list_type, v_list_id,
    jsonb_build_object('source_table', tg_table_name, 'source_pk', nullif(v_payload->>'id', '')));
  return coalesce(new, old);
end;
$$;

create or replace function public.log_custom_list_activity_iud()
returns trigger language plpgsql as $$
declare
  v_event_type text; v_media_type text; v_actor_id uuid; v_list_id uuid;
  v_list_title text; v_payload jsonb;
begin
  v_event_type := case tg_op when 'INSERT' then 'list_create' when 'DELETE' then 'list_delete' else null end;
  if v_event_type is null then return coalesce(new, old); end if;
  v_media_type := case tg_table_name
    when 'movie_lists' then 'movie' when 'tv_lists' then 'tv' when 'anime_lists' then 'anime'
    when 'game_lists' then 'game' when 'book_lists' then 'book' when 'music_lists' then 'music'
    when 'lists' then 'restaurant' else null
  end;
  v_payload := case when tg_op = 'INSERT' then to_jsonb(new) when tg_op = 'DELETE' then to_jsonb(old) else '{}'::jsonb end;
  v_actor_id := nullif(v_payload->>'user_id', '')::uuid;
  v_list_id := nullif(v_payload->>'id', '')::uuid;
  v_list_title := nullif(trim(v_payload->>'title'), '');
  if v_media_type is null or v_actor_id is null or v_list_id is null then return coalesce(new, old); end if;
  insert into public.user_activity_feed (actor_id, event_type, media_type, list_id, metadata)
  values (v_actor_id, v_event_type, v_media_type, v_list_id,
    jsonb_build_object('source_table', tg_table_name, 'source_pk', nullif(v_payload->>'id', ''), 'list_title', v_list_title));
  return coalesce(new, old);
end;
$$;

create or replace function public.log_media_review_activity_iud()
returns trigger language plpgsql as $$
declare
  v_event_type text; v_media_type text; v_actor_id uuid; v_item_id text;
  v_review_text text; v_rating numeric(3,1); v_payload jsonb; v_metadata jsonb;
begin
  v_event_type := case tg_op when 'INSERT' then 'review_add' when 'UPDATE' then 'review_edit' when 'DELETE' then 'review_delete' else null end;
  if v_event_type is null then return coalesce(new, old); end if;
  v_media_type := case tg_table_name
    when 'movie_reviews' then 'movie' when 'tv_reviews' then 'tv' when 'anime_reviews' then 'anime'
    when 'game_reviews' then 'game' when 'book_reviews' then 'book' when 'music_reviews' then 'music'
    when 'user_album_reviews' then 'music' when 'journal_entries' then 'restaurant' else null
  end;
  v_payload := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) when tg_op = 'DELETE' then to_jsonb(old) else '{}'::jsonb end;
  v_actor_id := nullif(v_payload->>'user_id', '')::uuid;
  v_item_id := case tg_table_name
    when 'movie_reviews' then nullif(v_payload->>'movie_id', '') when 'tv_reviews' then nullif(v_payload->>'tv_id', '')
    when 'anime_reviews' then nullif(v_payload->>'anime_id', '') when 'game_reviews' then nullif(v_payload->>'game_id', '')
    when 'book_reviews' then nullif(v_payload->>'book_id', '') when 'music_reviews' then nullif(v_payload->>'track_id', '')
    when 'user_album_reviews' then nullif(v_payload->>'album_id', '')
    when 'journal_entries' then coalesce(nullif(v_payload->>'restraunt_id', ''), nullif(v_payload->>'restaurant_id', ''))
    else null
  end;
  v_review_text := case when tg_table_name = 'journal_entries' then nullif(trim(v_payload->>'notes'), '') else nullif(trim(v_payload->>'comment'), '') end;
  v_rating := nullif(v_payload->>'rating', '')::numeric(3,1);
  v_metadata := jsonb_build_object('source_table', tg_table_name, 'source_pk', nullif(v_payload->>'id', ''));
  if tg_table_name = 'user_album_reviews' then
    v_metadata := v_metadata || jsonb_build_object('item_kind', 'album');
  end if;
  if tg_table_name = 'journal_entries' then
    v_metadata := v_metadata || jsonb_build_object('visit_date', v_payload->>'visit_date', 'tags', coalesce(v_payload->'tags', '[]'::jsonb));
  end if;
  if v_media_type is null or v_actor_id is null or v_item_id is null then return coalesce(new, old); end if;
  insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, rating, review_text, metadata)
  values (v_actor_id, v_event_type, v_media_type, v_item_id, v_rating, v_review_text, v_metadata);
  return coalesce(new, old);
end;
$$;

create or replace function public.ensure_activity_trigger(p_table_name text, p_trigger_name text, p_events text, p_function_name text)
returns void language plpgsql as $$
begin
  if to_regclass(format('public.%s', p_table_name)) is null then return; end if;
  execute format('drop trigger if exists %I on public.%I', p_trigger_name, p_table_name);
  execute format('create trigger %I after %s on public.%I for each row execute function %s()', p_trigger_name, p_events, p_table_name, p_function_name);
end;
$$;

-- List item add/remove triggers
select public.ensure_activity_trigger('movie_list_items', 'trg_movie_list_add_activity', 'insert', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('movie_list_items', 'trg_movie_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('tv_list_items', 'trg_tv_list_add_activity', 'insert', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('tv_list_items', 'trg_tv_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('anime_list_items', 'trg_anime_list_add_activity', 'insert', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('anime_list_items', 'trg_anime_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('game_list_items', 'trg_game_list_add_activity', 'insert', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('game_list_items', 'trg_game_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('book_list_items', 'trg_book_list_add_activity', 'insert', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('book_list_items', 'trg_book_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('music_list_items', 'trg_music_list_add_activity', 'insert', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('music_list_items', 'trg_music_list_remove_activity', 'delete', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('sports_list_items', 'trg_sports_list_add_activity', 'insert', 'public.log_list_activity_iud');
select public.ensure_activity_trigger('sports_list_items', 'trg_sports_list_remove_activity', 'delete', 'public.log_list_activity_iud');

-- Custom list create/delete triggers
select public.ensure_activity_trigger('movie_lists', 'trg_movie_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('movie_lists', 'trg_movie_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('tv_lists', 'trg_tv_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('tv_lists', 'trg_tv_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('anime_lists', 'trg_anime_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('anime_lists', 'trg_anime_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('game_lists', 'trg_game_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('game_lists', 'trg_game_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('book_lists', 'trg_book_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('book_lists', 'trg_book_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('music_lists', 'trg_music_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('music_lists', 'trg_music_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('sports_lists', 'trg_sports_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('sports_lists', 'trg_sports_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('lists', 'trg_restaurant_list_create_activity', 'insert', 'public.log_custom_list_activity_iud');
select public.ensure_activity_trigger('lists', 'trg_restaurant_list_delete_activity', 'delete', 'public.log_custom_list_activity_iud');

-- Review add/edit/delete triggers
select public.ensure_activity_trigger('movie_reviews', 'trg_movie_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('movie_reviews', 'trg_movie_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('movie_reviews', 'trg_movie_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('tv_reviews', 'trg_tv_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('tv_reviews', 'trg_tv_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('tv_reviews', 'trg_tv_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('anime_reviews', 'trg_anime_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('anime_reviews', 'trg_anime_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('anime_reviews', 'trg_anime_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('game_reviews', 'trg_game_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('game_reviews', 'trg_game_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('game_reviews', 'trg_game_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('book_reviews', 'trg_book_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('book_reviews', 'trg_book_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('book_reviews', 'trg_book_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('music_reviews', 'trg_music_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('music_reviews', 'trg_music_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('music_reviews', 'trg_music_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('user_album_reviews', 'trg_album_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('user_album_reviews', 'trg_album_review_edit_activity', 'update of rating, comment', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('user_album_reviews', 'trg_album_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('journal_entries', 'trg_journal_review_add_activity', 'insert', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('journal_entries', 'trg_journal_review_edit_activity', 'update of rating, notes, visit_date, tags', 'public.log_media_review_activity_iud');
select public.ensure_activity_trigger('journal_entries', 'trg_journal_review_delete_activity', 'delete', 'public.log_media_review_activity_iud');

-- Backfill activity feed
do $$
begin
  if to_regclass('public.movie_list_items') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, list_type, list_id, metadata, created_at)
    select src.user_id, 'list_add', 'movie', src.movie_id::text, src.list_type, src.list_id,
      jsonb_build_object('source_table', 'movie_list_items', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.movie_list_items src
    where src.user_id is not null and src.movie_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_add' and f.media_type = 'movie' and f.metadata->>'source_table' = 'movie_list_items' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.tv_list_items') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, list_type, list_id, metadata, created_at)
    select src.user_id, 'list_add', 'tv', src.tv_id::text, src.list_type, src.list_id,
      jsonb_build_object('source_table', 'tv_list_items', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.tv_list_items src
    where src.user_id is not null and src.tv_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_add' and f.media_type = 'tv' and f.metadata->>'source_table' = 'tv_list_items' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.anime_list_items') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, list_type, list_id, metadata, created_at)
    select src.user_id, 'list_add', 'anime', src.anime_id::text, src.list_type, src.list_id,
      jsonb_build_object('source_table', 'anime_list_items', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.anime_list_items src
    where src.user_id is not null and src.anime_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_add' and f.media_type = 'anime' and f.metadata->>'source_table' = 'anime_list_items' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.game_list_items') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, list_type, list_id, metadata, created_at)
    select src.user_id, 'list_add', 'game', src.game_id::text, src.list_type, src.list_id,
      jsonb_build_object('source_table', 'game_list_items', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.game_list_items src
    where src.user_id is not null and src.game_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_add' and f.media_type = 'game' and f.metadata->>'source_table' = 'game_list_items' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.book_list_items') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, list_type, list_id, metadata, created_at)
    select src.user_id, 'list_add', 'book', src.book_id::text, src.list_type, src.list_id,
      jsonb_build_object('source_table', 'book_list_items', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.book_list_items src
    where src.user_id is not null and src.book_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_add' and f.media_type = 'book' and f.metadata->>'source_table' = 'book_list_items' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.music_list_items') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, list_type, list_id, metadata, created_at)
    select src.user_id, 'list_add', 'music', src.track_id::text, src.list_type, src.list_id,
      jsonb_build_object('source_table', 'music_list_items', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.music_list_items src
    where src.user_id is not null and src.track_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_add' and f.media_type = 'music' and f.metadata->>'source_table' = 'music_list_items' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.movie_lists') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, list_id, metadata, created_at)
    select src.user_id, 'list_create', 'movie', src.id,
      jsonb_build_object('source_table', 'movie_lists', 'source_pk', src.id::text, 'list_title', src.title, 'backfill', true),
      coalesce(src.created_at, now())
    from public.movie_lists src
    where src.user_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_create' and f.media_type = 'movie' and f.metadata->>'source_table' = 'movie_lists' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.tv_lists') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, list_id, metadata, created_at)
    select src.user_id, 'list_create', 'tv', src.id,
      jsonb_build_object('source_table', 'tv_lists', 'source_pk', src.id::text, 'list_title', src.title, 'backfill', true),
      coalesce(src.created_at, now())
    from public.tv_lists src
    where src.user_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_create' and f.media_type = 'tv' and f.metadata->>'source_table' = 'tv_lists' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.anime_lists') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, list_id, metadata, created_at)
    select src.user_id, 'list_create', 'anime', src.id,
      jsonb_build_object('source_table', 'anime_lists', 'source_pk', src.id::text, 'list_title', src.title, 'backfill', true),
      coalesce(src.created_at, now())
    from public.anime_lists src
    where src.user_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_create' and f.media_type = 'anime' and f.metadata->>'source_table' = 'anime_lists' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.game_lists') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, list_id, metadata, created_at)
    select src.user_id, 'list_create', 'game', src.id,
      jsonb_build_object('source_table', 'game_lists', 'source_pk', src.id::text, 'list_title', src.title, 'backfill', true),
      coalesce(src.created_at, now())
    from public.game_lists src
    where src.user_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_create' and f.media_type = 'game' and f.metadata->>'source_table' = 'game_lists' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.book_lists') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, list_id, metadata, created_at)
    select src.user_id, 'list_create', 'book', src.id,
      jsonb_build_object('source_table', 'book_lists', 'source_pk', src.id::text, 'list_title', src.title, 'backfill', true),
      coalesce(src.created_at, now())
    from public.book_lists src
    where src.user_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_create' and f.media_type = 'book' and f.metadata->>'source_table' = 'book_lists' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.music_lists') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, list_id, metadata, created_at)
    select src.user_id, 'list_create', 'music', src.id,
      jsonb_build_object('source_table', 'music_lists', 'source_pk', src.id::text, 'list_title', src.title, 'backfill', true),
      coalesce(src.created_at, now())
    from public.music_lists src
    where src.user_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_create' and f.media_type = 'music' and f.metadata->>'source_table' = 'music_lists' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.lists') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, list_id, metadata, created_at)
    select src.user_id, 'list_create', 'restaurant', src.id,
      jsonb_build_object('source_table', 'lists', 'source_pk', src.id::text, 'list_title', src.title, 'backfill', true),
      coalesce(src.created_at, now())
    from public.lists src
    where src.user_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'list_create' and f.media_type = 'restaurant' and f.metadata->>'source_table' = 'lists' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.movie_reviews') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, rating, review_text, metadata, created_at)
    select src.user_id, 'review_add', 'movie', src.movie_id::text, src.rating::numeric(3,1), nullif(trim(src.comment), ''),
      jsonb_build_object('source_table', 'movie_reviews', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.movie_reviews src
    where src.user_id is not null and src.movie_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'review_add' and f.media_type = 'movie' and f.metadata->>'source_table' = 'movie_reviews' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.tv_reviews') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, rating, review_text, metadata, created_at)
    select src.user_id, 'review_add', 'tv', src.tv_id::text, src.rating::numeric(3,1), nullif(trim(src.comment), ''),
      jsonb_build_object('source_table', 'tv_reviews', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.tv_reviews src
    where src.user_id is not null and src.tv_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'review_add' and f.media_type = 'tv' and f.metadata->>'source_table' = 'tv_reviews' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.anime_reviews') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, rating, review_text, metadata, created_at)
    select src.user_id, 'review_add', 'anime', src.anime_id::text, src.rating::numeric(3,1), nullif(trim(src.comment), ''),
      jsonb_build_object('source_table', 'anime_reviews', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.anime_reviews src
    where src.user_id is not null and src.anime_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'review_add' and f.media_type = 'anime' and f.metadata->>'source_table' = 'anime_reviews' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.game_reviews') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, rating, review_text, metadata, created_at)
    select src.user_id, 'review_add', 'game', src.game_id::text, src.rating::numeric(3,1), nullif(trim(src.comment), ''),
      jsonb_build_object('source_table', 'game_reviews', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.game_reviews src
    where src.user_id is not null and src.game_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'review_add' and f.media_type = 'game' and f.metadata->>'source_table' = 'game_reviews' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.book_reviews') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, rating, review_text, metadata, created_at)
    select src.user_id, 'review_add', 'book', src.book_id::text, src.rating::numeric(3,1), nullif(trim(src.comment), ''),
      jsonb_build_object('source_table', 'book_reviews', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.book_reviews src
    where src.user_id is not null and src.book_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'review_add' and f.media_type = 'book' and f.metadata->>'source_table' = 'book_reviews' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.music_reviews') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, rating, review_text, metadata, created_at)
    select src.user_id, 'review_add', 'music', src.track_id::text, src.rating::numeric(3,1), nullif(trim(src.comment), ''),
      jsonb_build_object('source_table', 'music_reviews', 'source_pk', src.id::text, 'backfill', true),
      coalesce(src.created_at, now())
    from public.music_reviews src
    where src.user_id is not null and src.track_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'review_add' and f.media_type = 'music' and f.metadata->>'source_table' = 'music_reviews' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.user_album_reviews') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, rating, review_text, metadata, created_at)
    select src.user_id, 'review_add', 'music', src.album_id::text, src.rating::numeric(3,1), nullif(trim(src.comment), ''),
      jsonb_build_object('source_table', 'user_album_reviews', 'source_pk', src.id::text, 'item_kind', 'album', 'backfill', true),
      coalesce(src.created_at, now())
    from public.user_album_reviews src
    where src.user_id is not null and src.album_id is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'review_add' and f.media_type = 'music' and f.metadata->>'source_table' = 'user_album_reviews' and f.metadata->>'source_pk' = src.id::text);
  end if;

  if to_regclass('public.journal_entries') is not null then
    insert into public.user_activity_feed (actor_id, event_type, media_type, item_id, rating, review_text, metadata, created_at)
    select src.user_id, 'review_add', 'restaurant',
      coalesce(nullif(to_jsonb(src)->>'restraunt_id', ''), nullif(to_jsonb(src)->>'restaurant_id', '')),
      src.rating::numeric(3,1), nullif(trim(coalesce(to_jsonb(src)->>'notes', '')), ''),
      jsonb_build_object('source_table', 'journal_entries', 'source_pk', src.id::text, 'visit_date', to_jsonb(src)->>'visit_date', 'tags', coalesce(to_jsonb(src)->'tags', '[]'::jsonb), 'backfill', true),
      coalesce(src.created_at, now())
    from public.journal_entries src
    where src.user_id is not null
      and coalesce(nullif(to_jsonb(src)->>'restraunt_id', ''), nullif(to_jsonb(src)->>'restaurant_id', '')) is not null
      and not exists (select 1 from public.user_activity_feed f where f.event_type = 'review_add' and f.media_type = 'restaurant' and f.metadata->>'source_table' = 'journal_entries' and f.metadata->>'source_pk' = src.id::text);
  end if;
end
$$;

drop function if exists public.ensure_activity_trigger(text, text, text, text);
notify pgrst, 'reload schema';

commit;
