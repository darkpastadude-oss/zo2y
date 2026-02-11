-- Supabase SQL: drop old tables, create new schema for books and user lists
-- Run this in Supabase SQL editor or psql connected to your Supabase DB.

-- Enable UUID helper
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop old tables if present
DROP TABLE IF EXISTS book_list_items CASCADE;
DROP TABLE IF EXISTS book_lists CASCADE;
DROP TABLE IF EXISTS books CASCADE;

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT,
  thumbnail TEXT,
  published_date DATE,
  categories TEXT[],
  description TEXT,
  page_count INTEGER,
  publisher TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create book_lists (custom user lists)
CREATE TABLE IF NOT EXISTS book_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create book_list_items to map users/books to lists or to quick lists
CREATE TABLE IF NOT EXISTS book_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  list_type TEXT, -- e.g. 'favorites', 'read', 'readlist' or NULL if using list_id
  list_id UUID NULL REFERENCES book_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_books_title ON books USING gin (to_tsvector('english', coalesce(title,'')));
CREATE INDEX IF NOT EXISTS idx_books_authors ON books USING gin (to_tsvector('english', coalesce(authors,'')));
CREATE INDEX IF NOT EXISTS idx_book_list_items_user ON book_list_items (user_id);
CREATE INDEX IF NOT EXISTS idx_book_list_items_book ON book_list_items (book_id);

-- Example seed rows (replace with your own). Thumbnails use Open Library cover API when available.
INSERT INTO books (id, title, authors, thumbnail, published_date, categories, description, page_count, publisher)
VALUES
('OL1W', 'Pride and Prejudice', 'Jane Austen', 'https://covers.openlibrary.org/b/olid/OL1M-M.jpg', '1813-01-01', ARRAY['Fiction','Romance'], 'A classic novel of manners.', 432, 'T. Egerton'),
('OL2W', 'Murder on the Orient Express', 'Agatha Christie', 'https://covers.openlibrary.org/b/isbn/9780007119318-M.jpg', '1934-01-01', ARRAY['Mystery','Fiction'], 'Hercule Poirot investigates a murder on a train.', 256, 'Collins Crime Club'),
('OL3W', 'The Hobbit', 'J.R.R. Tolkien', 'https://covers.openlibrary.org/b/isbn/9780261102217-M.jpg', '1937-09-21', ARRAY['Fantasy','Fiction'], 'Bilbo Baggins goes on an unexpected journey.', 310, 'George Allen & Unwin'),
('OL4W', 'Sapiens', 'Yuval Noah Harari', 'https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg', '2011-01-01', ARRAY['History','Science'], 'A brief history of humankind.', 498, 'Harper'),
('OL5W', 'Atomic Habits', 'James Clear', 'https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg', '2018-10-16', ARRAY['Self-Help','Business'], 'Tiny changes, remarkable results.', 320, 'Avery')
ON CONFLICT (id) DO NOTHING;

-- Example: create a sample list for a demo user (replace USER_UUID with a real user UUID)
-- INSERT INTO book_lists (user_id, title, icon) VALUES ('USER_UUID', 'My Favorites', 'fas fa-heart');
-- Example: add a book to a quick list for the demo user
-- INSERT INTO book_list_items (user_id, book_id, list_type) VALUES ('USER_UUID', 'OL3W', 'favorites');

-- Notes:
-- - Replace 'USER_UUID' placeholders with actual user IDs from your auth.users table.
-- - The front-end uses book id values like the OpenLibrary work key stripped of "/works/". Match the ids you insert with the ids the front-end will use.
-- - If you prefer thumbnails to point to local files, set `thumbnail` to "/images/your-image.jpg" and upload those images into the site's `images/` folder or Supabase Storage.

-- Optional: keep a materialized view or trigger to update `updated_at` on books
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS books_touch_updated_at ON books;
CREATE TRIGGER books_touch_updated_at
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();

-- Create reviews table for books
CREATE TABLE IF NOT EXISTS book_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_book_reviews_book ON book_reviews (book_id);
CREATE INDEX IF NOT EXISTS idx_book_reviews_user ON book_reviews (user_id);

-- Row Level Security (RLS) and policies
-- Enable RLS and allow public selects for browsing, restrict writes to owners
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public select on books" ON books FOR SELECT USING (true);

ALTER TABLE book_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public select on book_lists" ON book_lists FOR SELECT USING (true);
CREATE POLICY "Insert own book_lists" ON book_lists FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own book_lists" ON book_lists FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own book_lists" ON book_lists FOR DELETE USING (user_id = auth.uid());

ALTER TABLE book_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public select on book_list_items" ON book_list_items FOR SELECT USING (true);
CREATE POLICY "Insert own book_list_items" ON book_list_items FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own book_list_items" ON book_list_items FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own book_list_items" ON book_list_items FOR DELETE USING (user_id = auth.uid());

ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public select on book_reviews" ON book_reviews FOR SELECT USING (true);
CREATE POLICY "Insert own book_reviews" ON book_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own book_reviews" ON book_reviews FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own book_reviews" ON book_reviews FOR DELETE USING (user_id = auth.uid());

-- Notes: Public SELECT policies make lists and reviews readable by anyone (anonymous).
-- If you prefer private lists, change the SELECT policies to restrict by user_id = auth.uid().
