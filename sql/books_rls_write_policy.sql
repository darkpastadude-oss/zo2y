-- Allow authenticated users to insert/update the shared `books` catalog.
-- This avoids needing a service-role key in your Pages Functions for `/api/books/sync`.
-- Run in Supabase SQL editor.

ALTER TABLE IF EXISTS public.books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert books (authenticated)" ON public.books;
CREATE POLICY "Insert books (authenticated)"
ON public.books
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Update books (authenticated)" ON public.books;
CREATE POLICY "Update books (authenticated)"
ON public.books
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

