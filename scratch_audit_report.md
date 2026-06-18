# Supabase Query Audit Report

## RPC: `add_item_to_list`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `api/lists-handler.js:240`

## Table: `anime_lists`
- **Actions Used**: select
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `scratch_profile_old.js:8566`

## Table: `anime_reviews`
- **Actions Used**: select, insert, delete
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `anime.html:1458`
  - `anime.html:1630`
  - `anime.html:1636`
  - `anime.html:1659`
  - `anime.html:1681`

## Table: `book_lists`
- **Actions Used**: select
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `scratch_profile_old.js:8958`

## Table: `book_reviews`
- **Actions Used**: select, insert, delete
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `book.html:1548`
  - `book.html:1720`
  - `book.html:1726`
  - `book.html:1749`
  - `book.html:1771`

## Table: `books`
- **Actions Used**: upsert, select
- **Columns Queried**: id, title, authors, thumbnail, published_date, publisher
- **Locations (Sampled up to 10)**:
  - `api/books-handler.js:1176`
  - `book.html:1011`
  - `js/home-desktop-rebrand.js:638`
  - `js/index-books-loader.js:93`
  - `js/index-books-loader.js:146`
  - `js/pages/index.js:11524`
  - `js/reviews-page.js:260`

## Table: `car_brands`
- **Actions Used**: select
- **Columns Queried**: id, name, slug, domain, logo_url, description, category, country, founded, tags
- **Locations (Sampled up to 10)**:
  - `js/pages/index.js:9113`

## RPC: `create_default_user_lists`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `api/auth-handler.js:522`
  - `api/lists-handler.js:395`

## Table: `fashion_brands`
- **Actions Used**: select
- **Columns Queried**: id, name, slug, domain, logo_url, description, category, country, founded, tags
- **Locations (Sampled up to 10)**:
  - `js/pages/index.js:9073`

## Table: `fashion_lists`
- **Actions Used**: select
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `scratch_profile_old.js:9541`

## Table: `follows`
- **Actions Used**: select, delete, insert
- **Columns Queried**: followed_id, id, follower_id, created_at
- **Locations (Sampled up to 10)**:
  - `js/pages/index.js:3308`
  - `js/pages/profile.js:1498`
  - `js/pages/profile.js:1523`
  - `js/pages/profile.js:1544`
  - `js/pages/profile.js:1801`
  - `js/pages/profile.js:1805`
  - `js/pages/profile.js:1925`
  - `js/pages/profile.js:1931`
  - `js/pages/profile.js:2014`
  - `js/pages/profile.js:2020`
  - ...and 21 more.

## Table: `food_brands`
- **Actions Used**: select
- **Columns Queried**: id, name, slug, domain, logo_url, description, category, country, founded, tags
- **Locations (Sampled up to 10)**:
  - `js/pages/index.js:9093`

## Table: `food_lists`
- **Actions Used**: select
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `scratch_profile_old.js:9900`

## Table: `game_lists`
- **Actions Used**: select
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `scratch_profile_old.js:8760`

## Table: `game_reviews`
- **Actions Used**: select, insert, delete
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `game.html:1792`
  - `game.html:1964`
  - `game.html:1970`
  - `game.html:1993`
  - `game.html:2015`

## Table: `games`
- **Actions Used**: select
- **Columns Queried**: id, title, description, cover_url, hero_url, release_date, rating, rating_count, source, igdb_id, rawg_id, slug, extra
- **Locations (Sampled up to 10)**:
  - `game.html:1415`
  - `game.html:2095`
  - `games.html:1786`
  - `games.html:1810`
  - `games.html:1862`
  - `games.html:1880`
  - `js/pages/games-shared.js:276`
  - `js/pages/index.js:2926`
  - `js/pages/index.js:9791`
  - `js/pages/profile.js:4348`
  - ...and 1 more.

## RPC: `get_all_user_items`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `js/pages/profile.js:1739`
  - `js/pages/profile.js:1740`
  - `js/pages/profile.js:1741`
  - `js/pages/profile.js:1742`
  - `js/pages/profile.js:1743`
  - `js/pages/profile.js:1744`
  - `js/pages/profile.js:1808`
  - `js/pages/profile.js:1809`
  - `js/pages/profile.js:1810`
  - `js/pages/profile.js:1811`
  - ...and 3 more.

## RPC: `get_item_list_status`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `api/lists-handler.js:352`

## RPC: `get_list_items`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `api/lists-handler.js:206`

## RPC: `get_user_lists`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `api/lists-handler.js:61`

## Table: `home_spotlight_cache`
- **Actions Used**: select, upsert
- **Columns Queried**: feed_payload, generated_at, expires_at
- **Locations (Sampled up to 10)**:
  - `api/home-feed.js:133`
  - `api/spotlight-precompute.js:254`

