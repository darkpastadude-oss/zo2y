begin;

create extension if not exists pgcrypto;

-- =============================================================================
-- Unified media list model (phase 1, backward compatible)
-- - Adds canonical tables: media_lists + media_list_items
-- - Backfills data from legacy per-media list tables
-- - Adds legacy -> unified sync triggers so current app keeps working
-- =============================================================================

create or replace function public.zo2y_safe_uuid(p_text text)
returns uuid
language plpgsql
immutable
as $$
begin
  if p_text is null or btrim(p_text) = '' then
    return null;
  end if;
  begin
    return p_text::uuid;
  exception when others then
    return null;
  end;
end;
$$;

create or replace function public.zo2y_safe_timestamptz(
  p_text text,
  p_fallback timestamptz default now()
)
returns timestamptz
language plpgsql
stable
as $$
begin
  if p_text is null or btrim(p_text) = '' then
    return p_fallback;
  end if;
  begin
    return p_text::timestamptz;
  exception when others then
    return p_fallback;
  end;
end;
$$;

create or replace function public.zo2y_safe_bool(
  p_text text,
  p_fallback boolean default false
)
returns boolean
language plpgsql
immutable
as $$
declare
  v text := lower(btrim(coalesce(p_text, '')));
begin
  if v = '' then
    return p_fallback;
  end if;
  if v in ('true', 't', '1', 'yes', 'y', 'on') then
    return true;
  end if;
  if v in ('false', 'f', '0', 'no', 'n', 'off') then
    return false;
  end if;
  return p_fallback;
end;
$$;

create or replace function public.zo2y_normalize_default_key(p_key text)
returns text
language plpgsql
immutable
as $$
declare
  v text := lower(regexp_replace(coalesce(p_key, ''), '[^a-z0-9]+', '', 'g'));
begin
  if v = '' then
    return null;
  end if;

  if v in ('fav', 'favorite', 'favorites') then return 'favorites'; end if;
  if v in ('watched', 'played') then return 'watched'; end if;
  if v in ('watchlist', 'backlog') then return 'watchlist'; end if;
  if v = 'read' then return 'read'; end if;
  if v = 'readlist' then return 'readlist'; end if;
  if v = 'listened' then return 'listened'; end if;
  if v = 'listenlist' then return 'listenlist'; end if;
  if v = 'visited' then return 'visited'; end if;
  if v in ('bucketlist', 'bucket') then return 'bucketlist'; end if;
  if v in ('wanttogo', 'wanttogoto') then return 'want_to_go'; end if;

  return v;
end;
$$;

create or replace function public.zo2y_normalize_list_kind(p_kind text)
returns text
language plpgsql
immutable
as $$
declare
  v text := lower(btrim(coalesce(p_kind, '')));
begin
  if v in ('tier', 'tierlist', 'tier_list') then
    return 'tier';
  end if;
  return 'standard';
end;
$$;

create or replace function public.zo2y_default_list_title(
  p_media_type text,
  p_default_key text
)
returns text
language plpgsql
immutable
as $$
declare
  media text := lower(btrim(coalesce(p_media_type, '')));
  key text := public.zo2y_normalize_default_key(p_default_key);
begin
  if key is null then return 'List'; end if;

  if key = 'favorites' then return 'Favorites'; end if;
  if key = 'watched' then
    if media = 'game' then return 'Played'; end if;
    return 'Watched';
  end if;
  if key = 'watchlist' then
    if media = 'game' then return 'Backlog'; end if;
    return 'Watchlist';
  end if;
  if key = 'read' then return 'Read'; end if;
  if key = 'readlist' then return 'Readlist'; end if;
  if key = 'listened' then return 'Listened'; end if;
  if key = 'listenlist' then return 'Listenlist'; end if;
  if key = 'visited' then return 'Visited'; end if;
  if key = 'bucketlist' then return 'Bucket List'; end if;
  if key = 'want_to_go' then return 'Want to Go'; end if;

  return initcap(replace(key, '_', ' '));
end;
$$;

create or replace function public.zo2y_default_list_icon(
  p_media_type text,
  p_default_key text
)
returns text
language plpgsql
immutable
as $$
declare
  key text := public.zo2y_normalize_default_key(p_default_key);
