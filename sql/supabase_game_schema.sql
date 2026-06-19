-- Supabase SQL schema for game reviews used by games.html and game.html
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.game_reviews (
  id uuid primary key default gen_random_uuid(),
  game_id bigint not null,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_game_reviews_game on public.game_reviews(game_id);
create index if not exists idx_game_reviews_user on public.game_reviews(user_id);

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
alter table public.game_reviews enable row level security;

-- game_reviews policies
 drop policy if exists "Public select on game_reviews" on public.game_reviews;
 drop policy if exists "Insert own game_reviews" on public.game_reviews;
 drop policy if exists "Update own game_reviews" on public.game_reviews;
 drop policy if exists "Delete own game_reviews" on public.game_reviews;
create policy "Public select on game_reviews" on public.game_reviews for select using (true);
create policy "Insert own game_reviews" on public.game_reviews for insert with check (user_id = auth.uid());
create policy "Update own game_reviews" on public.game_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own game_reviews" on public.game_reviews for delete using (user_id = auth.uid());
