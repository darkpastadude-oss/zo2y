-- Supabase SQL schema for TV list + review features used by tvshows.html and tvshow.html
-- Run in Supabase SQL editor.

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

-- Avoid duplicates for the same user and target list bucket
create unique index if not exists ux_tv_list_items_unique
  on public.tv_list_items (user_id, tv_id, list_type, list_id);

-- Optional: keep updated_at fresh on review edits
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

-- RLS
alter table public.tv_lists enable row level security;
alter table public.tv_list_items enable row level security;
alter table public.tv_reviews enable row level security;

-- tv_lists policies
 drop policy if exists "Public select on tv_lists" on public.tv_lists;
 drop policy if exists "Insert own tv_lists" on public.tv_lists;
 drop policy if exists "Update own tv_lists" on public.tv_lists;
 drop policy if exists "Delete own tv_lists" on public.tv_lists;
create policy "Public select on tv_lists" on public.tv_lists for select using (true);
create policy "Insert own tv_lists" on public.tv_lists for insert with check (user_id = auth.uid());
create policy "Update own tv_lists" on public.tv_lists for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own tv_lists" on public.tv_lists for delete using (user_id = auth.uid());

-- tv_list_items policies
 drop policy if exists "Public select on tv_list_items" on public.tv_list_items;
 drop policy if exists "Insert own tv_list_items" on public.tv_list_items;
 drop policy if exists "Update own tv_list_items" on public.tv_list_items;
 drop policy if exists "Delete own tv_list_items" on public.tv_list_items;
create policy "Public select on tv_list_items" on public.tv_list_items for select using (true);
create policy "Insert own tv_list_items" on public.tv_list_items for insert with check (user_id = auth.uid());
create policy "Update own tv_list_items" on public.tv_list_items for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own tv_list_items" on public.tv_list_items for delete using (user_id = auth.uid());

-- tv_reviews policies
 drop policy if exists "Public select on tv_reviews" on public.tv_reviews;
 drop policy if exists "Insert own tv_reviews" on public.tv_reviews;
 drop policy if exists "Update own tv_reviews" on public.tv_reviews;
 drop policy if exists "Delete own tv_reviews" on public.tv_reviews;
create policy "Public select on tv_reviews" on public.tv_reviews for select using (true);
create policy "Insert own tv_reviews" on public.tv_reviews for insert with check (user_id = auth.uid());
create policy "Update own tv_reviews" on public.tv_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own tv_reviews" on public.tv_reviews for delete using (user_id = auth.uid());
