-- ============================================================
-- Migration 002b: Backfill list_items + reviews from legacy tables
-- ============================================================
-- Run this AFTER 002a completes successfully.
--
-- The legacy schema uses a SINGLE {type}_list_items table per type
-- with a `list_type` column for default lists and `list_id` for
-- custom lists. There are no separate book_favorites etc. tables.
--
-- Movie/TV/Anime/Game items are SKIPPED because their legacy
-- tables store numeric IDs without titles, so no entity can be
-- resolved. Those will be migrated lazily by the app.
-- ============================================================

-- ============================================================
-- 1. Custom list headers → user_lists
-- ============================================================

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='book_lists') then
  insert into public.user_lists (user_id, title) select user_id, title from public.book_lists on conflict do nothing;
end if; end; $$;

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='music_lists') then
  insert into public.user_lists (user_id, title) select user_id, title from public.music_lists on conflict do nothing;
end if; end; $$;

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='movie_lists') then
  insert into public.user_lists (user_id, title) select user_id, title from public.movie_lists on conflict do nothing;
end if; end; $$;

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='tv_lists') then
  insert into public.user_lists (user_id, title) select user_id, title from public.tv_lists on conflict do nothing;
end if; end; $$;

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='anime_lists') then
  insert into public.user_lists (user_id, title) select user_id, title from public.anime_lists on conflict do nothing;
end if; end; $$;

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='game_lists') then
  insert into public.user_lists (user_id, title) select user_id, title from public.game_lists on conflict do nothing;
end if; end; $$;

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='album_lists') then
  insert into public.user_lists (user_id, title) select user_id, name from public.album_lists on conflict do nothing;
end if; end; $$;

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='fashion_lists') then
  insert into public.user_lists (user_id, title) select user_id, title from public.fashion_lists on conflict do nothing;
end if; end; $$;

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='food_lists') then
  insert into public.user_lists (user_id, title) select user_id, title from public.food_lists on conflict do nothing;
end if; end; $$;

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='car_lists') then
  insert into public.user_lists (user_id, title) select user_id, title from public.car_lists on conflict do nothing;
end if; end; $$;

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='travel_lists') then
  insert into public.user_lists (user_id, title) select user_id, title from public.travel_lists on conflict do nothing;
end if; end; $$;

-- ============================================================
-- 2. Book list items → list_items
-- ============================================================

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='book_list_items') then

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select bli.user_id, e.id, (select id from public.system_lists where key = 'favorite'), bli.created_at
from public.book_list_items bli
join public.books bk on bk.id = bli.book_id
join public.entities e on e.title = bk.title and e.entity_type_id = (select id from public.entity_types where key = 'book')
where bli.list_type = 'favorites' and bli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select bli.user_id, e.id, (select id from public.system_lists where key = 'reading'), bli.created_at
from public.book_list_items bli
join public.books bk on bk.id = bli.book_id
join public.entities e on e.title = bk.title and e.entity_type_id = (select id from public.entity_types where key = 'book')
where bli.list_type = 'reading' and bli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select bli.user_id, e.id, (select id from public.system_lists where key = 'completed'), bli.created_at
from public.book_list_items bli
join public.books bk on bk.id = bli.book_id
join public.entities e on e.title = bk.title and e.entity_type_id = (select id from public.entity_types where key = 'book')
where bli.list_type = 'completed' and bli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select bli.user_id, e.id, (select id from public.system_lists where key = 'wishlist'), bli.created_at
from public.book_list_items bli
join public.books bk on bk.id = bli.book_id
join public.entities e on e.title = bk.title and e.entity_type_id = (select id from public.entity_types where key = 'book')
where bli.list_type = 'wishlist' and bli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, list_id, created_at)
select bli.user_id, e.id, ul.id, bli.created_at
from public.book_list_items bli
join public.book_lists bl on bl.id = bli.list_id
join public.books bk on bk.id = bli.book_id
join public.entities e on e.title = bk.title and e.entity_type_id = (select id from public.entity_types where key = 'book')
join public.user_lists ul on ul.user_id = bli.user_id and ul.title = bl.title
where bli.list_id is not null
on conflict (list_id, entity_id) where list_id is not null and system_list_id is null do nothing;

end if; end; $$;

-- ============================================================
-- 3. Music list items → list_items
-- ============================================================

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='music_list_items') then

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select mli.user_id, e.id, (select id from public.system_lists where key = 'favorite'), mli.created_at
from public.music_list_items mli
join public.tracks t on t.id = mli.track_id
join public.entities e on e.title = t.name and e.entity_type_id = (select id from public.entity_types where key = 'music')
where mli.list_type = 'favorites' and mli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, list_id, created_at)
select mli.user_id, e.id, ul.id, mli.created_at
from public.music_list_items mli
join public.music_lists ml on ml.id = mli.list_id
join public.tracks t on t.id = mli.track_id
join public.entities e on e.title = t.name and e.entity_type_id = (select id from public.entity_types where key = 'music')
join public.user_lists ul on ul.user_id = mli.user_id and ul.title = ml.title
where mli.list_id is not null
on conflict (list_id, entity_id) where list_id is not null and system_list_id is null do nothing;