begin
  if key = 'favorites' then return 'fas fa-heart'; end if;
  if key in ('visited', 'watched', 'read', 'listened') then return 'fas fa-check'; end if;
  if key in ('watchlist', 'readlist', 'listenlist', 'bucketlist', 'want_to_go') then return 'fas fa-bookmark'; end if;
  return 'fas fa-list';
end;
$$;

create or replace function public.zo2y_default_list_description(
  p_media_type text,
  p_default_key text
)
returns text
language plpgsql
immutable
as $$
declare
  media text := lower(btrim(coalesce(p_media_type, '')));
  key text := public.zo2y_normalize_default_key(p_default_key);
begin
  if key is null then
    return 'Default list';
  end if;

  if media = 'restaurant' then
    if key = 'favorites' then return 'My favorite restaurants'; end if;
    if key = 'visited' then return 'Restaurants I have visited'; end if;
    if key = 'want_to_go' then return 'Restaurants I want to try'; end if;
  end if;

  if key = 'favorites' then return 'Items you love'; end if;
  if key in ('visited', 'watched', 'read', 'listened') then return 'Items you completed'; end if;
  if key in ('watchlist', 'readlist', 'listenlist', 'bucketlist', 'want_to_go') then return 'Items saved for later'; end if;
  return 'Default list';
end;
$$;

