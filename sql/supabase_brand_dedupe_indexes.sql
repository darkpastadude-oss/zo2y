-- Prevent duplicate brand domains (case-insensitive) for fashion + food.
-- Run in Supabase SQL editor.

create unique index if not exists ux_fashion_brands_domain
  on public.fashion_brands (lower(domain))
  where domain is not null;

create unique index if not exists ux_food_brands_domain
  on public.food_brands (lower(domain))
  where domain is not null;
