-- Books Schema
CREATE TABLE IF NOT EXISTS public.book_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.book_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null,
  list_type text,
  list_id uuid null references public.book_lists(id) on delete cascade,
  created_at timestamptz default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_book_list_items_unique
  ON public.book_list_items (user_id, book_id, list_type, list_id);

-- Artists Schema
CREATE TABLE IF NOT EXISTS public.artist_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.artist_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_id text not null,
  list_type text,
  list_id uuid null references public.artist_lists(id) on delete cascade,
  created_at timestamptz default now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_artist_list_items_unique
  ON public.artist_list_items (user_id, artist_id, list_type, list_id);