create table if not exists public.media_lists (
  id uuid primary key default gen_random_uuid(),
  media_type text not null
    check (media_type in ('restaurant', 'movie', 'tv', 'anime', 'game', 'book', 'music', 'travel')),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  icon text not null default 'fas fa-list',
  is_public boolean not null default false,
  is_default boolean not null default false,
  default_key text null,
  list_kind text not null default 'standard'
    check (list_kind in ('standard', 'tier')),
  legacy_table text null,
  legacy_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_list_items (
  id uuid primary key default gen_random_uuid(),
  media_type text not null
    check (media_type in ('restaurant', 'movie', 'tv', 'anime', 'game', 'book', 'music', 'travel')),
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid not null references public.media_lists(id) on delete cascade,
  item_id text not null,
  source_item_table text null,
  source_item_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_lists_user_media_created
  on public.media_lists (user_id, media_type, created_at desc);

create index if not exists idx_media_lists_media_public_created
  on public.media_lists (media_type, is_public, created_at desc);

create unique index if not exists ux_media_lists_legacy
  on public.media_lists (media_type, legacy_table, legacy_id);

create unique index if not exists ux_media_lists_default_key
  on public.media_lists (media_type, user_id, default_key);

create unique index if not exists ux_media_lists_custom_title
  on public.media_lists (media_type, user_id, lower(title))
  where is_default = false;

create index if not exists idx_media_list_items_list_created
  on public.media_list_items (list_id, created_at desc);

create index if not exists idx_media_list_items_user_media_created
  on public.media_list_items (user_id, media_type, created_at desc);

create index if not exists idx_media_list_items_lookup
  on public.media_list_items (media_type, item_id);

create unique index if not exists ux_media_list_items_unique
  on public.media_list_items (media_type, list_id, item_id);

create unique index if not exists ux_media_list_items_legacy_source
  on public.media_list_items (source_item_table, source_item_id)
  where source_item_table is not null and source_item_id is not null;

create or replace function public.zo2y_media_lists_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_lists_set_updated_at on public.media_lists;
create trigger media_lists_set_updated_at
before update on public.media_lists
for each row execute function public.zo2y_media_lists_set_updated_at();

create or replace function public.zo2y_resolve_legacy_list_owner(
  p_parent_table text,
  p_legacy_list_id text
)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if p_parent_table is null or btrim(p_parent_table) = '' then
    return null;
  end if;
  if p_legacy_list_id is null or btrim(p_legacy_list_id) = '' then
    return null;
  end if;
  if to_regclass('public.' || p_parent_table) is null then
    return null;
  end if;

  execute format(
    'select user_id from public.%I where id::text = $1 limit 1',
    p_parent_table
  )
  into v_user_id
  using p_legacy_list_id;

  return v_user_id;
exception when others then
  return null;
end;
$$;

create or replace function public.zo2y_get_or_create_media_default_list(
  p_user_id uuid,
  p_media_type text,
  p_default_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_media_type text := lower(btrim(coalesce(p_media_type, '')));
  v_default_key text := public.zo2y_normalize_default_key(p_default_key);
  v_list_id uuid;
begin
  if p_user_id is null or v_media_type = '' or v_default_key is null then
    return null;
  end if;

  insert into public.media_lists (
    media_type,
    user_id,
    title,
    description,
    icon,
    is_public,
    is_default,
    default_key,
    list_kind
  )
  values (
    v_media_type,
    p_user_id,
    public.zo2y_default_list_title(v_media_type, v_default_key),
    public.zo2y_default_list_description(v_media_type, v_default_key),
    public.zo2y_default_list_icon(v_media_type, v_default_key),
    false,
    true,
    v_default_key,
    'standard'
  )
  on conflict (media_type, user_id, default_key) do update
  set
    title = excluded.title,
    description = coalesce(nullif(excluded.description, ''), public.media_lists.description),
    icon = coalesce(nullif(excluded.icon, ''), public.media_lists.icon),
    is_default = true,
    updated_at = now()
  returning id into v_list_id;

  return v_list_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Backfill list rows from legacy per-media list tables.
-- -----------------------------------------------------------------------------
do $$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('restaurant', 'lists', 'fas fa-clapperboard', 'Collections'),
      ('movie', 'movie_lists', 'fas fa-film', 'Movie List'),
      ('tv', 'tv_lists', 'fas fa-tv', 'TV List'),
      ('anime', 'anime_lists', 'fas fa-dragon', 'Anime List'),
      ('game', 'game_lists', 'fas fa-gamepad', 'Game List'),
      ('book', 'book_lists', 'fas fa-book', 'Book List'),
      ('music', 'music_lists', 'fas fa-music', 'Music List'),
      ('travel', 'travel_lists', 'fas fa-earth-americas', 'Travel List')
    ) as t(media_type, list_table, default_icon, fallback_title)
  loop
    if to_regclass('public.' || rec.list_table) is null then
      continue;
    end if;

    execute format($sql$
      insert into public.media_lists (
        media_type,
        user_id,
        title,
        description,
        icon,
        is_public,
        is_default,
        default_key,
        list_kind,
        legacy_table,
        legacy_id,
        created_at,
        updated_at
      )
      select
        %L,
        l.user_id,
        coalesce(nullif(trim(coalesce(to_jsonb(l)->>'title', '')), ''), %L),
        coalesce(to_jsonb(l)->>'description', ''),
        coalesce(nullif(trim(coalesce(to_jsonb(l)->>'icon', '')), ''), %L),
        public.zo2y_safe_bool(to_jsonb(l)->>'is_public', false),
        public.zo2y_safe_bool(to_jsonb(l)->>'is_default', false),
        case
          when public.zo2y_safe_bool(to_jsonb(l)->>'is_default', false)
            then public.zo2y_normalize_default_key(
              coalesce(to_jsonb(l)->>'default_key', to_jsonb(l)->>'list_type', to_jsonb(l)->>'title')
            )
          else null
        end,
        public.zo2y_normalize_list_kind(to_jsonb(l)->>'list_kind'),
        %L,
        l.id::text,
        public.zo2y_safe_timestamptz(to_jsonb(l)->>'created_at', now()),
        public.zo2y_safe_timestamptz(
          to_jsonb(l)->>'updated_at',
          public.zo2y_safe_timestamptz(to_jsonb(l)->>'created_at', now())
        )
      from public.%I l
      where l.user_id is not null
      on conflict (media_type, legacy_table, legacy_id) do update
      set
        user_id = excluded.user_id,
        title = excluded.title,
        description = excluded.description,
        icon = excluded.icon,
        is_public = excluded.is_public,
        is_default = excluded.is_default,
        default_key = excluded.default_key,
        list_kind = excluded.list_kind,
        updated_at = greatest(public.media_lists.updated_at, excluded.updated_at)
    $sql$, rec.media_type, rec.fallback_title, rec.default_icon, rec.list_table, rec.list_table);
  end loop;
end $$;

-- Ensure default-list rows exist for legacy default list_type rows.
do $$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('movie', 'movie_list_items'),
      ('tv', 'tv_list_items'),
      ('anime', 'anime_list_items'),
      ('game', 'game_list_items'),
      ('book', 'book_list_items'),
      ('music', 'music_list_items'),
      ('travel', 'travel_list_items')
    ) as t(media_type, item_table)
  loop
    if to_regclass('public.' || rec.item_table) is null then
      continue;
    end if;

    execute format($sql$
      with default_keys as (
        select distinct
          public.zo2y_safe_uuid(to_jsonb(i)->>'user_id') as user_id,
          public.zo2y_normalize_default_key(to_jsonb(i)->>'list_type') as default_key
        from public.%I i
        where coalesce(to_jsonb(i)->>'list_type', '') <> ''
      )
      insert into public.media_lists (
        media_type,
        user_id,
        title,
        description,
        icon,
        is_public,
        is_default,
        default_key,
        list_kind
      )
      select
        %L,
        d.user_id,
        public.zo2y_default_list_title(%L, d.default_key),
        public.zo2y_default_list_description(%L, d.default_key),
        public.zo2y_default_list_icon(%L, d.default_key),
        false,
        true,
        d.default_key,
        'standard'
      from default_keys d
      where d.user_id is not null
        and d.default_key is not null
      on conflict (media_type, user_id, default_key) do update
      set updated_at = now()
    $sql$, rec.item_table, rec.media_type, rec.media_type, rec.media_type, rec.media_type);
  end loop;
end $$;

-- Backfill custom-list item rows (where legacy list_id is present).
do $$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('restaurant', 'lists_restraunts', 'restraunt_id', 'lists'),
      ('movie', 'movie_list_items', 'movie_id', 'movie_lists'),
      ('tv', 'tv_list_items', 'tv_id', 'tv_lists'),
      ('anime', 'anime_list_items', 'anime_id', 'anime_lists'),
      ('game', 'game_list_items', 'game_id', 'game_lists'),
      ('book', 'book_list_items', 'book_id', 'book_lists'),
      ('music', 'music_list_items', 'track_id', 'music_lists'),
      ('travel', 'travel_list_items', 'country_code', 'travel_lists')
    ) as t(media_type, item_table, item_field, parent_table)
  loop
    if to_regclass('public.' || rec.item_table) is null then
      continue;
    end if;

    execute format($sql$
      insert into public.media_list_items (
        media_type,
        user_id,
        list_id,
        item_id,
        source_item_table,
        source_item_id,
        created_at
      )
      select
        %L,
        coalesce(
          public.zo2y_safe_uuid(to_jsonb(i)->>'user_id'),
          public.zo2y_resolve_legacy_list_owner(%L, i.list_id::text)
        ) as user_id,
        ml.id,
        i.%I::text as item_id,
        %L,
        nullif(to_jsonb(i)->>'id', ''),
        public.zo2y_safe_timestamptz(to_jsonb(i)->>'created_at', now())
      from public.%I i
      join public.media_lists ml
        on ml.media_type = %L
       and ml.legacy_table = %L
       and ml.legacy_id = i.list_id::text
      where i.list_id is not null
        and i.%I is not null
        and coalesce(
          public.zo2y_safe_uuid(to_jsonb(i)->>'user_id'),
          public.zo2y_resolve_legacy_list_owner(%L, i.list_id::text)
        ) is not null
      on conflict (media_type, list_id, item_id) do update
      set
        user_id = excluded.user_id,
        source_item_table = coalesce(excluded.source_item_table, public.media_list_items.source_item_table),
        source_item_id = coalesce(excluded.source_item_id, public.media_list_items.source_item_id),
        created_at = least(public.media_list_items.created_at, excluded.created_at)
    $sql$,
      rec.media_type,
      rec.parent_table,
      rec.item_field,
      rec.item_table,
      rec.item_table,
      rec.media_type,
      rec.parent_table,
      rec.item_field,
      rec.parent_table
    );
  end loop;
