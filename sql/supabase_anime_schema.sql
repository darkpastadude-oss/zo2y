begin;

create extension if not exists "pgcrypto";

-- =========================
-- Tables
-- =========================

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

-- =========================
-- Indexes
-- =========================

create index if not exists idx_anime_reviews_anime on public.anime_reviews(anime_id);
create index if not exists idx_anime_reviews_user on public.anime_reviews(user_id);
create index if not exists idx_anime_reviews_created_at on public.anime_reviews(created_at desc);

-- =========================
-- Triggers
-- =========================

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

alter table public.anime_reviews enable row level security;

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

commit;
