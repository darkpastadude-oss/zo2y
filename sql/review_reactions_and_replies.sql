begin;

create extension if not exists pgcrypto;

create or replace function public.zo2y_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.zo2y_review_source_media_type(p_review_source text)
returns text
language plpgsql
immutable
as $$
declare
  safe_source text := lower(trim(coalesce(p_review_source, '')));
begin
  return case safe_source
    when 'movie_reviews' then 'movie'
    when 'tv_reviews' then 'tv'
    when 'anime_reviews' then 'anime'
    when 'game_reviews' then 'game'
    when 'book_reviews' then 'book'
    when 'music_reviews' then 'music'
    when 'user_album_reviews' then 'music'
    when 'travel_reviews' then 'travel'
    when 'journal_entries' then 'restaurant'
    else null
  end;
end;
$$;

create or replace function public.zo2y_review_source_exists(
  p_review_source text,
  p_review_id uuid
)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  safe_source text := lower(trim(coalesce(p_review_source, '')));
  exists_row boolean := false;
begin
  if p_review_id is null or safe_source = '' then
    return false;
  end if;

  if public.zo2y_review_source_media_type(safe_source) is null then
    return false;
  end if;

  if to_regclass(format('public.%s', safe_source)) is null then
    return false;
  end if;

  execute format(
    'select exists (select 1 from public.%I where id = $1)',
    safe_source
  )
  into exists_row
  using p_review_id;

  return coalesce(exists_row, false);
end;
$$;

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_source text not null
    check (public.zo2y_review_source_media_type(review_source) is not null),
  media_type text not null
    check (media_type in ('movie', 'tv', 'anime', 'game', 'book', 'music', 'travel', 'restaurant')),
  review_id uuid not null,
  parent_reply_id uuid null references public.review_replies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.review_replies add column if not exists review_source text;
alter table public.review_replies add column if not exists media_type text;
alter table public.review_replies add column if not exists review_id uuid;
alter table public.review_replies add column if not exists parent_reply_id uuid;
alter table public.review_replies add column if not exists user_id uuid;
alter table public.review_replies add column if not exists body text;
alter table public.review_replies add column if not exists created_at timestamptz default now();
alter table public.review_replies add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.review_replies'::regclass
      and conname = 'review_replies_parent_reply_id_fkey'
  ) then
    alter table public.review_replies
      add constraint review_replies_parent_reply_id_fkey
      foreign key (parent_reply_id) references public.review_replies(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.review_replies'::regclass
      and conname = 'review_replies_user_id_fkey'
  ) then
    alter table public.review_replies
      add constraint review_replies_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end
$$;

create index if not exists idx_review_replies_lookup
  on public.review_replies (review_source, review_id, created_at asc);

create index if not exists idx_review_replies_parent
  on public.review_replies (parent_reply_id, created_at asc);

create index if not exists idx_review_replies_user
  on public.review_replies (user_id, created_at desc);

create table if not exists public.review_reactions (
  id uuid primary key default gen_random_uuid(),
  review_source text not null
    check (public.zo2y_review_source_media_type(review_source) is not null),
  media_type text not null
    check (media_type in ('movie', 'tv', 'anime', 'game', 'book', 'music', 'travel', 'restaurant')),
  review_id uuid not null,
  target_type text not null check (target_type in ('review', 'reply')),
  target_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_source, target_type, target_id, user_id)
);

alter table public.review_reactions add column if not exists review_source text;
alter table public.review_reactions add column if not exists media_type text;
alter table public.review_reactions add column if not exists review_id uuid;
alter table public.review_reactions add column if not exists target_type text;
alter table public.review_reactions add column if not exists target_id uuid;
alter table public.review_reactions add column if not exists user_id uuid;
alter table public.review_reactions add column if not exists reaction_type text;
alter table public.review_reactions add column if not exists created_at timestamptz default now();
alter table public.review_reactions add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.review_reactions'::regclass
      and conname = 'review_reactions_user_id_fkey'
  ) then
    alter table public.review_reactions
      add constraint review_reactions_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end
$$;

do $$
begin
  alter table public.review_replies
    drop constraint if exists review_replies_review_source_check;
  alter table public.review_replies
    drop constraint if exists review_replies_media_type_check;
  alter table public.review_replies
    drop constraint if exists review_replies_body_check;

  alter table public.review_reactions
    drop constraint if exists review_reactions_review_source_check;
  alter table public.review_reactions
    drop constraint if exists review_reactions_media_type_check;
  alter table public.review_reactions
    drop constraint if exists review_reactions_target_type_check;
  alter table public.review_reactions
    drop constraint if exists review_reactions_reaction_type_check;
end
$$;

alter table public.review_replies
  add constraint review_replies_review_source_check
  check (public.zo2y_review_source_media_type(review_source) is not null);

alter table public.review_replies
  add constraint review_replies_media_type_check
  check (media_type in ('movie', 'tv', 'anime', 'game', 'book', 'music', 'travel', 'restaurant'));

alter table public.review_replies
  add constraint review_replies_body_check
  check (char_length(trim(body)) between 1 and 1200);