end $$;

-- Backfill default-list item rows (where legacy list_id is null and list_type is present).
do $$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('movie', 'movie_list_items', 'movie_id'),
      ('tv', 'tv_list_items', 'tv_id'),
      ('anime', 'anime_list_items', 'anime_id'),
      ('game', 'game_list_items', 'game_id'),
      ('book', 'book_list_items', 'book_id'),
      ('music', 'music_list_items', 'track_id'),
      ('travel', 'travel_list_items', 'country_code')
    ) as t(media_type, item_table, item_field)
  loop
    if to_regclass('public.' || rec.item_table) is null then
      continue;
    end if;

    execute format($sql$
      with source_rows as (
        select
          public.zo2y_safe_uuid(to_jsonb(i)->>'user_id') as user_id,
          public.zo2y_normalize_default_key(to_jsonb(i)->>'list_type') as default_key,
          i.%I::text as item_id,
          nullif(to_jsonb(i)->>'id', '') as source_item_id,
          public.zo2y_safe_timestamptz(to_jsonb(i)->>'created_at', now()) as created_at
        from public.%I i
        where i.list_id is null
          and coalesce(to_jsonb(i)->>'list_type', '') <> ''
          and i.%I is not null
      )
      insert into public.media_list_items (
        media_type,
        user_id,
        list_id,
        item_id,
        source_item_table,
        source_item_id,
        created_at
      )
      select
        %L,
        s.user_id,
        public.zo2y_get_or_create_media_default_list(s.user_id, %L, s.default_key),
        s.item_id,
        %L,
        s.source_item_id,
        s.created_at
      from source_rows s
      where s.user_id is not null
        and s.default_key is not null
        and s.item_id is not null
      on conflict (media_type, list_id, item_id) do update
      set
        user_id = excluded.user_id,
        source_item_table = coalesce(excluded.source_item_table, public.media_list_items.source_item_table),
        source_item_id = coalesce(excluded.source_item_id, public.media_list_items.source_item_id),
        created_at = least(public.media_list_items.created_at, excluded.created_at)
    $sql$, rec.item_field, rec.item_table, rec.item_field, rec.media_type, rec.media_type, rec.item_table);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Legacy write sync (old table writes -> unified tables).
