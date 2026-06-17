-- ============================================================================
-- FIX: zo2y_get_accessible_custom_lists RPC returning 400
-- Run this in the Supabase SQL Editor.
-- ============================================================================

-- 1. Ensure list_collaborators table exists with all media types
do $$
begin
  if to_regclass('public.list_collaborators') is null then
    create table public.list_collaborators (
      id uuid primary key default gen_random_uuid(),
      media_type text not null check (media_type in ('movie', 'anime', 'tv', 'game', 'book', 'music', 'sports')),
      list_id text not null,
      list_owner_id uuid not null references auth.users(id) on delete cascade,
      collaborator_id uuid not null references auth.users(id) on delete cascade,
      can_edit boolean not null default false,
      created_at timestamptz default now(),
      unique(media_type, list_id, collaborator_id)
    );
  else
    -- Table exists — update check constraint to include all categories
    alter table public.list_collaborators
      drop constraint if exists list_collaborators_media_type_check;
    alter table public.list_collaborators
      add constraint list_collaborators_media_type_check
      check (media_type in ('movie', 'tv', 'book', 'anime', 'game', 'sport', 'car', 'food', 'fashion', 'travel', 'music'));
  end if;
end
$$;

-- 2. Enable RLS and policies
alter table public.list_collaborators enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'list_collaborators'
      and policyname = 'Public select on list_collaborators'
  ) then
    create policy "Public select on list_collaborators"
      on public.list_collaborators for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'list_collaborators'
      and policyname = 'Insert own list_collaborators'
  ) then
    create policy "Insert own list_collaborators"
      on public.list_collaborators for insert
      with check (auth.uid() = list_owner_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'list_collaborators'
      and policyname = 'Delete own list_collaborators'
  ) then
    create policy "Delete own list_collaborators"
      on public.list_collaborators for delete
      using (auth.uid() = list_owner_id);
  end if;
end
$$;

-- 3. Create/update the RPC function with all media types (uses unified user_lists)
create or replace function public.zo2y_get_accessible_custom_lists(p_media_type text)
returns table (
  id text,
  user_id uuid,
  title text,
  description text,
  icon text,
  created_at timestamptz,
  updated_at timestamptz,
  is_collaborative boolean,
  can_edit boolean,
  list_owner_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_media_type text := lower(trim(coalesce(p_media_type, '')));
  cat_map text;
begin
  if auth.uid() is null then
    return;
  end if;

  -- Map frontend media type to category enum
  cat_map := case safe_media_type
    when 'movie' then 'movie'
    when 'anime' then 'anime'
    when 'tv' then 'tv'
    when 'game' then 'game'
    when 'book' then 'book'
    when 'music' then 'music'
    when 'sports' then 'sport'
    when 'travel' then 'travel'
    when 'fashion' then 'fashion'
    when 'food' then 'food'
    when 'car' then 'car'
    else null
  end;

  if cat_map is null then
    return;
  end if;

  if to_regclass('public.user_lists') is null then
    return;
  end if;

  return query
    with own_lists as (
      select
        l.id::text as id,
        l.user_id,
        l.name as title,
        l.description,
        l.icon,
        l.created_at,
        l.updated_at,
        false as is_collaborative,
        true as can_edit,
        l.user_id as list_owner_id
      from public.user_lists l
      where l.user_id = auth.uid()
        and l.category = cat_map::public.user_list_category
    ),
    shared_lists as (
      select
        l.id::text as id,
        l.user_id,
        l.name as title,
        l.description,
        l.icon,
        l.created_at,
        l.updated_at,
        true as is_collaborative,
        coalesce(lc.can_edit, false) as can_edit,
        lc.list_owner_id
      from public.user_lists l
      join public.list_collaborators lc
        on lc.media_type = safe_media_type
       and lc.list_id = l.id::text
      where lc.collaborator_id = auth.uid()
        and l.category = cat_map::public.user_list_category
    )
    select * from own_lists
    union all
    select * from shared_lists
    order by created_at desc nulls last;
end;
$$;

-- 4. Grant access
grant execute on function public.zo2y_get_accessible_custom_lists(text) to authenticated;
