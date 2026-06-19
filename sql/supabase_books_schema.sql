-- Supabase SQL: schema for books catalog + book reviews
-- Run this in Supabase SQL editor or psql connected to your Supabase DB.

-- Enable UUID helper
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop old tables if present
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

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_books_title ON books USING gin (to_tsvector('english', coalesce(title,'')));
CREATE INDEX IF NOT EXISTS idx_books_authors ON books USING gin (to_tsvector('english', coalesce(authors,'')));

-- Example seed rows (replace with your own). Thumbnails use Open Library cover API when available.
INSERT INTO books (id, title, authors, thumbnail, published_date, categories, description, page_count, publisher)
VALUES
('OL1W', 'Pride and Prejudice', 'Jane Austen', 'https://covers.openlibrary.org/b/olid/OL1M-M.jpg', '1813-01-01', ARRAY['Fiction','Romance'], 'A classic novel of manners.', 432, 'T. Egerton'),
('OL2W', 'Murder on the Orient Express', 'Agatha Christie', 'https://covers.openlibrary.org/b/isbn/9780007119318-M.jpg', '1934-01-01', ARRAY['Mystery','Fiction'], 'Hercule Poirot investigates a murder on a train.', 256, 'Collins Crime Club'),
('OL3W', 'The Hobbit', 'J.R.R. Tolkien', 'https://covers.openlibrary.org/b/isbn/9780261102217-M.jpg', '1937-09-21', ARRAY['Fantasy','Fiction'], 'Bilbo Baggins goes on an unexpected journey.', 310, 'George Allen & Unwin'),
('OL4W', 'Sapiens', 'Yuval Noah Harari', 'https://covers.openlibrary.org/b/isbn/9780062316097-M.jpg', '2011-01-01', ARRAY['History','Science'], 'A brief history of humankind.', 498, 'Harper'),
('OL5W', 'Atomic Habits', 'James Clear', 'https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg', '2018-10-16', ARRAY['Self-Help','Business'], 'Tiny changes, remarkable results.', 320, 'Avery')
ON CONFLICT (id) DO NOTHING;

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
DROP POLICY IF EXISTS "Public select on books" ON books;
CREATE POLICY "Public select on books" ON books FOR SELECT USING (true);

ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select on book_reviews" ON book_reviews;
DROP POLICY IF EXISTS "Insert own book_reviews" ON book_reviews;
DROP POLICY IF EXISTS "Update own book_reviews" ON book_reviews;
DROP POLICY IF EXISTS "Delete own book_reviews" ON book_reviews;
CREATE POLICY "Public select on book_reviews" ON book_reviews FOR SELECT USING (true);
CREATE POLICY "Insert own book_reviews" ON book_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own book_reviews" ON book_reviews FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own book_reviews" ON book_reviews FOR DELETE USING (user_id = auth.uid());
