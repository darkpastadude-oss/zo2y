-- Supabase SQL schema for Fashion + Food brands, lists, and reviews.
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

-- =========================
-- Brand catalogs
-- =========================
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

-- =========================
-- Lists
-- =========================
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
  check (
    list_id is not null
    or list_type in ('favorites', 'owned', 'wishlist')
  )
);

create table if not exists public.food_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references public.food_brands(id) on delete cascade,
  list_type text check (list_type in ('favorites', 'tried', 'want_to_try')),
  list_id uuid null references public.food_lists(id) on delete cascade,
  created_at timestamptz default now(),
  check (
    list_id is not null
    or list_type in ('favorites', 'tried', 'want_to_try')
  )
);

create index if not exists idx_fashion_lists_user on public.fashion_lists(user_id);
create index if not exists idx_food_lists_user on public.food_lists(user_id);
create index if not exists idx_fashion_list_items_user on public.fashion_list_items(user_id);
create index if not exists idx_food_list_items_user on public.food_list_items(user_id);
create index if not exists idx_fashion_list_items_brand on public.fashion_list_items(brand_id);
create index if not exists idx_food_list_items_brand on public.food_list_items(brand_id);

create unique index if not exists ux_fashion_default_items_unique
  on public.fashion_list_items (user_id, brand_id, list_type)
  where list_id is null;
create unique index if not exists ux_fashion_custom_items_unique
  on public.fashion_list_items (list_id, brand_id)
  where list_id is not null;

create unique index if not exists ux_food_default_items_unique
  on public.food_list_items (user_id, brand_id, list_type)
  where list_id is null;
create unique index if not exists ux_food_custom_items_unique
  on public.food_list_items (list_id, brand_id)
  where list_id is not null;

-- =========================
-- Reviews
-- =========================
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

create unique index if not exists ux_fashion_reviews_user_brand
  on public.fashion_reviews (user_id, brand_id);
create unique index if not exists ux_food_reviews_user_brand
  on public.food_reviews (user_id, brand_id);

create or replace function public.touch_brand_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists fashion_reviews_touch_updated_at on public.fashion_reviews;
create trigger fashion_reviews_touch_updated_at
before update on public.fashion_reviews
for each row
execute function public.touch_brand_reviews_updated_at();

drop trigger if exists food_reviews_touch_updated_at on public.food_reviews;
create trigger food_reviews_touch_updated_at
before update on public.food_reviews
for each row
execute function public.touch_brand_reviews_updated_at();

-- =========================
-- RLS
-- =========================
alter table public.fashion_brands enable row level security;
alter table public.food_brands enable row level security;
alter table public.fashion_lists enable row level security;
alter table public.food_lists enable row level security;
alter table public.fashion_list_items enable row level security;
alter table public.food_list_items enable row level security;
alter table public.fashion_reviews enable row level security;
alter table public.food_reviews enable row level security;

-- Brand catalogs: public read
create policy "Public select on fashion_brands" on public.fashion_brands for select using (true);
create policy "Public select on food_brands" on public.food_brands for select using (true);

-- Lists
create policy "Public select on fashion_lists" on public.fashion_lists for select using (true);
create policy "Insert own fashion_lists" on public.fashion_lists for insert with check (user_id = auth.uid());
create policy "Update own fashion_lists" on public.fashion_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own fashion_lists" on public.fashion_lists for delete using (user_id = auth.uid());

create policy "Public select on food_lists" on public.food_lists for select using (true);
create policy "Insert own food_lists" on public.food_lists for insert with check (user_id = auth.uid());
create policy "Update own food_lists" on public.food_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own food_lists" on public.food_lists for delete using (user_id = auth.uid());

-- List items
create policy "Public select on fashion_list_items" on public.fashion_list_items for select using (true);
create policy "Insert own fashion_list_items" on public.fashion_list_items for insert with check (user_id = auth.uid());
create policy "Update own fashion_list_items" on public.fashion_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own fashion_list_items" on public.fashion_list_items for delete using (user_id = auth.uid());

create policy "Public select on food_list_items" on public.food_list_items for select using (true);
create policy "Insert own food_list_items" on public.food_list_items for insert with check (user_id = auth.uid());
create policy "Update own food_list_items" on public.food_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own food_list_items" on public.food_list_items for delete using (user_id = auth.uid());

-- Reviews
create policy "Public select on fashion_reviews" on public.fashion_reviews for select using (true);
create policy "Insert own fashion_reviews" on public.fashion_reviews for insert with check (user_id = auth.uid());
create policy "Update own fashion_reviews" on public.fashion_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own fashion_reviews" on public.fashion_reviews for delete using (user_id = auth.uid());

create policy "Public select on food_reviews" on public.food_reviews for select using (true);
create policy "Insert own food_reviews" on public.food_reviews for insert with check (user_id = auth.uid());
create policy "Update own food_reviews" on public.food_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own food_reviews" on public.food_reviews for delete using (user_id = auth.uid());

-- =========================
-- Seed brands (optional)
-- =========================
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

