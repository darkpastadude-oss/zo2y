-- Supabase SQL schema for TV reviews used by tvshows.html and tvshow.html
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.tv_reviews (
  id uuid primary key default gen_random_uuid(),
  tv_id bigint not null,
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tv_reviews_tv on public.tv_reviews(tv_id);
create index if not exists idx_tv_reviews_user on public.tv_reviews(user_id);

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
alter table public.tv_reviews enable row level security;

-- tv_reviews policies
 drop policy if exists "Public select on tv_reviews" on public.tv_reviews;
 drop policy if exists "Insert own tv_reviews" on public.tv_reviews;
 drop policy if exists "Update own tv_reviews" on public.tv_reviews;
 drop policy if exists "Delete own tv_reviews" on public.tv_reviews;
create policy "Public select on tv_reviews" on public.tv_reviews for select using (true);
create policy "Insert own tv_reviews" on public.tv_reviews for insert with check (user_id = auth.uid());
create policy "Update own tv_reviews" on public.tv_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Delete own tv_reviews" on public.tv_reviews for delete using (user_id = auth.uid());
