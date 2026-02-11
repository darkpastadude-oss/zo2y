begin;

-- Ensure profile/book custom-list inserts work even if code sends description.
alter table public.book_lists
  add column if not exists description text default '';

-- Prevent duplicate rows per logical list target.
create unique index if not exists ux_book_list_items_unique_norm
on public.book_list_items (
  user_id,
  book_id,
  coalesce(list_type, ''),
  coalesce(list_id::text, '')
);

-- Normalize legacy '/works/OL...'' ids to 'OL...' ids in books.
insert into public.books (
  id, title, authors, thumbnail, published_date, categories, description, page_count, publisher, created_at, updated_at
)
select
  regexp_replace(id, '^/works/', '') as id,
  title, authors, thumbnail, published_date, categories, description, page_count, publisher, created_at, updated_at
from public.books
where id like '/works/%'
on conflict (id) do update
set
  title = coalesce(excluded.title, public.books.title),
  authors = coalesce(excluded.authors, public.books.authors),
  thumbnail = coalesce(excluded.thumbnail, public.books.thumbnail),
  published_date = coalesce(excluded.published_date, public.books.published_date),
  categories = coalesce(excluded.categories, public.books.categories),
  description = coalesce(excluded.description, public.books.description),
  page_count = coalesce(excluded.page_count, public.books.page_count),
  publisher = coalesce(excluded.publisher, public.books.publisher),
  updated_at = now();

-- Normalize references to books.id used by list items and reviews.
update public.book_list_items
set book_id = regexp_replace(book_id, '^/works/', '')
where book_id like '/works/%';

update public.book_reviews
set book_id = regexp_replace(book_id, '^/works/', '')
where book_id like '/works/%';

-- Remove now-stale legacy keyed rows only when unreferenced.
delete from public.books b
where b.id like '/works/%'
  and not exists (select 1 from public.book_list_items i where i.book_id = b.id)
  and not exists (select 1 from public.book_reviews r where r.book_id = b.id);

commit;
