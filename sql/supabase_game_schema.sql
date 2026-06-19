-- Supabase SQL schema for game list + review features used by games.html and game.html
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

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

-- Avoid duplicates for the same user and target list bucket
create unique index if not exists ux_game_list_items_unique
  on public.game_list_items (user_id, game_id, list_type, list_id);

-- Optional: keep updated_at fresh on review edits
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

-- RLS
alter table public.game_lists enable row level security;
alter table public.game_list_items enable row level security;
alter table public.game_reviews enable row level security;

-- game_lists policies
 drop policy if exists "Public select on game_lists" on public.game_lists;
 drop policy if exists "Insert own game_lists" on public.game_lists;
 drop policy if exists "Update own game_lists" on public.game_lists;
 drop policy if exists "Delete own game_lists" on public.game_lists;
create policy "Public select on game_lists" on public.game_lists for select using (true);
create policy "Insert own game_lists" on public.game_lists for insert with check (user_id = auth.uid());
create policy "Update own game_lists" on public.game_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own game_lists" on public.game_lists for delete using (user_id = auth.uid());

-- game_list_items policies
 drop policy if exists "Public select on game_list_items" on public.game_list_items;
 drop policy if exists "Insert own game_list_items" on public.game_list_items;
 drop policy if exists "Update own game_list_items" on public.game_list_items;
 drop policy if exists "Delete own game_list_items" on public.game_list_items;
create policy "Public select on game_list_items" on public.game_list_items for select using (true);
create policy "Insert own game_list_items" on public.game_list_items for insert with check (user_id = auth.uid());
create policy "Update own game_list_items" on public.game_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own game_list_items" on public.game_list_items for delete using (user_id = auth.uid());

-- game_reviews policies
 drop policy if exists "Public select on game_reviews" on public.game_reviews;
 drop policy if exists "Insert own game_reviews" on public.game_reviews;
 drop policy if exists "Update own game_reviews" on public.game_reviews;
 drop policy if exists "Delete own game_reviews" on public.game_reviews;
create policy "Public select on game_reviews" on public.game_reviews for select using (true);
create policy "Insert own game_reviews" on public.game_reviews for insert with check (user_id = auth.uid());
create policy "Update own game_reviews" on public.game_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own game_reviews" on public.game_reviews for delete using (user_id = auth.uid());
