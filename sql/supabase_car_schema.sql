-- Supabase SQL schema for Car brands, lists, and reviews.
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

-- =========================
-- Brand catalogs
-- =========================
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

-- =========================
-- Lists
-- =========================
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
  check (
    list_id is not null
    or list_type in ('favorites', 'owned', 'wishlist')
  )
);

create index if not exists idx_car_lists_user on public.car_lists(user_id);
create index if not exists idx_car_list_items_user on public.car_list_items(user_id);
create index if not exists idx_car_list_items_brand on public.car_list_items(brand_id);

create unique index if not exists ux_car_default_items_unique
  on public.car_list_items (user_id, brand_id, list_type)
  where list_id is null;
create unique index if not exists ux_car_custom_items_unique
  on public.car_list_items (list_id, brand_id)
  where list_id is not null;

-- =========================
-- Reviews
-- =========================
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

create unique index if not exists ux_car_reviews_user_brand
  on public.car_reviews (user_id, brand_id);

create or replace function public.touch_car_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists car_reviews_touch_updated_at on public.car_reviews;
create trigger car_reviews_touch_updated_at
before update on public.car_reviews
for each row
execute function public.touch_car_reviews_updated_at();

-- =========================
-- RLS
-- =========================
alter table public.car_brands enable row level security;
alter table public.car_lists enable row level security;
alter table public.car_list_items enable row level security;
alter table public.car_reviews enable row level security;

-- Brand catalogs: public read
create policy "Public select on car_brands" on public.car_brands for select using (true);

-- Lists
create policy "Public select on car_lists" on public.car_lists for select using (true);
create policy "Insert own car_lists" on public.car_lists for insert with check (user_id = auth.uid());
create policy "Update own car_lists" on public.car_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own car_lists" on public.car_lists for delete using (user_id = auth.uid());

-- List items
create policy "Public select on car_list_items" on public.car_list_items for select using (true);
create policy "Insert own car_list_items" on public.car_list_items for insert with check (user_id = auth.uid());
create policy "Update own car_list_items" on public.car_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own car_list_items" on public.car_list_items for delete using (user_id = auth.uid());

-- Reviews
create policy "Public select on car_reviews" on public.car_reviews for select using (true);
create policy "Insert own car_reviews" on public.car_reviews for insert with check (user_id = auth.uid());
create policy "Update own car_reviews" on public.car_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own car_reviews" on public.car_reviews for delete using (user_id = auth.uid());