## Table: `list_items`
- **Actions Used**: select, insert, delete
- **Columns Queried**: list_id, external_id, added_at, id, *
- **Locations (Sampled up to 10)**:
  - `animes.html:1548`
  - `animes.html:1692`
  - `animes.html:1709`
  - `games.html:2388`
  - `games.html:2812`
  - `games.html:2842`
  - `js/index-books-loader.js:131`
  - `js/pages/brand.js:286`
  - `js/pages/brand.js:307`
  - `js/pages/brand.js:320`
  - ...and 42 more.

## Table: `lists`
- **Actions Used**: select
- **Columns Queried**: id, category, title, *
- **Locations (Sampled up to 10)**:
  - `js/pages/index.js:3780`
  - `js/pages/index.js:4429`
  - `js/pages/profile.js:10979`
  - `scratch_profile_old.js:11047`

## Table: `lists_restraunts`
- **Actions Used**: select
- **Columns Queried**: list_id
- **Locations (Sampled up to 10)**:
  - `js/pages/index.js:3805`
  - `js/pages/index.js:4444`

## Table: `movie_list_items`
- **Actions Used**: select, delete
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `scratch_profile_old.js:4703`
  - `scratch_profile_old.js:4941`
  - `scratch_profile_old.js:4948`

## Table: `movie_lists`
- **Actions Used**: select
- **Columns Queried**: *, user_id
- **Locations (Sampled up to 10)**:
  - `scratch_profile_old.js:4702`
  - `scratch_profile_old.js:4834`
  - `scratch_profile_old.js:4875`
  - `scratch_profile_old.js:8180`

## Table: `movie_reviews`
- **Actions Used**: select, insert, delete
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `movie.html:1600`
  - `movie.html:1772`
  - `movie.html:1778`
  - `movie.html:1801`
  - `movie.html:1823`

## Table: `music_lists`
- **Actions Used**: select
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `scratch_profile_old.js:9157`

## RPC: `remove_item_from_list`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `api/lists-handler.js:273`

## Table: `restaurant_gallery`
- **Actions Used**: select
- **Columns Queried**: restaurant_slug, image_url, image_type
- **Locations (Sampled up to 10)**:
  - `js/pages/index.js:9015`

## Table: `restraunts`
- **Actions Used**: select
- **Columns Queried**: id, name, image, category, rating, slug, logo_url
- **Locations (Sampled up to 10)**:
  - `js/pages/index.js:8989`

## Table: `review_reactions`
- **Actions Used**: select, update, insert
- **Columns Queried**: id, review_source, review_id, target_type, target_id, user_id, reaction_type, created_at
- **Locations (Sampled up to 10)**:
  - `js/review-interactions.js:243`
  - `js/review-interactions.js:489`
  - `js/review-interactions.js:495`
  - `js/review-interactions.js:501`

## Table: `review_replies`
- **Actions Used**: select, insert, delete
- **Columns Queried**: id, review_source, review_id, parent_reply_id, user_id, body, created_at, updated_at
- **Locations (Sampled up to 10)**:
  - `js/review-interactions.js:248`
  - `js/review-interactions.js:570`
  - `js/review-interactions.js:596`

## Table: `security_audit_log`
- **Actions Used**: insert
- **Locations (Sampled up to 10)**:
  - `backend/lib/guardrails.js:531`

## Table: `security_captcha`
- **Actions Used**: upsert, select, update
- **Columns Queried**: answer_hash, expires_at, consumed
- **Locations (Sampled up to 10)**:
  - `backend/lib/guardrails.js:290`
  - `backend/lib/guardrails.js:320`
  - `backend/lib/guardrails.js:331`

## Table: `security_csrf`
- **Actions Used**: upsert, select, delete
- **Columns Queried**: session_hint, expires_at
- **Locations (Sampled up to 10)**:
  - `backend/lib/guardrails.js:372`
  - `backend/lib/guardrails.js:400`
  - `backend/lib/guardrails.js:407`

## Table: `security_lockout`
- **Actions Used**: delete, select
- **Columns Queried**: failed_count, locked_until, last_failed_at
- **Locations (Sampled up to 10)**:
  - `backend/lib/guardrails.js:491`
  - `backend/lib/guardrails.js:507`

## Table: `support_tickets`
- **Actions Used**: select
- **Columns Queried**: id, status, priority, created_at, name, email, category, message, page_url, user_id, source, updated_at, admin_note
- **Locations (Sampled up to 10)**:
  - `api/support-handler.js:208`
  - `api/support-handler.js:236`
  - `api/support-handler.js:278`

## Table: `teams`
- **Actions Used**: select, upsert
- **Columns Queried**: name, logo_url, id, sport, league, *
- **Locations (Sampled up to 10)**:
  - `js/pages/index-home-heavy-loaders.js:1933`
  - `js/pages/index.js:4090`
  - `js/pages/index.js:4136`
  - `js/pages/index.js:10436`
  - `js/pages/sports.js:431`
  - `js/pages/sports.js:498`
  - `js/pages/sports.js:813`
  - `js/pages/sports.js:915`
  - `js/pages/sports.js:923`
  - `js/pages/team.js:577`
  - ...and 5 more.

