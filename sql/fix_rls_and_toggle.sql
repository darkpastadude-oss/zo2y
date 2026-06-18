-- ============================================================================
-- FIX RLS POLICIES & TOGGLE_LIST_ITEM RPC
-- 
-- 1. Adds missing RLS policies on user_lists and list_items
-- 2. Fixes toggle_list_item to auto-create default lists
-- ============================================================================

begin;

-- ============================================================================
-- 1. RLS POLICIES FOR user_lists
-- ============================================================================
alter table public.user_lists enable row level security;

drop policy if exists "Users select own lists" on public.user_lists;
create policy "Users select own lists"
  on public.user_lists for select
  using (user_id = auth.uid());

drop policy if exists "Users insert own lists" on public.user_lists;
create policy "Users insert own lists"
  on public.user_lists for insert
  with check (user_id = auth.uid());

drop policy if exists "Users update own lists" on public.user_lists;
create policy "Users update own lists"
  on public.user_lists for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users delete own lists" on public.user_lists;
create policy "Users delete own lists"
  on public.user_lists for delete
  using (user_id = auth.uid());

-- ============================================================================
-- 2. RLS POLICIES FOR list_items
-- ============================================================================
alter table public.list_items enable row level security;

drop policy if exists "Users select own list items" on public.list_items;
create policy "Users select own list items"
  on public.list_items for select
  using (
    exists (
      select 1 from public.user_lists
      where user_lists.id = list_items.list_id
        and user_lists.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own list items" on public.list_items;
create policy "Users insert own list items"
  on public.list_items for insert
  with check (
    exists (
      select 1 from public.user_lists
      where user_lists.id = list_items.list_id
        and user_lists.user_id = auth.uid()
    )
  );

drop policy if exists "Users update own list items" on public.list_items;
create policy "Users update own list items"
  on public.list_items for update
  using (
    exists (
      select 1 from public.user_lists
      where user_lists.id = list_items.list_id
        and user_lists.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_lists
      where user_lists.id = list_items.list_id
        and user_lists.user_id = auth.uid()
    )
  );

drop policy if exists "Users delete own list items" on public.list_items;
create policy "Users delete own list items"
  on public.list_items for delete
  using (
    exists (
      select 1 from public.user_lists
      where user_lists.id = list_items.list_id
        and user_lists.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. FIX toggle_list_item RPC - auto-create default lists
-- ============================================================================
create or replace function public.toggle_list_item(
  p_user_id uuid,
  p_category text,
  p_list_type text,
  p_external_id text,
  p_external_source text default 'local_db',
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_list_id uuid;
  v_exists boolean;
  v_cat public.user_list_category;
begin
  v_cat := p_category::public.user_list_category;

  -- Locate or auto-create default list
  select id into v_list_id
  from public.user_lists
  where user_id = p_user_id
    and category = v_cat
    and type = p_list_type
  limit 1;

  if v_list_id is null then
    insert into public.user_lists (user_id, name, category, type, description)
    values (p_user_id, initcap(p_list_type), v_cat, p_list_type, 'Auto-generated list')
    returning id into v_list_id;
  end if;

  select exists(
    select 1 from public.list_items
    where list_id = v_list_id and external_id = p_external_id
  ) into v_exists;

  if v_exists then
    delete from public.list_items
    where list_id = v_list_id and external_id = p_external_id;
    return jsonb_build_object('action', 'removed', 'list_id', v_list_id);
  else
    insert into public.list_items (list_id, external_id, external_source, external_type, metadata)
    values (v_list_id, p_external_id, p_external_source, v_cat, coalesce(p_metadata, '{}'::jsonb))
    on conflict (list_id, external_id) do nothing;
    return jsonb_build_object('action', 'added', 'list_id', v_list_id);
  end if;
end;
$$;
grant execute on function public.toggle_list_item(uuid, text, text, text, text, jsonb) to authenticated;

-- ============================================================================
-- 4. FIX get_item_list_status RPC
-- ============================================================================
create or replace function public.get_item_list_status(
  p_user_id uuid,
  p_category text,
  p_external_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_cat public.user_list_category;
begin
  v_cat := p_category::public.user_list_category;

  select jsonb_object_agg(ul.type, true)
  into v_result
  from public.list_items li
  join public.user_lists ul on ul.id = li.list_id
  where ul.user_id = p_user_id
    and ul.category = v_cat
    and li.external_id = p_external_id;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;
grant execute on function public.get_item_list_status(uuid, text, text) to authenticated;

-- ============================================================================
-- 5. Ensure unique index for user+category+type
-- ============================================================================
drop index if exists user_lists_identity_idx;
create unique index if not exists user_lists_identity_idx on public.user_lists(user_id, category, type);

notify pgrst, 'reload schema';

commit;
