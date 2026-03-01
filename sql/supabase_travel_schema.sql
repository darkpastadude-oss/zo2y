-- Supabase SQL schema for Travel lists + reviews used by travel.html and country.html
-- Run in Supabase SQL editor.

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
  check (
    list_id is not null
    or list_type in ('favorites', 'visited', 'bucketlist')
  ),
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

create index if not exists idx_travel_lists_user on public.travel_lists(user_id);
create index if not exists idx_travel_list_items_user on public.travel_list_items(user_id);
create index if not exists idx_travel_list_items_country on public.travel_list_items(country_code);
create index if not exists idx_travel_reviews_country on public.travel_reviews(country_code);
create index if not exists idx_travel_reviews_user on public.travel_reviews(user_id);

drop index if exists ux_travel_list_items_unique;
create unique index if not exists ux_travel_default_items_unique
  on public.travel_list_items (user_id, country_code, list_type)
  where list_id is null;
create unique index if not exists ux_travel_custom_items_unique
  on public.travel_list_items (list_id, country_code)
  where list_id is not null;
create unique index if not exists ux_travel_reviews_user_country
  on public.travel_reviews (user_id, country_code);

create or replace function public.touch_travel_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists travel_reviews_touch_updated_at on public.travel_reviews;
create trigger travel_reviews_touch_updated_at
before update on public.travel_reviews
for each row
execute function public.touch_travel_reviews_updated_at();

alter table public.travel_lists enable row level security;
alter table public.travel_list_items enable row level security;
alter table public.travel_reviews enable row level security;

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
