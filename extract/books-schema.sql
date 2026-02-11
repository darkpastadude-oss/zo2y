-- Books + Lists + Reviews schema for Zo2y (Supabase/Postgres)
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.books (
  id text primary key,
  title text not null default '',
  authors text[] not null default '{}',
  thumbnail text,
  published_date text,
  categories text[] not null default '{}',
  description text,
  page_count integer,
  publisher text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  icon text default 'fas fa-book',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null references public.books(id) on delete cascade,
  list_type text check (list_type in ('favorites', 'read', 'readlist')),
  list_id uuid references public.book_lists(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint book_list_items_target_check check (
    (list_type is not null and list_id is null) or
    (list_type is null and list_id is not null)
  ),
  constraint book_list_items_unique_default unique (user_id, book_id, list_type),
  constraint book_list_items_unique_custom unique (user_id, book_id, list_id)
);

create table if not exists public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id text not null references public.books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_reviews_unique_per_user unique (book_id, user_id)
);

create index if not exists idx_book_lists_user_id on public.book_lists(user_id);
create index if not exists idx_book_list_items_user_id on public.book_list_items(user_id);
create index if not exists idx_book_list_items_book_id on public.book_list_items(book_id);
create index if not exists idx_book_list_items_list_type on public.book_list_items(list_type);
create index if not exists idx_book_list_items_list_id on public.book_list_items(list_id);
create index if not exists idx_book_reviews_book_id on public.book_reviews(book_id);
create index if not exists idx_book_reviews_user_id on public.book_reviews(user_id);

alter table public.books enable row level security;
alter table public.book_lists enable row level security;
alter table public.book_list_items enable row level security;
alter table public.book_reviews enable row level security;

drop policy if exists books_select_all on public.books;
create policy books_select_all on public.books
for select to authenticated using (true);

drop policy if exists books_insert_auth on public.books;
create policy books_insert_auth on public.books
for insert to authenticated with check (true);

drop policy if exists books_update_auth on public.books;
create policy books_update_auth on public.books
for update to authenticated using (true) with check (true);

drop policy if exists book_lists_select_all on public.book_lists;
create policy book_lists_select_all on public.book_lists
for select to authenticated using (true);

drop policy if exists book_lists_insert_own on public.book_lists;
create policy book_lists_insert_own on public.book_lists
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists book_lists_update_own on public.book_lists;
create policy book_lists_update_own on public.book_lists
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists book_lists_delete_own on public.book_lists;
create policy book_lists_delete_own on public.book_lists
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists book_list_items_select_all on public.book_list_items;
create policy book_list_items_select_all on public.book_list_items
for select to authenticated using (true);

drop policy if exists book_list_items_insert_own on public.book_list_items;
create policy book_list_items_insert_own on public.book_list_items
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists book_list_items_delete_own on public.book_list_items;
create policy book_list_items_delete_own on public.book_list_items
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists book_reviews_select_all on public.book_reviews;
create policy book_reviews_select_all on public.book_reviews
for select to authenticated using (true);

drop policy if exists book_reviews_insert_own on public.book_reviews;
create policy book_reviews_insert_own on public.book_reviews
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists book_reviews_update_own on public.book_reviews;
create policy book_reviews_update_own on public.book_reviews
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists book_reviews_delete_own on public.book_reviews;
create policy book_reviews_delete_own on public.book_reviews
for delete to authenticated using (auth.uid() = user_id);