-- -----------------------------------------------------------------------------
create or replace function public.zo2y_sync_media_list_from_legacy(
  p_media_type text,
  p_default_icon text default 'fas fa-list'
)
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_media_type text := lower(btrim(coalesce(p_media_type, '')));
  v_legacy_table text := tg_table_name;
  v_legacy_id text;
  v_user_id uuid;
begin
  if tg_op = 'DELETE' then
    delete from public.media_lists
    where media_type = v_media_type
      and legacy_table = v_legacy_table
      and legacy_id = old.id::text;
    return old;
  end if;

  v_payload := to_jsonb(new);
  v_legacy_id := nullif(v_payload->>'id', '');
  v_user_id := public.zo2y_safe_uuid(v_payload->>'user_id');

  if v_media_type = '' or v_legacy_id is null or v_user_id is null then
    return new;
  end if;

  insert into public.media_lists (
    media_type,
    user_id,
    title,
    description,
    icon,
    is_public,
    is_default,
    default_key,
    list_kind,
    legacy_table,
    legacy_id,
    created_at,
    updated_at
  )
  values (
    v_media_type,
    v_user_id,
    coalesce(nullif(trim(coalesce(v_payload->>'title', '')), ''), public.zo2y_default_list_title(v_media_type, null)),
    coalesce(v_payload->>'description', ''),
    coalesce(nullif(trim(coalesce(v_payload->>'icon', '')), ''), p_default_icon),
    public.zo2y_safe_bool(v_payload->>'is_public', false),
    public.zo2y_safe_bool(v_payload->>'is_default', false),
    case
      when public.zo2y_safe_bool(v_payload->>'is_default', false)
        then public.zo2y_normalize_default_key(coalesce(v_payload->>'default_key', v_payload->>'list_type', v_payload->>'title'))
      else null
    end,
    public.zo2y_normalize_list_kind(v_payload->>'list_kind'),
    v_legacy_table,
    v_legacy_id,
    public.zo2y_safe_timestamptz(v_payload->>'created_at', now()),
    public.zo2y_safe_timestamptz(v_payload->>'updated_at', public.zo2y_safe_timestamptz(v_payload->>'created_at', now()))
  )
  on conflict (media_type, legacy_table, legacy_id) do update
  set
    user_id = excluded.user_id,
    title = excluded.title,
    description = excluded.description,
    icon = excluded.icon,
    is_public = excluded.is_public,
    is_default = excluded.is_default,
    default_key = excluded.default_key,
    list_kind = excluded.list_kind,
    updated_at = greatest(public.media_lists.updated_at, excluded.updated_at);

  return new;
