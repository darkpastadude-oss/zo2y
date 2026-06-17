-- Clean up duplicate custom lists that shadow default list names
-- Created during migration when old per-category tables had entries
-- like "Favorites" that were migrated as custom (type='custom') while
-- create_default_user_lists also created the same names with correct types.

-- Default list names by category
-- Favorites, Watched/Read/Played/Visited/..., Watchlist/Backlog/...

do $$
declare
  v_rec record;
  v_default_id uuid;
  v_item_count int;
  v_total_deleted int := 0;
  v_total_moved int := 0;
begin
  -- Find all custom lists whose name matches a default list for same user+category
  for v_rec in
    select ul.id as custom_id, ul.user_id, ul.category, ul.name, dl.id as default_id
    from public.user_lists ul
    join public.user_lists dl on dl.user_id = ul.user_id
      and dl.category = ul.category
      and dl.type != 'custom'
      and dl.name = ul.name
    where ul.type = 'custom'
  loop
    -- Move any items from the duplicate custom list to the correct default list
    select count(*) into v_item_count
    from public.list_items
    where list_id = v_rec.custom_id;

    if v_item_count > 0 then
      insert into public.list_items (list_id, external_id, external_source, external_type, added_at)
      select v_rec.default_id, li.external_id, li.external_source, li.external_type, li.added_at
      from public.list_items li
      where li.list_id = v_rec.custom_id
      on conflict (list_id, external_id) do nothing;

      get diagnostics v_item_count = row_count;
      v_total_moved := v_total_moved + v_item_count;
    end if;

    -- Delete items from the duplicate list (already moved, or no items)
    delete from public.list_items where list_id = v_rec.custom_id;

    -- Delete the duplicate custom list
    delete from public.user_lists where id = v_rec.custom_id;
    v_total_deleted := v_total_deleted + 1;
  end loop;

  raise notice 'Cleanup complete: % duplicate custom lists deleted, % items moved to defaults', v_total_deleted, v_total_moved;
end;
$$;
