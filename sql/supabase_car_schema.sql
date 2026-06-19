-- Supabase SQL schema for Car brands + reviews.
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
alter table public.car_reviews enable row level security;

-- Brand catalogs: public read
create policy "Public select on car_brands" on public.car_brands for select using (true);

-- Reviews
create policy "Public select on car_reviews" on public.car_reviews for select using (true);
create policy "Insert own car_reviews" on public.car_reviews for insert with check (user_id = auth.uid());
create policy "Update own car_reviews" on public.car_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own car_reviews" on public.car_reviews for delete using (user_id = auth.uid());