end;
$$;

create or replace function public.zo2y_sync_media_item_from_legacy(
  p_media_type text,
  p_item_field text,
  p_parent_table text
)
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_media_type text := lower(btrim(coalesce(p_media_type, '')));
  v_item_field text := btrim(coalesce(p_item_field, ''));
  v_parent_table text := btrim(coalesce(p_parent_table, ''));
  v_payload jsonb;
  v_old_payload jsonb;
  v_item_id text;
  v_user_id uuid;
  v_legacy_list_id text;
  v_default_key text;
  v_unified_list_id uuid;
begin
  if v_media_type = '' or v_item_field = '' then
    return coalesce(new, old);
  end if;

  if tg_op in ('DELETE', 'UPDATE') then
    v_old_payload := to_jsonb(old);
    v_item_id := nullif(v_old_payload->>v_item_field, '');
    if v_item_id is not null then
      v_unified_list_id := null;
      v_legacy_list_id := nullif(v_old_payload->>'list_id', '');
      v_user_id := public.zo2y_safe_uuid(v_old_payload->>'user_id');

      if v_legacy_list_id is not null then
        select ml.id
          into v_unified_list_id
        from public.media_lists ml
        where ml.media_type = v_media_type
          and ml.legacy_table = v_parent_table
          and ml.legacy_id = v_legacy_list_id
        limit 1;
      end if;

      if v_unified_list_id is null then
        if v_user_id is null then
          v_user_id := public.zo2y_resolve_legacy_list_owner(v_parent_table, v_legacy_list_id);
        end if;
        v_default_key := public.zo2y_normalize_default_key(v_old_payload->>'list_type');
        if v_user_id is not null and v_default_key is not null then
          v_unified_list_id := public.zo2y_get_or_create_media_default_list(v_user_id, v_media_type, v_default_key);
        end if;
      end if;

      if v_unified_list_id is not null then
        delete from public.media_list_items
        where media_type = v_media_type
          and list_id = v_unified_list_id
          and item_id = v_item_id;
      else
        delete from public.media_list_items
        where media_type = v_media_type
          and source_item_table = tg_table_name
          and source_item_id = nullif(v_old_payload->>'id', '');
      end if;
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    v_payload := to_jsonb(new);
    v_item_id := nullif(v_payload->>v_item_field, '');
    if v_item_id is null then
      return coalesce(new, old);
    end if;

    v_legacy_list_id := nullif(v_payload->>'list_id', '');
    v_user_id := public.zo2y_safe_uuid(v_payload->>'user_id');
    v_unified_list_id := null;

    if v_legacy_list_id is not null then
      select ml.id
        into v_unified_list_id
      from public.media_lists ml
      where ml.media_type = v_media_type
        and ml.legacy_table = v_parent_table
        and ml.legacy_id = v_legacy_list_id
      limit 1;
    end if;

    if v_user_id is null then
      v_user_id := public.zo2y_resolve_legacy_list_owner(v_parent_table, v_legacy_list_id);
    end if;

    if v_unified_list_id is null then
      v_default_key := public.zo2y_normalize_default_key(v_payload->>'list_type');
      if v_user_id is not null and v_default_key is not null then
        v_unified_list_id := public.zo2y_get_or_create_media_default_list(v_user_id, v_media_type, v_default_key);
      end if;
    end if;

    if v_unified_list_id is null or v_user_id is null then
      return coalesce(new, old);
    end if;

    insert into public.media_list_items (
      media_type,
      user_id,
      list_id,
      item_id,
      source_item_table,
      source_item_id,
      created_at
    )
    values (
      v_media_type,
      v_user_id,
      v_unified_list_id,
      v_item_id,
      tg_table_name,
      nullif(v_payload->>'id', ''),
      public.zo2y_safe_timestamptz(v_payload->>'created_at', now())
    )
    on conflict (media_type, list_id, item_id) do update
    set
      user_id = excluded.user_id,
      source_item_table = coalesce(excluded.source_item_table, public.media_list_items.source_item_table),
      source_item_id = coalesce(excluded.source_item_id, public.media_list_items.source_item_id),
      created_at = least(public.media_list_items.created_at, excluded.created_at);
  end if;

  return coalesce(new, old);