end if; end; $$;

-- ============================================================
-- 4. Album list items → list_items
-- ============================================================
-- Note: album_list_items and album_lists may not exist in all projects.

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='album_list_items') then

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select ali.user_id, e.id, (select id from public.system_lists where key = 'favorite'), ali.created_at
from public.album_list_items ali
join public.albums a on a.album_id = ali.album_id
join public.entities e on e.title = a.name and e.entity_type_id = (select id from public.entity_types where key = 'album')
where ali.list_type = 'favorites' and ali.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select ali.user_id, e.id, (select id from public.system_lists where key = 'listening'), ali.created_at
from public.album_list_items ali
join public.albums a on a.album_id = ali.album_id
join public.entities e on e.title = a.name and e.entity_type_id = (select id from public.entity_types where key = 'album')
where ali.list_type = 'listening' and ali.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select ali.user_id, e.id, (select id from public.system_lists where key = 'completed'), ali.created_at
from public.album_list_items ali
join public.albums a on a.album_id = ali.album_id
join public.entities e on e.title = a.name and e.entity_type_id = (select id from public.entity_types where key = 'album')
where ali.list_type = 'completed' and ali.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select ali.user_id, e.id, (select id from public.system_lists where key = 'wishlist'), ali.created_at
from public.album_list_items ali
join public.albums a on a.album_id = ali.album_id
join public.entities e on e.title = a.name and e.entity_type_id = (select id from public.entity_types where key = 'album')
where ali.list_type = 'wishlist' and ali.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, list_id, created_at)
select ali.user_id, e.id, ul.id, ali.created_at
from public.album_list_items ali
join public.album_lists al on al.id = ali.list_id
join public.albums a on a.album_id = ali.album_id
join public.entities e on e.title = a.name and e.entity_type_id = (select id from public.entity_types where key = 'album')
join public.user_lists ul on ul.user_id = ali.user_id and ul.title = al.name
where ali.list_id is not null
on conflict (list_id, entity_id) where list_id is not null and system_list_id is null do nothing;

end if; end; $$;

-- ============================================================
-- 5. Fashion list items → list_items
-- ============================================================

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='fashion_list_items') then

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select fli.user_id, e.id, (select id from public.system_lists where key = 'favorite'), fli.created_at
from public.fashion_list_items fli
join public.fashion_brands fb on fb.id = fli.brand_id
join public.entities e on e.title = fb.name and e.entity_type_id = (select id from public.entity_types where key = 'fashion')
where fli.list_type = 'favorites' and fli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select fli.user_id, e.id, (select id from public.system_lists where key = 'owned'), fli.created_at
from public.fashion_list_items fli
join public.fashion_brands fb on fb.id = fli.brand_id
join public.entities e on e.title = fb.name and e.entity_type_id = (select id from public.entity_types where key = 'fashion')
where fli.list_type = 'owned' and fli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select fli.user_id, e.id, (select id from public.system_lists where key = 'wishlist'), fli.created_at
from public.fashion_list_items fli
join public.fashion_brands fb on fb.id = fli.brand_id
join public.entities e on e.title = fb.name and e.entity_type_id = (select id from public.entity_types where key = 'fashion')
where fli.list_type = 'wishlist' and fli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, list_id, created_at)
select fli.user_id, e.id, ul.id, fli.created_at
from public.fashion_list_items fli
join public.fashion_lists fl on fl.id = fli.list_id
join public.fashion_brands fb on fb.id = fli.brand_id
join public.entities e on e.title = fb.name and e.entity_type_id = (select id from public.entity_types where key = 'fashion')
join public.user_lists ul on ul.user_id = fli.user_id and ul.title = fl.title
where fli.list_id is not null
on conflict (list_id, entity_id) where list_id is not null and system_list_id is null do nothing;

end if; end; $$;

-- ============================================================
-- 6. Food list items → list_items
-- ============================================================

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='food_list_items') then

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select fli.user_id, e.id, (select id from public.system_lists where key = 'favorite'), fli.created_at
from public.food_list_items fli
join public.food_brands fb on fb.id = fli.brand_id
join public.entities e on e.title = fb.name and e.entity_type_id = (select id from public.entity_types where key = 'food')
where fli.list_type = 'favorites' and fli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select fli.user_id, e.id, (select id from public.system_lists where key = 'tried'), fli.created_at
from public.food_list_items fli
join public.food_brands fb on fb.id = fli.brand_id
join public.entities e on e.title = fb.name and e.entity_type_id = (select id from public.entity_types where key = 'food')
where fli.list_type = 'tried' and fli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select fli.user_id, e.id, (select id from public.system_lists where key = 'wishlist'), fli.created_at
from public.food_list_items fli
join public.food_brands fb on fb.id = fli.brand_id
join public.entities e on e.title = fb.name and e.entity_type_id = (select id from public.entity_types where key = 'food')
where fli.list_type = 'want_to_try' and fli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, list_id, created_at)
select fli.user_id, e.id, ul.id, fli.created_at
from public.food_list_items fli
join public.food_lists fl on fl.id = fli.list_id
join public.food_brands fb on fb.id = fli.brand_id
join public.entities e on e.title = fb.name and e.entity_type_id = (select id from public.entity_types where key = 'food')
join public.user_lists ul on ul.user_id = fli.user_id and ul.title = fl.title
where fli.list_id is not null
on conflict (list_id, entity_id) where list_id is not null and system_list_id is null do nothing;