## RPC: `toggle_list_item`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `api/lists-handler.js:315`

## Table: `tracks`
- **Actions Used**: select, upsert
- **Columns Queried**: id, name, artists, image_url, album_name, external_url, preview_url
- **Locations (Sampled up to 10)**:
  - `js/home-desktop-rebrand.js:660`
  - `js/pages/index.js:4067`
  - `js/pages/index.js:11541`
  - `js/pages/profile.js:4418`
  - `js/pages/profile.js:7951`
  - `js/reviews-page.js:274`
  - `music.html:681`
  - `scratch_profile_old.js:4513`
  - `scratch_profile_old.js:8038`
  - `song.html:840`

## Table: `travel_lists`
- **Actions Used**: select
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `scratch_profile_old.js:9345`

## Table: `travel_plans`
- **Actions Used**: select
- **Locations (Sampled up to 10)**:
  - `js/pages/data-rights.js:81`

## Table: `travel_reviews`
- **Actions Used**: select, update, upsert, delete
- **Columns Queried**: id, user_id, rating, comment, created_at
- **Locations (Sampled up to 10)**:
  - `js/pages/country.js:751`
  - `js/pages/country.js:821`
  - `js/pages/country.js:826`
  - `js/pages/country.js:866`
  - `js/pages/data-rights.js:80`

## Table: `tv_lists`
- **Actions Used**: select
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `scratch_profile_old.js:8372`

## Table: `tv_reviews`
- **Actions Used**: select, insert, delete
- **Columns Queried**: *
- **Locations (Sampled up to 10)**:
  - `tvshow.html:1557`
  - `tvshow.html:1729`
  - `tvshow.html:1735`
  - `tvshow.html:1758`
  - `tvshow.html:1780`

## Table: `user_activity_feed`
- **Actions Used**: select
- **Columns Queried**: id, actor_id, event_type, media_type, external_id, list_type, list_id, rating, review_text, metadata, created_at, item_id
- **Locations (Sampled up to 10)**:
  - `js/pages/profile.js:2065`
  - `js/pages/profile.js:2623`
  - `scratch_profile_old.js:2070`
  - `scratch_profile_old.js:2618`

## Table: `user_favorite_teams`
- **Actions Used**: select, delete, upsert
- **Columns Queried**: id, team_id, teams (id, name, sport, league, logo_url, banner_url, stadium, stadium_url, jersey_url, fanart_url)
- **Locations (Sampled up to 10)**:
  - `js/pages/index.js:4110`
  - `js/pages/index.js:4120`
  - `js/pages/index.js:4144`
  - `js/pages/index.js:4382`
  - `js/pages/profile.js:7194`
  - `js/pages/profile.js:7279`
  - `js/pages/sports.js:414`
  - `js/pages/sports.js:493`
  - `js/pages/sports.js:503`
  - `js/pages/sports.js:807`
  - ...and 6 more.

## Table: `user_interest_profiles`
- **Actions Used**: select, upsert
- **Columns Queried**: interest_types, interest_tags
- **Locations (Sampled up to 10)**:
  - `js/pages/index.js:7715`
  - `js/pages/index.js:9447`

## Table: `user_lists`
- **Actions Used**: select, delete
- **Columns Queried**: id, type, *, user_id, category
- **Locations (Sampled up to 10)**:
  - `animes.html:1539`
  - `animes.html:1685`
  - `animes.html:1701`
  - `api/lists-handler.js:96`
  - `api/lists-handler.js:144`
  - `api/lists-handler.js:178`
  - `games.html:2370`
  - `games.html:2798`
  - `games.html:2826`
  - `js/index-books-loader.js:121`
  - ...and 42 more.

## Table: `user_profiles`
- **Actions Used**: select, upsert, update, insert
- **Columns Queried**: id, username, full_name, onboarding_completed_at, *, avatar_icon
- **Locations (Sampled up to 10)**:
  - `anime.html:1540`
  - `api/auth-handler.js:507`
  - `api/auth-handler.js:537`
  - `book.html:1630`
  - `game.html:1874`
  - `js/auth-gate.js:773`
  - `js/auth-gate.js:781`
  - `js/auth-gate.js:913`
  - `js/auth-gate.js:1474`
  - `js/auth-gate.js:1482`
  - ...and 57 more.

## RPC: `zo2y_accept_tos`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `api/auth-handler.js:529`

## RPC: `zo2y_increment_rate_limit`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `backend/lib/guardrails.js:249`

## RPC: `zo2y_record_failed_auth`
- **Actions Used**: rpc
- **Locations (Sampled up to 10)**:
  - `backend/lib/guardrails.js:453`