alter table public.review_reactions
  add constraint review_reactions_review_source_check
  check (public.zo2y_review_source_media_type(review_source) is not null);

alter table public.review_reactions
  add constraint review_reactions_media_type_check
  check (media_type in ('movie', 'tv', 'anime', 'game', 'book', 'music', 'travel', 'restaurant'));

alter table public.review_reactions
  add constraint review_reactions_target_type_check
  check (target_type in ('review', 'reply'));

alter table public.review_reactions
  add constraint review_reactions_reaction_type_check
  check (reaction_type in ('like', 'dislike'));

create unique index if not exists ux_review_reactions_unique
  on public.review_reactions (review_source, target_type, target_id, user_id);

create index if not exists idx_review_reactions_lookup
  on public.review_reactions (review_source, review_id, created_at desc);

create index if not exists idx_review_reactions_target
  on public.review_reactions (review_source, target_type, target_id);

create index if not exists idx_review_reactions_user
  on public.review_reactions (user_id, created_at desc);

create or replace function public.zo2y_validate_review_reply()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  expected_media_type text;
  parent_row public.review_replies%rowtype;
begin
  expected_media_type := public.zo2y_review_source_media_type(new.review_source);
  if expected_media_type is null then
    raise exception 'invalid review_source: %', new.review_source;
  end if;

  new.review_source := lower(trim(new.review_source));
  new.media_type := expected_media_type;
  new.body := trim(coalesce(new.body, ''));

  if not public.zo2y_review_source_exists(new.review_source, new.review_id) then
    raise exception 'review row % does not exist in %', new.review_id, new.review_source;
  end if;

  if new.parent_reply_id is not null then
    select *
    into parent_row
    from public.review_replies
    where id = new.parent_reply_id;

    if not found then
      raise exception 'parent reply % does not exist', new.parent_reply_id;
    end if;

    if parent_row.review_source <> new.review_source
      or parent_row.review_id <> new.review_id
    then
      raise exception 'parent reply must belong to the same review thread';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.zo2y_validate_review_reaction()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  expected_media_type text;
  reply_row public.review_replies%rowtype;
begin
  expected_media_type := public.zo2y_review_source_media_type(new.review_source);
  if expected_media_type is null then
    raise exception 'invalid review_source: %', new.review_source;
  end if;

  new.review_source := lower(trim(new.review_source));
  new.media_type := expected_media_type;

  if not public.zo2y_review_source_exists(new.review_source, new.review_id) then
    raise exception 'review row % does not exist in %', new.review_id, new.review_source;
  end if;

  if new.target_type = 'review' then
    new.target_id := new.review_id;
    return new;
  end if;

  select *
  into reply_row
  from public.review_replies
  where id = new.target_id;

  if not found then
    raise exception 'reply % does not exist', new.target_id;
  end if;

  if reply_row.review_source <> new.review_source
    or reply_row.review_id <> new.review_id
  then
    raise exception 'reply reaction must belong to the same review thread';
  end if;

  return new;
end;
$$;

drop trigger if exists review_replies_validate on public.review_replies;
create trigger review_replies_validate
before insert or update on public.review_replies
for each row execute function public.zo2y_validate_review_reply();

drop trigger if exists review_replies_set_updated_at on public.review_replies;
create trigger review_replies_set_updated_at
before update on public.review_replies
for each row execute function public.zo2y_set_updated_at();

drop trigger if exists review_reactions_validate on public.review_reactions;
create trigger review_reactions_validate
before insert or update on public.review_reactions
for each row execute function public.zo2y_validate_review_reaction();

drop trigger if exists review_reactions_set_updated_at on public.review_reactions;
create trigger review_reactions_set_updated_at
before update on public.review_reactions
for each row execute function public.zo2y_set_updated_at();

alter table public.review_replies enable row level security;
alter table public.review_reactions enable row level security;

drop policy if exists review_replies_select_public on public.review_replies;
create policy review_replies_select_public
on public.review_replies
for select
using (true);

drop policy if exists review_replies_insert_own on public.review_replies;
create policy review_replies_insert_own
on public.review_replies
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists review_replies_update_own on public.review_replies;
create policy review_replies_update_own
on public.review_replies
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists review_replies_delete_own on public.review_replies;
create policy review_replies_delete_own
on public.review_replies
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists review_reactions_select_public on public.review_reactions;
create policy review_reactions_select_public
on public.review_reactions
for select
using (true);

drop policy if exists review_reactions_insert_own on public.review_reactions;
create policy review_reactions_insert_own
on public.review_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists review_reactions_update_own on public.review_reactions;
create policy review_reactions_update_own
on public.review_reactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists review_reactions_delete_own on public.review_reactions;
create policy review_reactions_delete_own
on public.review_reactions
for delete
to authenticated
using (auth.uid() = user_id);

grant select on public.review_replies, public.review_reactions to anon, authenticated;
grant insert, update, delete on public.review_replies, public.review_reactions to authenticated;

notify pgrst, 'reload schema';

commit;
