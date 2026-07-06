-- ============================================================
-- Migration 002: Migrate Existing Data
-- Zo2y V2 — Backfill all legacy tables into new unified schema
-- ============================================================
-- This migration is IDEMPOTENT — safe to run multiple times.
-- Does NOT drop any legacy tables.
-- ============================================================

begin;

-- ============================================================
-- 1. Backfill entities from source catalogs
-- ============================================================

-- Helper: ensure entity_type_id by key
do $$
declare
  v_type_id uuid;
begin
  -- Books
  select id into v_type_id from public.entity_types where key = 'book';
  insert into public.entities (entity_type_id, title, subtitle, canonical_name, image_url, slug)
  select v_type_id, b.title, b.author, lower(trim(b.title)), b.cover_url, lower(regexp_replace(trim(b.title), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.books b
  on conflict do nothing;

  -- Music tracks
  select id into v_type_id from public.entity_types where key = 'music';
  insert into public.entities (entity_type_id, title, subtitle, canonical_name, image_url, slug)
  select v_type_id, t.title, t.artist, lower(trim(t.title)), t.cover_url, lower(regexp_replace(trim(t.title), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.tracks t
  on conflict do nothing;

  -- Albums
  select id into v_type_id from public.entity_types where key = 'album';
  insert into public.entities (entity_type_id, title, subtitle, canonical_name, image_url, slug)
  select v_type_id, a.title, a.artist, lower(trim(a.title)), a.cover_url, lower(regexp_replace(trim(a.title), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.albums a
  on conflict do nothing;

  -- Sports teams
  select id into v_type_id from public.entity_types where key = 'sport';
  insert into public.entities (entity_type_id, title, subtitle, canonical_name, image_url, slug)
  select v_type_id, t.name, t.league, lower(trim(t.name)), t.badge_url, lower(regexp_replace(trim(t.name), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.teams t
  on conflict do nothing;

  -- Fashion brands
  select id into v_type_id from public.entity_types where key = 'fashion';
  insert into public.entities (entity_type_id, title, canonical_name, image_url, slug)
  select v_type_id, fb.name, lower(trim(fb.name)), fb.image_url, lower(regexp_replace(trim(fb.name), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.fashion_brands fb
  on conflict do nothing;

  -- Food brands
  select id into v_type_id from public.entity_types where key = 'food';
  insert into public.entities (entity_type_id, title, canonical_name, image_url, slug)
  select v_type_id, fb.name, lower(trim(fb.name)), fb.image_url, lower(regexp_replace(trim(fb.name), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.food_brands fb
  on conflict do nothing;

  -- Car brands
  select id into v_type_id from public.entity_types where key = 'car';
  insert into public.entities (entity_type_id, title, canonical_name, image_url, slug)
  select v_type_id, cb.name, lower(trim(cb.name)), cb.image_url, lower(regexp_replace(trim(cb.name), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.car_brands cb
  on conflict do nothing;
end;
$$;

-- ============================================================
-- 2. Backfill entities from list_items tables (movies, TV, anime, games)
--    These tables store provider IDs directly, not FK to a catalog table.
--    We create minimal entities from the stored title/image fields.
-- ============================================================

do $$
declare
  v_type_id uuid;
begin
  -- Movies
  select id into v_type_id from public.entity_types where key = 'movie';
  insert into public.entities (entity_type_id, title, subtitle, image_url, canonical_name, slug)
  select distinct v_type_id, li.title, li.year::text, li.poster_url,
    lower(coalesce(li.title, 'movie-' || li.movie_id)),
    lower(regexp_replace(coalesce(li.title, 'movie-' || li.movie_id), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.movie_list_items li
  left join public.entities e on e.entity_type_id = v_type_id and e.title = li.title
  where e.id is null and li.title is not null
  on conflict do nothing;

  -- TV
  select id into v_type_id from public.entity_types where key = 'tv';
  insert into public.entities (entity_type_id, title, subtitle, image_url, canonical_name, slug)
  select distinct v_type_id, li.title, li.year::text, li.poster_url,
    lower(coalesce(li.title, 'tv-' || li.show_id)),
    lower(regexp_replace(coalesce(li.title, 'tv-' || li.show_id), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.tv_list_items li
  left join public.entities e on e.entity_type_id = v_type_id and e.title = li.title
  where e.id is null and li.title is not null
  on conflict do nothing;

  -- Anime
  select id into v_type_id from public.entity_types where key = 'anime';
  insert into public.entities (entity_type_id, title, subtitle, image_url, canonical_name, slug)
  select distinct v_type_id, li.title, li.score::text, li.image_url,
    lower(coalesce(li.title, 'anime-' || li.anime_id)),
    lower(regexp_replace(coalesce(li.title, 'anime-' || li.anime_id), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.anime_list_items li
  left join public.entities e on e.entity_type_id = v_type_id and e.title = li.title
  where e.id is null and li.title is not null
  on conflict do nothing;

  -- Games
  select id into v_type_id from public.entity_types where key = 'game';
  insert into public.entities (entity_type_id, title, image_url, canonical_name, slug)
  select distinct v_type_id, li.title, li.cover_url,
    lower(coalesce(li.title, 'game-' || li.game_id)),
    lower(regexp_replace(coalesce(li.title, 'game-' || li.game_id), '[^a-zA-Z0-9]+', '-', 'g'))
  from public.game_list_items li
  left join public.entities e on e.entity_type_id = v_type_id and e.title = li.title
  where e.id is null and li.title is not null
  on conflict do nothing;
end;
$$;

-- ============================================================
-- 3. Backfill content_sources
-- ============================================================

do $$
begin
  -- Books (id = OpenLibrary key, provider = 'openlibrary')
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, 'openlibrary', b.id
  from public.books b
  join public.entities e on e.title = b.title
    and e.entity_type_id = (select id from public.entity_types where key = 'book')
  on conflict (provider, provider_id) do nothing;

  -- Music tracks (provider = 'spotify')
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, 'spotify', t.spotify_id
  from public.tracks t
  join public.entities e on e.title = t.title
    and e.entity_type_id = (select id from public.entity_types where key = 'music')
  on conflict (provider, provider_id) do nothing;

  -- Albums
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, 'spotify', a.spotify_id
  from public.albums a
  join public.entities e on e.title = a.title
    and e.entity_type_id = (select id from public.entity_types where key = 'album')
  on conflict (provider, provider_id) do nothing;

  -- Sports teams (provider = 'thesportsdb')
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, 'thesportsdb', t.team_id::text
  from public.teams t
  join public.entities e on e.title = t.name
    and e.entity_type_id = (select id from public.entity_types where key = 'sport')
  on conflict (provider, provider_id) do nothing;

  -- Fashion brands (provider = provider column or 'unknown')
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, coalesce(fb.provider, 'unknown'), fb.id
  from public.fashion_brands fb
  join public.entities e on e.title = fb.name
    and e.entity_type_id = (select id from public.entity_types where key = 'fashion')
  on conflict (provider, provider_id) do nothing;

  -- Food brands
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, coalesce(fb.provider, 'unknown'), fb.id
  from public.food_brands fb
  join public.entities e on e.title = fb.name
    and e.entity_type_id = (select id from public.entity_types where key = 'food')
  on conflict (provider, provider_id) do nothing;

  -- Car brands
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, coalesce(cb.provider, 'unknown'), cb.id
  from public.car_brands cb
  join public.entities e on e.title = cb.name
    and e.entity_type_id = (select id from public.entity_types where key = 'car')
  on conflict (provider, provider_id) do nothing;

  -- Movies (provider = 'tmdb' by convention)
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, 'tmdb', li.movie_id::text
  from (select distinct movie_id, title from public.movie_list_items where title is not null) li
  join public.entities e on e.title = li.title
    and e.entity_type_id = (select id from public.entity_types where key = 'movie')
  on conflict (provider, provider_id) do nothing;

  -- TV (provider = 'tmdb')
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, 'tmdb', li.show_id::text
  from (select distinct show_id, title from public.tv_list_items where title is not null) li
  join public.entities e on e.title = li.title
    and e.entity_type_id = (select id from public.entity_types where key = 'tv')
  on conflict (provider, provider_id) do nothing;

  -- Anime (provider = 'mal')
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, 'mal', li.anime_id::text
  from (select distinct anime_id, title from public.anime_list_items where title is not null) li
  join public.entities e on e.title = li.title
    and e.entity_type_id = (select id from public.entity_types where key = 'anime')
  on conflict (provider, provider_id) do nothing;

  -- Games (provider = 'igdb')
  insert into public.content_sources (entity_id, provider, provider_id)
  select e.id, 'igdb', li.game_id::text
  from (select distinct game_id, title from public.game_list_items where title is not null) li
  join public.entities e on e.title = li.title
    and e.entity_type_id = (select id from public.entity_types where key = 'game')
  on conflict (provider, provider_id) do nothing;
end;
$$;

-- ============================================================
-- 4. Backfill user_lists from all {type}_lists tables
-- ============================================================

do $$
begin
  -- Book lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.book_lists
  on conflict do nothing;

  -- Music lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.music_lists
  on conflict do nothing;

  -- Movie lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.movie_lists
  on conflict do nothing;

  -- TV lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.tv_lists
  on conflict do nothing;

  -- Anime lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.anime_lists
  on conflict do nothing;

  -- Game lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.game_lists
  on conflict do nothing;

  -- Album lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.album_lists
  on conflict do nothing;

  -- Fashion lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.fashion_lists
  on conflict do nothing;

  -- Food lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.food_lists
  on conflict do nothing;

  -- Car lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.car_lists
  on conflict do nothing;

  -- Travel lists
  insert into public.user_lists (user_id, title)
  select user_id, name
  from public.travel_lists
  on conflict do nothing;
end;
$$;

-- ============================================================
-- 5. Backfill list_items from all {type}_list_items tables
-- ============================================================

do $$
declare
  v_movie_type_id uuid;
  v_tv_type_id    uuid;
  v_anime_type_id uuid;
  v_book_type_id  uuid;
  v_game_type_id  uuid;
  v_music_type_id uuid;
  v_album_type_id uuid;
  v_fashion_type_id uuid;
  v_food_type_id  uuid;
  v_car_type_id   uuid;
  v_travel_type_id uuid;
  v_sport_type_id uuid;
  v_fav_id        uuid;
  v_watching_id   uuid;
  v_completed_id  uuid;
  v_wishlist_id   uuid;
  v_reading_id    uuid;
  v_listening_id  uuid;
  v_playing_id    uuid;
  v_backlog_id    uuid;
  v_owned_id      uuid;
  v_tried_id      uuid;
  v_visited_id    uuid;
begin
  select id into v_movie_type_id  from public.entity_types where key = 'movie';
  select id into v_tv_type_id     from public.entity_types where key = 'tv';
  select id into v_anime_type_id  from public.entity_types where key = 'anime';
  select id into v_book_type_id   from public.entity_types where key = 'book';
  select id into v_game_type_id   from public.entity_types where key = 'game';
  select id into v_music_type_id  from public.entity_types where key = 'music';
  select id into v_album_type_id  from public.entity_types where key = 'album';
  select id into v_fashion_type_id from public.entity_types where key = 'fashion';
  select id into v_food_type_id   from public.entity_types where key = 'food';
  select id into v_car_type_id    from public.entity_types where key = 'car';
  select id into v_travel_type_id from public.entity_types where key = 'travel';
  select id into v_sport_type_id  from public.entity_types where key = 'sport';
  select id into v_fav_id         from public.system_lists where key = 'favorite';
  select id into v_watching_id    from public.system_lists where key = 'watching';
  select id into v_completed_id   from public.system_lists where key = 'completed';
  select id into v_wishlist_id    from public.system_lists where key = 'wishlist';
  select id into v_reading_id     from public.system_lists where key = 'reading';
  select id into v_listening_id   from public.system_lists where key = 'listening';
  select id into v_playing_id     from public.system_lists where key = 'playing';
  select id into v_backlog_id     from public.system_lists where key = 'backlog';
  select id into v_owned_id       from public.system_lists where key = 'owned';
  select id into v_tried_id       from public.system_lists where key = 'tried';
  select id into v_visited_id     from public.system_lists where key = 'visited';

  -- ============= BOOK LIST ITEMS =============
  -- Default lists: favorites, reading, completed, wishlist
  -- book_favorites → system_list = 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, rating, created_at)
  select bf.user_id, e.id, v_fav_id, null, bf.created_at
  from public.book_favorites bf
  join public.books bk on bk.id = bf.book_id
  join public.entities e on e.entity_type_id = v_book_type_id and e.title = bk.title
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- book_reading_list → system_list = 'reading'
  insert into public.list_items (user_id, entity_id, system_list_id, rating, created_at)
  select rl.user_id, e.id, v_reading_id, null, rl.created_at
  from public.book_reading_list rl
  join public.books bk on bk.id = rl.book_id
  join public.entities e on e.entity_type_id = v_book_type_id and e.title = bk.title
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- book_completed → system_list = 'completed'
  insert into public.list_items (user_id, entity_id, system_list_id, rating, created_at)
  select bc.user_id, e.id, v_completed_id, bc.rating, bc.created_at
  from public.book_completed bc
  join public.books bk on bk.id = bc.book_id
  join public.entities e on e.entity_type_id = v_book_type_id and e.title = bk.title
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- book_wishlist → system_list = 'wishlist'
  insert into public.list_items (user_id, entity_id, system_list_id, rating, created_at)
  select bw.user_id, e.id, v_wishlist_id, null, bw.created_at
  from public.book_wishlist bw
  join public.books bk on bk.id = bw.book_id
  join public.entities e on e.entity_type_id = v_book_type_id and e.title = bk.title
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- book_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, rating, created_at)
  select bli.user_id, e.id, ul.id, null, bli.created_at
  from public.book_list_items bli
  join public.book_lists bl on bl.id = bli.list_id
  join public.books bk on bk.id = bli.book_id
  join public.entities e on e.entity_type_id = v_book_type_id and e.title = bk.title
  join public.user_lists ul on ul.user_id = bli.user_id and ul.title = bl.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= MUSIC LIST ITEMS =============
  -- music_favorites → 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select mf.user_id, e.id, v_fav_id, mf.created_at
  from public.music_favorites mf
  join public.tracks t on t.spotify_id = mf.track_id
  join public.entities e on e.entity_type_id = v_music_type_id and e.title = t.title
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- music_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, created_at)
  select mli.user_id, e.id, ul.id, mli.created_at
  from public.music_list_items mli
  join public.music_lists ml on ml.id = mli.list_id
  join public.tracks t on t.spotify_id = mli.track_id
  join public.entities e on e.entity_type_id = v_music_type_id and e.title = t.title
  join public.user_lists ul on ul.user_id = mli.user_id and ul.title = ml.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= MOVIE LIST ITEMS =============
  -- movie_favorites → 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select mf.user_id, e.id, v_fav_id, mf.created_at
  from public.movie_favorites mf
  join public.entities e on e.entity_type_id = v_movie_type_id and e.title = (select title from public.movie_list_items where movie_id = mf.movie_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- movie_watchlist → 'wishlist'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select mw.user_id, e.id, v_wishlist_id, mw.created_at
  from public.movie_watchlist mw
  join public.entities e on e.entity_type_id = v_movie_type_id and e.title = (select title from public.movie_list_items where movie_id = mw.movie_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- movie_watched → 'completed'
  insert into public.list_items (user_id, entity_id, system_list_id, rating, created_at)
  select mw.user_id, e.id, v_completed_id, mw.rating, mw.created_at
  from public.movie_watched mw
  join public.entities e on e.entity_type_id = v_movie_type_id and e.title = (select title from public.movie_list_items where movie_id = mw.movie_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- movie_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, created_at)
  select mli.user_id, e.id, ul.id, mli.created_at
  from public.movie_list_items mli
  join public.movie_lists ml on ml.id = mli.list_id
  join public.entities e on e.entity_type_id = v_movie_type_id and e.title = mli.title
  join public.user_lists ul on ul.user_id = mli.user_id and ul.title = ml.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= TV LIST ITEMS =============
  -- tv_favorites → 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select tf.user_id, e.id, v_fav_id, tf.created_at
  from public.tv_favorites tf
  join public.entities e on e.entity_type_id = v_tv_type_id and e.title = (select title from public.tv_list_items where show_id = tf.show_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- tv_watchlist → 'wishlist'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select tw.user_id, e.id, v_wishlist_id, tw.created_at
  from public.tv_watchlist tw
  join public.entities e on e.entity_type_id = v_tv_type_id and e.title = (select title from public.tv_list_items where show_id = tw.show_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- tv_watched → 'completed'
  insert into public.list_items (user_id, entity_id, system_list_id, rating, created_at)
  select tw.user_id, e.id, v_completed_id, tw.rating, tw.created_at
  from public.tv_watched tw
  join public.entities e on e.entity_type_id = v_tv_type_id and e.title = (select title from public.tv_list_items where show_id = tw.show_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- tv_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, created_at)
  select tli.user_id, e.id, ul.id, tli.created_at
  from public.tv_list_items tli
  join public.tv_lists tl on tl.id = tli.list_id
  join public.entities e on e.entity_type_id = v_tv_type_id and e.title = tli.title
  join public.user_lists ul on ul.user_id = tli.user_id and ul.title = tl.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= ANIME LIST ITEMS =============
  -- anime_favorites → 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select af.user_id, e.id, v_fav_id, af.created_at
  from public.anime_favorites af
  join public.entities e on e.entity_type_id = v_anime_type_id and e.title = (select title from public.anime_list_items where anime_id = af.anime_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- anime_watchlist → 'wishlist'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select aw.user_id, e.id, v_wishlist_id, aw.created_at
  from public.anime_watchlist aw
  join public.entities e on e.entity_type_id = v_anime_type_id and e.title = (select title from public.anime_list_items where anime_id = aw.anime_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- anime_watched → 'completed'
  insert into public.list_items (user_id, entity_id, system_list_id, rating, created_at)
  select aw.user_id, e.id, v_completed_id, aw.rating, aw.created_at
  from public.anime_watched aw
  join public.entities e on e.entity_type_id = v_anime_type_id and e.title = (select title from public.anime_list_items where anime_id = aw.anime_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- anime_plan_to_watch → 'backlog'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select ap.user_id, e.id, v_backlog_id, ap.created_at
  from public.anime_plan_to_watch ap
  join public.entities e on e.entity_type_id = v_anime_type_id and e.title = (select title from public.anime_list_items where anime_id = ap.anime_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- anime_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, created_at)
  select ali.user_id, e.id, ul.id, ali.created_at
  from public.anime_list_items ali
  join public.anime_lists al on al.id = ali.list_id
  join public.entities e on e.entity_type_id = v_anime_type_id and e.title = ali.title
  join public.user_lists ul on ul.user_id = ali.user_id and ul.title = al.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= GAME LIST ITEMS =============
  -- game_favorites → 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select gf.user_id, e.id, v_fav_id, gf.created_at
  from public.game_favorites gf
  join public.entities e on e.entity_type_id = v_game_type_id and e.title = (select title from public.game_list_items where game_id = gf.game_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- game_wishlist → 'wishlist'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select gw.user_id, e.id, v_wishlist_id, gw.created_at
  from public.game_wishlist gw
  join public.entities e on e.entity_type_id = v_game_type_id and e.title = (select title from public.game_list_items where game_id = gw.game_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- game_backlog → 'backlog'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select gb.user_id, e.id, v_backlog_id, gb.created_at
  from public.game_backlog gb
  join public.entities e on e.entity_type_id = v_game_type_id and e.title = (select title from public.game_list_items where game_id = gb.game_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- game_playing → 'playing'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select gp.user_id, e.id, v_playing_id, gp.created_at
  from public.game_playing gp
  join public.entities e on e.entity_type_id = v_game_type_id and e.title = (select title from public.game_list_items where game_id = gp.game_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- game_completed → 'completed'
  insert into public.list_items (user_id, entity_id, system_list_id, rating, created_at)
  select gc.user_id, e.id, v_completed_id, gc.rating, gc.created_at
  from public.game_completed gc
  join public.entities e on e.entity_type_id = v_game_type_id and e.title = (select title from public.game_list_items where game_id = gc.game_id limit 1)
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- game_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, created_at)
  select gli.user_id, e.id, ul.id, gli.created_at
  from public.game_list_items gli
  join public.game_lists gl on gl.id = gli.list_id
  join public.entities e on e.entity_type_id = v_game_type_id and e.title = gli.title
  join public.user_lists ul on ul.user_id = gli.user_id and ul.title = gl.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= ALBUM LIST ITEMS =============
  -- album_favorites → 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select af.user_id, e.id, v_fav_id, af.created_at
  from public.album_favorites af
  join public.albums a on a.spotify_id = af.album_id
  join public.entities e on e.entity_type_id = v_album_type_id and e.title = a.title
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- album_listening → 'listening'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select al.user_id, e.id, v_listening_id, al.created_at
  from public.album_listening al
  join public.albums a on a.spotify_id = al.album_id
  join public.entities e on e.entity_type_id = v_album_type_id and e.title = a.title
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- album_completed → 'completed'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select ac.user_id, e.id, v_completed_id, ac.created_at
  from public.album_completed ac
  join public.albums a on a.spotify_id = ac.album_id
  join public.entities e on e.entity_type_id = v_album_type_id and e.title = a.title
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- album_wishlist → 'wishlist'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select aw.user_id, e.id, v_wishlist_id, aw.created_at
  from public.album_wishlist aw
  join public.albums a on a.spotify_id = aw.album_id
  join public.entities e on e.entity_type_id = v_album_type_id and e.title = a.title
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- album_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, created_at)
  select ali.user_id, e.id, ul.id, ali.created_at
  from public.album_list_items ali
  join public.album_lists al on al.id = ali.list_id
  join public.albums a on a.spotify_id = ali.album_id
  join public.entities e on e.entity_type_id = v_album_type_id and e.title = a.title
  join public.user_lists ul on ul.user_id = ali.user_id and ul.title = al.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= FASHION LIST ITEMS =============
  -- fashion_favorites → 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select ff.user_id, e.id, v_fav_id, ff.created_at
  from public.fashion_favorites ff
  join public.fashion_brands fb on fb.id = ff.brand_id
  join public.entities e on e.entity_type_id = v_fashion_type_id and e.title = fb.name
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- fashion_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, created_at)
  select fli.user_id, e.id, ul.id, fli.created_at
  from public.fashion_list_items fli
  join public.fashion_lists fl on fl.id = fli.list_id
  join public.fashion_brands fb on fb.id = fli.brand_id
  join public.entities e on e.entity_type_id = v_fashion_type_id and e.title = fb.name
  join public.user_lists ul on ul.user_id = fli.user_id and ul.title = fl.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= FOOD LIST ITEMS =============
  -- food_favorites → 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select ff.user_id, e.id, v_fav_id, ff.created_at
  from public.food_favorites ff
  join public.food_brands fb on fb.id = ff.brand_id
  join public.entities e on e.entity_type_id = v_food_type_id and e.title = fb.name
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- food_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, created_at)
  select fli.user_id, e.id, ul.id, fli.created_at
  from public.food_list_items fli
  join public.food_lists fl on fl.id = fli.list_id
  join public.food_brands fb on fb.id = fli.brand_id
  join public.entities e on e.entity_type_id = v_food_type_id and e.title = fb.name
  join public.user_lists ul on ul.user_id = fli.user_id and ul.title = fl.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= CAR LIST ITEMS =============
  -- car_favorites → 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select cf.user_id, e.id, v_fav_id, cf.created_at
  from public.car_favorites cf
  join public.car_brands cb on cb.id = cf.brand_id
  join public.entities e on e.entity_type_id = v_car_type_id and e.title = cb.name
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- car_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, created_at)
  select cli.user_id, e.id, ul.id, cli.created_at
  from public.car_list_items cli
  join public.car_lists cl on cl.id = cli.list_id
  join public.car_brands cb on cb.id = cli.brand_id
  join public.entities e on e.entity_type_id = v_car_type_id and e.title = cb.name
  join public.user_lists ul on ul.user_id = cli.user_id and ul.title = cl.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= TRAVEL LIST ITEMS =============
  -- travel_favorites → 'favorite'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select tf.user_id, e.id, v_fav_id, tf.created_at
  from public.travel_favorites tf
  join public.entities e on e.entity_type_id = v_travel_type_id and e.title = tf.country_name
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- travel_visited → 'visited'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select tv.user_id, e.id, v_visited_id, tv.created_at
  from public.travel_visited tv
  join public.entities e on e.entity_type_id = v_travel_type_id and e.title = tv.country_name
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- travel_wishlist → 'wishlist'
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select tw.user_id, e.id, v_wishlist_id, tw.created_at
  from public.travel_wishlist tw
  join public.entities e on e.entity_type_id = v_travel_type_id and e.title = tw.country_name
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- travel_list_items → custom lists
  insert into public.list_items (user_id, entity_id, list_id, created_at)
  select tli.user_id, e.id, ul.id, tli.created_at
  from public.travel_list_items tli
  join public.travel_lists tl on tl.id = tli.list_id
  join public.entities e on e.entity_type_id = v_travel_type_id and e.title = tli.country_name
  join public.user_lists ul on ul.user_id = tli.user_id and ul.title = tl.name
  on conflict (list_id, entity_id) where list_id is not null
  do nothing;

  -- ============= USER FAVORITE TEAMS =============
  -- user_favorite_teams → 'favorite' (sports)
  insert into public.list_items (user_id, entity_id, system_list_id, created_at)
  select uft.user_id, e.id, v_fav_id, uft.created_at
  from public.user_favorite_teams uft
  join public.teams t on t.team_id = uft.team_id
  join public.entities e on e.entity_type_id = v_sport_type_id and e.title = t.name
  on conflict (user_id, entity_id, system_list_id) where list_id is null
  do nothing;

  -- ============= ARTIST LIST ITEMS =============
  -- artist_list_items → 'favorite' music (artists are treated as entities)
  -- Artists are distinct from tracks; they map to a generic 'music' entity or
  -- we can treat them as a future "music_artist" entity_type. For now, skip
  -- unless the target type exists.
end;
$$;

-- ============================================================
-- 6. Backfill metadata tables
-- ============================================================

do $$
begin
  -- Books
  insert into public.book_metadata (entity_id, pages, published_date)
  select e.id, b.pages, b.publish_date::date
  from public.books b
  join public.entities e on e.title = b.title
    and e.entity_type_id = (select id from public.entity_types where key = 'book')
  on conflict (entity_id) do nothing;

  -- Sports
  insert into public.sports_metadata (entity_id, sport, league, stadium)
  select e.id, t.sport, t.league, t.stadium
  from public.teams t
  join public.entities e on e.title = t.name
    and e.entity_type_id = (select id from public.entity_types where key = 'sport')
  on conflict (entity_id) do nothing;
end;
$$;

-- ============================================================
-- 7. Backfill reviews from all {type}_reviews tables
-- ============================================================

do $$
declare
  v_book_type_id  uuid;
  v_movie_type_id uuid;
  v_tv_type_id    uuid;
  v_anime_type_id uuid;
  v_game_type_id  uuid;
begin
  select id into v_book_type_id  from public.entity_types where key = 'book';
  select id into v_movie_type_id from public.entity_types where key = 'movie';
  select id into v_tv_type_id    from public.entity_types where key = 'tv';
  select id into v_anime_type_id from public.entity_types where key = 'anime';
  select id into v_game_type_id  from public.entity_types where key = 'game';

  -- Book reviews
  insert into public.reviews (user_id, entity_id, rating, review_text, created_at, updated_at)
  select br.user_id, e.id, br.rating, br.review, br.created_at, br.updated_at
  from public.book_reviews br
  join public.books bk on bk.id = br.book_id
  join public.entities e on e.entity_type_id = v_book_type_id and e.title = bk.title
  on conflict (user_id, entity_id) do nothing;

  -- Movie reviews
  insert into public.reviews (user_id, entity_id, rating, review_text, created_at, updated_at)
  select mr.user_id, e.id, mr.rating, mr.review, mr.created_at, mr.updated_at
  from public.movie_reviews mr
  join public.entities e on e.entity_type_id = v_movie_type_id and e.title = (select title from public.movie_list_items where movie_id = mr.movie_id limit 1)
  on conflict (user_id, entity_id) do nothing;

  -- TV reviews
  insert into public.reviews (user_id, entity_id, rating, review_text, created_at, updated_at)
  select tr.user_id, e.id, tr.rating, tr.review, tr.created_at, tr.updated_at
  from public.tv_reviews tr
  join public.entities e on e.entity_type_id = v_tv_type_id and e.title = (select title from public.tv_list_items where show_id = tr.show_id limit 1)
  on conflict (user_id, entity_id) do nothing;

  -- Anime reviews
  insert into public.reviews (user_id, entity_id, rating, review_text, created_at, updated_at)
  select ar.user_id, e.id, ar.rating, ar.review, ar.created_at, ar.updated_at
  from public.anime_reviews ar
  join public.entities e on e.entity_type_id = v_anime_type_id and e.title = (select title from public.anime_list_items where anime_id = ar.anime_id limit 1)
  on conflict (user_id, entity_id) do nothing;

  -- Game reviews
  insert into public.reviews (user_id, entity_id, rating, review_text, created_at, updated_at)
  select gr.user_id, e.id, gr.rating, gr.review, gr.created_at, gr.updated_at
  from public.game_reviews gr
  join public.entities e on e.entity_type_id = v_game_type_id and e.title = (select title from public.game_list_items where game_id = gr.game_id limit 1)
  on conflict (user_id, entity_id) do nothing;
end;
$$;

-- ============================================================
-- 8. Verification queries
-- ============================================================

do $$
declare
  v_new_entities    integer;
  v_new_sources     integer;
  v_new_lists       integer;
  v_new_list_items  integer;
  v_new_reviews     integer;
begin
  select count(*) into v_new_entities   from public.entities;
  select count(*) into v_new_sources    from public.content_sources;
  select count(*) into v_new_lists      from public.user_lists;
  select count(*) into v_new_list_items from public.list_items;
  select count(*) into v_new_reviews    from public.reviews;

  raise notice '=== Migration 002 Verification ===';
  raise notice 'entities:          % rows', v_new_entities;
  raise notice 'content_sources:   % rows', v_new_sources;
  raise notice 'user_lists:        % rows', v_new_lists;
  raise notice 'list_items:        % rows', v_new_list_items;
  raise notice 'reviews:           % rows', v_new_reviews;

  -- Log counts per entity type for validation
  raise notice '';
  raise notice '--- Entities by type ---';
  for r in
    select et.key, count(*)::integer as cnt
    from public.entities e
    join public.entity_types et on et.id = e.entity_type_id
    group by et.key
    order by et.key
  loop
    raise notice '  %: %', r.key, r.cnt;
  end loop;

  raise notice '';
  raise notice '============================================';
end;
$$;

commit;
