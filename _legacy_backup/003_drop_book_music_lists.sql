-- Drop book and music list tables
-- Use CASCADE to automatically drop any depending objects (like foreign keys from items table to lists table)

DROP TABLE IF EXISTS public.book_list_items CASCADE;
DROP TABLE IF EXISTS public.book_lists CASCADE;
DROP TABLE IF EXISTS public.music_list_items CASCADE;
DROP TABLE IF EXISTS public.music_lists CASCADE;
