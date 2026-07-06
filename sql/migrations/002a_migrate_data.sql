-- ============================================================
-- Migration 002a: Backfill entities and content_sources
-- from legacy catalog tables
-- ============================================================
-- Run this AFTER 001a + 001b complete successfully.
-- ============================================================

-- Books → entities
insert into public.entities (entity_type_id, title, subtitle, canonical_name, image_url, slug)
select (select id from public.entity_types where key = 'book'), b.title, b.authors, lower(trim(b.title)), b.thumbnail, lower(regexp_replace(trim(b.title), '[^a-zA-Z0-9]+', '-', 'g'))
from public.books b
on conflict do nothing;

-- Books → content_sources
insert into public.content_sources (entity_id, provider, provider_id)
select e.id, 'openlibrary', b.id
from public.books b
join public.entities e on e.title = b.title and e.entity_type_id = (select id from public.entity_types where key = 'book')
on conflict (provider, provider_id) do nothing;

-- Music tracks → entities
insert into public.entities (entity_type_id, title, subtitle, canonical_name, image_url, slug)
select (select id from public.entity_types where key = 'music'), t.name, t.artists, lower(trim(t.name)), t.image_url, lower(regexp_replace(trim(t.name), '[^a-zA-Z0-9]+', '-', 'g'))
from public.tracks t
on conflict do nothing;

-- Music tracks → content_sources
insert into public.content_sources (entity_id, provider, provider_id)
select e.id, 'spotify', t.id
from public.tracks t
join public.entities e on e.title = t.name and e.entity_type_id = (select id from public.entity_types where key = 'music')
on conflict (provider, provider_id) do nothing;

-- Albums → entities
insert into public.entities (entity_type_id, title, subtitle, canonical_name, image_url, slug)
select (select id from public.entity_types where key = 'album'), a.name, a.artist_name, lower(trim(a.name)), a.image_url, lower(regexp_replace(trim(a.name), '[^a-zA-Z0-9]+', '-', 'g'))
from public.albums a
on conflict do nothing;

-- Albums → content_sources
insert into public.content_sources (entity_id, provider, provider_id)
select e.id, 'spotify', a.album_id
from public.albums a
join public.entities e on e.title = a.name and e.entity_type_id = (select id from public.entity_types where key = 'album')
on conflict (provider, provider_id) do nothing;

-- Sports teams → entities
insert into public.entities (entity_type_id, title, subtitle, canonical_name, image_url, slug)
select (select id from public.entity_types where key = 'sport'), t.name, t.sport, lower(trim(t.name)), t.logo_url, lower(regexp_replace(trim(t.name), '[^a-zA-Z0-9]+', '-', 'g'))
from public.teams t
on conflict do nothing;

-- Sports teams → content_sources
insert into public.content_sources (entity_id, provider, provider_id)
select e.id, 'thesportsdb', t.id
from public.teams t
join public.entities e on e.title = t.name and e.entity_type_id = (select id from public.entity_types where key = 'sport')
on conflict (provider, provider_id) do nothing;

-- Fashion brands → entities
insert into public.entities (entity_type_id, title, canonical_name, image_url, slug)
select (select id from public.entity_types where key = 'fashion'), fb.name, lower(trim(fb.name)), fb.logo_url, lower(regexp_replace(trim(fb.name), '[^a-zA-Z0-9]+', '-', 'g'))
from public.fashion_brands fb
on conflict do nothing;

-- Fashion brands → content_sources
insert into public.content_sources (entity_id, provider, provider_id)
select e.id, 'unknown', fb.id::text
from public.fashion_brands fb
join public.entities e on e.title = fb.name and e.entity_type_id = (select id from public.entity_types where key = 'fashion')
on conflict (provider, provider_id) do nothing;

-- Food brands → entities
insert into public.entities (entity_type_id, title, canonical_name, image_url, slug)
select (select id from public.entity_types where key = 'food'), fb.name, lower(trim(fb.name)), fb.logo_url, lower(regexp_replace(trim(fb.name), '[^a-zA-Z0-9]+', '-', 'g'))
from public.food_brands fb
on conflict do nothing;

-- Food brands → content_sources
insert into public.content_sources (entity_id, provider, provider_id)
select e.id, 'unknown', fb.id::text
from public.food_brands fb
join public.entities e on e.title = fb.name and e.entity_type_id = (select id from public.entity_types where key = 'food')
on conflict (provider, provider_id) do nothing;

-- Car brands → entities
insert into public.entities (entity_type_id, title, canonical_name, image_url, slug)
select (select id from public.entity_types where key = 'car'), cb.name, lower(trim(cb.name)), cb.logo_url, lower(regexp_replace(trim(cb.name), '[^a-zA-Z0-9]+', '-', 'g'))
from public.car_brands cb
on conflict do nothing;

-- Car brands → content_sources
insert into public.content_sources (entity_id, provider, provider_id)
select e.id, 'unknown', cb.id::text
from public.car_brands cb
join public.entities e on e.title = cb.name and e.entity_type_id = (select id from public.entity_types where key = 'car')
on conflict (provider, provider_id) do nothing;

-- Travel destinations (from travel_list_items.country_code — no catalog table)
insert into public.entities (entity_type_id, title, canonical_name, slug)
select distinct (select id from public.entity_types where key = 'travel'), tli.country_code, lower(trim(tli.country_code)), lower(regexp_replace(trim(tli.country_code), '[^a-zA-Z0-9]+', '-', 'g'))
from public.travel_list_items tli
where tli.country_code is not null
on conflict do nothing;

-- Backfill book_metadata
insert into public.book_metadata (entity_id, pages, published_date)
select e.id, b.page_count, b.published_date
from public.books b
join public.entities e on e.title = b.title and e.entity_type_id = (select id from public.entity_types where key = 'book')
on conflict (entity_id) do nothing;

-- Backfill sports_metadata
insert into public.sports_metadata (entity_id, sport, league, stadium)
select e.id, t.sport, t.league, t.stadium
from public.teams t
join public.entities e on e.title = t.name and e.entity_type_id = (select id from public.entity_types where key = 'sport')
on conflict (entity_id) do nothing;

-- Verification
select 'Migration 002a complete' as result;
select count(*) as total_entities from public.entities;
select et.key, count(*) as entity_count from public.entities e join public.entity_types et on et.id = e.entity_type_id group by et.key order by et.key;