end;
$$;

do $$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('restaurant', 'lists', 'fas fa-clapperboard'),
      ('movie', 'movie_lists', 'fas fa-film'),
      ('tv', 'tv_lists', 'fas fa-tv'),
      ('anime', 'anime_lists', 'fas fa-dragon'),
      ('game', 'game_lists', 'fas fa-gamepad'),
      ('book', 'book_lists', 'fas fa-book'),
      ('music', 'music_lists', 'fas fa-music'),
      ('travel', 'travel_lists', 'fas fa-earth-americas')
    ) as t(media_type, list_table, default_icon)
  loop
    if to_regclass('public.' || rec.list_table) is null then
      continue;
    end if;

    execute format(
      'drop trigger if exists %I on public.%I',
      'trg_sync_' || rec.list_table || '_to_unified',
      rec.list_table
    );
    execute format(
      'create trigger %I
       after insert or update or delete on public.%I
       for each row
       execute function public.zo2y_sync_media_list_from_legacy(%L, %L)',
      'trg_sync_' || rec.list_table || '_to_unified',
      rec.list_table,
      rec.media_type,
      rec.default_icon
    );
  end loop;
end $$;

do $$
declare
  rec record;
begin
  for rec in
    select *
    from (values
      ('restaurant', 'lists_restraunts', 'restraunt_id', 'lists'),
      ('movie', 'movie_list_items', 'movie_id', 'movie_lists'),
      ('tv', 'tv_list_items', 'tv_id', 'tv_lists'),
      ('anime', 'anime_list_items', 'anime_id', 'anime_lists'),
      ('game', 'game_list_items', 'game_id', 'game_lists'),
      ('book', 'book_list_items', 'book_id', 'book_lists'),
      ('music', 'music_list_items', 'track_id', 'music_lists'),
      ('travel', 'travel_list_items', 'country_code', 'travel_lists')
    ) as t(media_type, item_table, item_field, parent_table)
  loop
    if to_regclass('public.' || rec.item_table) is null then
      continue;
    end if;

    execute format(
      'drop trigger if exists %I on public.%I',
      'trg_sync_' || rec.item_table || '_to_unified',
      rec.item_table
    );
    execute format(
      'create trigger %I
       after insert or update or delete on public.%I
       for each row
       execute function public.zo2y_sync_media_item_from_legacy(%L, %L, %L)',
      'trg_sync_' || rec.item_table || '_to_unified',
      rec.item_table,
      rec.media_type,
      rec.item_field,
      rec.parent_table
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- RLS + grants for unified tables
-- -----------------------------------------------------------------------------
alter table public.media_lists enable row level security;
alter table public.media_list_items enable row level security;

drop policy if exists media_lists_select_public on public.media_lists;
create policy media_lists_select_public
on public.media_lists
for select
using (true);

drop policy if exists media_lists_insert_own on public.media_lists;
create policy media_lists_insert_own
on public.media_lists
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists media_lists_update_own on public.media_lists;
create policy media_lists_update_own
on public.media_lists
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists media_lists_delete_own on public.media_lists;
create policy media_lists_delete_own
on public.media_lists
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists media_list_items_select_public on public.media_list_items;
create policy media_list_items_select_public
on public.media_list_items
for select
using (true);

drop policy if exists media_list_items_insert_own on public.media_list_items;
create policy media_list_items_insert_own
on public.media_list_items
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.media_lists l
    where l.id = media_list_items.list_id
      and l.user_id = auth.uid()
      and l.media_type = media_list_items.media_type
  )
);

drop policy if exists media_list_items_update_own on public.media_list_items;
create policy media_list_items_update_own
on public.media_list_items
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.media_lists l
    where l.id = media_list_items.list_id
      and l.user_id = auth.uid()
      and l.media_type = media_list_items.media_type
  )
);

drop policy if exists media_list_items_delete_own on public.media_list_items;
create policy media_list_items_delete_own
on public.media_list_items
for delete
to authenticated
using (auth.uid() = user_id);

grant select on public.media_lists, public.media_list_items to anon;
grant select, insert, update, delete on public.media_lists, public.media_list_items to authenticated;

-- Ensure PostgREST picks up new schema objects immediately.
notify pgrst, 'reload schema';

commit;
