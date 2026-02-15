-- Privacy hardening migration
-- Makes user lists private by default and restricts user-generated data exposure.
-- Run in Supabase SQL editor after existing media schemas.

-- ----------------------------
-- MUSIC
-- ----------------------------
alter table public.music_lists
  add column if not exists is_public boolean not null default false;

drop policy if exists "Public select on music_lists" on public.music_lists;
drop policy if exists "Select own or public music_lists" on public.music_lists;
create policy "Select own or public music_lists"
on public.music_lists for select
using (user_id = auth.uid() or is_public = true);

drop policy if exists "Public select on music_list_items" on public.music_list_items;
drop policy if exists "Select own or public music_list_items" on public.music_list_items;
create policy "Select own or public music_list_items"
on public.music_list_items for select
using (
  user_id = auth.uid()
  or (
    list_id is not null
    and exists (
      select 1
      from public.music_lists l
      where l.id = music_list_items.list_id
        and l.is_public = true
    )
  )
);

drop policy if exists "Public select on music_reviews" on public.music_reviews;
drop policy if exists "Select own music_reviews" on public.music_reviews;
create policy "Select own music_reviews"
on public.music_reviews for select
using (user_id = auth.uid());

-- ----------------------------
-- BOOKS
-- ----------------------------
alter table public.book_lists
  add column if not exists is_public boolean not null default false;

drop policy if exists "Public select on book_lists" on public.book_lists;
drop policy if exists "Select own or public book_lists" on public.book_lists;
create policy "Select own or public book_lists"
on public.book_lists for select
using (user_id = auth.uid() or is_public = true);

drop policy if exists "Public select on book_list_items" on public.book_list_items;
drop policy if exists "Select own or public book_list_items" on public.book_list_items;
create policy "Select own or public book_list_items"
on public.book_list_items for select
using (
  user_id = auth.uid()
  or (
    list_id is not null
    and exists (
      select 1
      from public.book_lists l
      where l.id = book_list_items.list_id
        and l.is_public = true
    )
  )
);

drop policy if exists "Public select on book_reviews" on public.book_reviews;
drop policy if exists "Select own book_reviews" on public.book_reviews;
create policy "Select own book_reviews"
on public.book_reviews for select
using (user_id = auth.uid());

-- ----------------------------
-- TV
-- ----------------------------
alter table public.tv_lists
  add column if not exists is_public boolean not null default false;

drop policy if exists "Public select on tv_lists" on public.tv_lists;
drop policy if exists "Select own or public tv_lists" on public.tv_lists;
create policy "Select own or public tv_lists"
on public.tv_lists for select
using (user_id = auth.uid() or is_public = true);

drop policy if exists "Public select on tv_list_items" on public.tv_list_items;
drop policy if exists "Select own or public tv_list_items" on public.tv_list_items;
create policy "Select own or public tv_list_items"
on public.tv_list_items for select
using (
  user_id = auth.uid()
  or (
    list_id is not null
    and exists (
      select 1
      from public.tv_lists l
      where l.id = tv_list_items.list_id
        and l.is_public = true
    )
  )
);

drop policy if exists "Public select on tv_reviews" on public.tv_reviews;
drop policy if exists "Select own tv_reviews" on public.tv_reviews;
create policy "Select own tv_reviews"
on public.tv_reviews for select
using (user_id = auth.uid());

-- ----------------------------
-- GAMES
-- ----------------------------
alter table public.game_lists
  add column if not exists is_public boolean not null default false;

drop policy if exists "Public select on game_lists" on public.game_lists;
drop policy if exists "Select own or public game_lists" on public.game_lists;
create policy "Select own or public game_lists"
on public.game_lists for select
using (user_id = auth.uid() or is_public = true);

drop policy if exists "Public select on game_list_items" on public.game_list_items;
drop policy if exists "Select own or public game_list_items" on public.game_list_items;
create policy "Select own or public game_list_items"
on public.game_list_items for select
using (
  user_id = auth.uid()
  or (
    list_id is not null
    and exists (
      select 1
      from public.game_lists l
      where l.id = game_list_items.list_id
        and l.is_public = true
    )
  )
);

drop policy if exists "Public select on game_reviews" on public.game_reviews;
drop policy if exists "Select own game_reviews" on public.game_reviews;
create policy "Select own game_reviews"
on public.game_reviews for select
using (user_id = auth.uid());

-- NOTE:
-- If you still want globally public reviews, replace each *_reviews select policy
-- with USING (true) on that table.
