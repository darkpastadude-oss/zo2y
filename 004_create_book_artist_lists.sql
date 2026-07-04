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

ALTER TABLE public.book_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on book_lists" ON public.book_lists;
CREATE POLICY "Public select on book_lists" ON public.book_lists FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert own book_lists" ON public.book_lists;
CREATE POLICY "Insert own book_lists" ON public.book_lists FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Update own book_lists" ON public.book_lists;
CREATE POLICY "Update own book_lists" ON public.book_lists FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Delete own book_lists" ON public.book_lists;
CREATE POLICY "Delete own book_lists" ON public.book_lists FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public select on book_list_items" ON public.book_list_items;
CREATE POLICY "Public select on book_list_items" ON public.book_list_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert own book_list_items" ON public.book_list_items;
CREATE POLICY "Insert own book_list_items" ON public.book_list_items FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Update own book_list_items" ON public.book_list_items;
CREATE POLICY "Update own book_list_items" ON public.book_list_items FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Delete own book_list_items" ON public.book_list_items;
CREATE POLICY "Delete own book_list_items" ON public.book_list_items FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public select on artist_lists" ON public.artist_lists;
CREATE POLICY "Public select on artist_lists" ON public.artist_lists FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert own artist_lists" ON public.artist_lists;
CREATE POLICY "Insert own artist_lists" ON public.artist_lists FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Update own artist_lists" ON public.artist_lists;
CREATE POLICY "Update own artist_lists" ON public.artist_lists FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Delete own artist_lists" ON public.artist_lists;
CREATE POLICY "Delete own artist_lists" ON public.artist_lists FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public select on artist_list_items" ON public.artist_list_items;
CREATE POLICY "Public select on artist_list_items" ON public.artist_list_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert own artist_list_items" ON public.artist_list_items;
CREATE POLICY "Insert own artist_list_items" ON public.artist_list_items FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Update own artist_list_items" ON public.artist_list_items;
CREATE POLICY "Update own artist_list_items" ON public.artist_list_items FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Delete own artist_list_items" ON public.artist_list_items;
CREATE POLICY "Delete own artist_list_items" ON public.artist_list_items FOR DELETE USING (user_id = auth.uid());