end if; end; $$;

-- ============================================================
-- 7. Car list items → list_items
-- ============================================================

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='car_list_items') then

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select cli.user_id, e.id, (select id from public.system_lists where key = 'favorite'), cli.created_at
from public.car_list_items cli
join public.car_brands cb on cb.id = cli.brand_id
join public.entities e on e.title = cb.name and e.entity_type_id = (select id from public.entity_types where key = 'car')
where cli.list_type = 'favorites' and cli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select cli.user_id, e.id, (select id from public.system_lists where key = 'owned'), cli.created_at
from public.car_list_items cli
join public.car_brands cb on cb.id = cli.brand_id
join public.entities e on e.title = cb.name and e.entity_type_id = (select id from public.entity_types where key = 'car')
where cli.list_type = 'owned' and cli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select cli.user_id, e.id, (select id from public.system_lists where key = 'wishlist'), cli.created_at
from public.car_list_items cli
join public.car_brands cb on cb.id = cli.brand_id
join public.entities e on e.title = cb.name and e.entity_type_id = (select id from public.entity_types where key = 'car')
where cli.list_type = 'wishlist' and cli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, list_id, created_at)
select cli.user_id, e.id, ul.id, cli.created_at
from public.car_list_items cli
join public.car_lists cl on cl.id = cli.list_id
join public.car_brands cb on cb.id = cli.brand_id
join public.entities e on e.title = cb.name and e.entity_type_id = (select id from public.entity_types where key = 'car')
join public.user_lists ul on ul.user_id = cli.user_id and ul.title = cl.title
where cli.list_id is not null
on conflict (list_id, entity_id) where list_id is not null and system_list_id is null do nothing;

end if; end; $$;

-- ============================================================
-- 8. Travel list items → list_items
-- ============================================================

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='travel_list_items') then

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select tli.user_id, e.id, (select id from public.system_lists where key = 'favorite'), tli.created_at
from public.travel_list_items tli
join public.entities e on e.title = tli.country_code and e.entity_type_id = (select id from public.entity_types where key = 'travel')
where tli.list_type = 'favorites' and tli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select tli.user_id, e.id, (select id from public.system_lists where key = 'visited'), tli.created_at
from public.travel_list_items tli
join public.entities e on e.title = tli.country_code and e.entity_type_id = (select id from public.entity_types where key = 'travel')
where tli.list_type = 'visited' and tli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select tli.user_id, e.id, (select id from public.system_lists where key = 'wishlist'), tli.created_at
from public.travel_list_items tli
join public.entities e on e.title = tli.country_code and e.entity_type_id = (select id from public.entity_types where key = 'travel')
where tli.list_type = 'bucketlist' and tli.list_id is null
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

end if; end; $$;

-- ============================================================
-- 9. Sports favorite teams → list_items
-- ============================================================

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='user_favorite_teams') then

insert into public.list_items (user_id, entity_id, system_list_id, created_at)
select uft.user_id, e.id, (select id from public.system_lists where key = 'favorite'), uft.created_at
from public.user_favorite_teams uft
join public.teams t on t.id = uft.team_id
join public.entities e on e.title = t.name and e.entity_type_id = (select id from public.entity_types where key = 'sport')
on conflict (user_id, entity_id, system_list_id) where list_id is null do nothing;

end if; end; $$;

-- ============================================================
-- 10. Book reviews → reviews
-- ============================================================
-- Only book_reviews can be migrated (book_id is a FK to books).

do $$ begin if exists (select from pg_tables where schemaname='public' and tablename='book_reviews') then

insert into public.reviews (user_id, entity_id, rating, review_text, created_at, updated_at)
select br.user_id, e.id, br.rating, br.comment, br.created_at, br.updated_at
from public.book_reviews br
join public.books bk on bk.id = br.book_id
join public.entities e on e.title = bk.title and e.entity_type_id = (select id from public.entity_types where key = 'book')
on conflict (user_id, entity_id) do nothing;

end if; end; $$;

-- ============================================================
-- Verification
-- ============================================================

select 'Migration 002b complete' as result;
select count(*) as total_user_lists from public.user_lists;
select count(*) as total_list_items from public.list_items;
select count(*) as total_reviews from public.reviews;
