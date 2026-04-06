begin;

-- Live anon audit on 2026-04-06 showed these tables were publicly readable:
-- support_tickets, user_notifications, movie_lists, movie_list_items.
-- This migration closes those leaks while preserving public/community-friendly reads
-- only where a list is explicitly public.

alter table if exists public.support_tickets enable row level security;
alter table if exists public.user_notifications enable row level security;
alter table if exists public.movie_lists enable row level security;
alter table if exists public.movie_list_items enable row level security;
alter table if exists public.travel_lists enable row level security;
alter table if exists public.travel_list_items enable row level security;

alter table if exists public.movie_lists
  add column if not exists is_public boolean not null default false;

alter table if exists public.travel_lists
  add column if not exists is_public boolean not null default false;

revoke all on public.support_tickets from anon;
revoke all on public.user_notifications from anon;
revoke all on public.movie_lists from anon;
revoke all on public.movie_list_items from anon;
revoke all on public.travel_lists from anon;
revoke all on public.travel_list_items from anon;

drop policy if exists "support_tickets_select_own" on public.support_tickets;
create policy "support_tickets_select_own"
on public.support_tickets
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "user_notifications_select_own" on public.user_notifications;
create policy "user_notifications_select_own"
on public.user_notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Select own or public movie_lists" on public.movie_lists;
drop policy if exists "Public select on movie_lists" on public.movie_lists;
create policy "Select own or public movie_lists"
on public.movie_lists
for select
to authenticated, anon
using (user_id = auth.uid() or is_public = true);

drop policy if exists "Select own or public movie_list_items" on public.movie_list_items;
drop policy if exists "Public select on movie_list_items" on public.movie_list_items;
create policy "Select own or public movie_list_items"
on public.movie_list_items
for select
to authenticated, anon
using (
  user_id = auth.uid()
  or (
    list_id is not null
    and exists (
      select 1
      from public.movie_lists l
      where l.id = movie_list_items.list_id
        and l.is_public = true
    )
  )
);

drop policy if exists "Select own or public travel_lists" on public.travel_lists;
drop policy if exists "Public select on travel_lists" on public.travel_lists;
create policy "Select own or public travel_lists"
on public.travel_lists
for select
to authenticated, anon
using (user_id = auth.uid() or is_public = true);

drop policy if exists "Select own or public travel_list_items" on public.travel_list_items;
drop policy if exists "Public select on travel_list_items" on public.travel_list_items;
create policy "Select own or public travel_list_items"
on public.travel_list_items
for select
to authenticated, anon
using (
  user_id = auth.uid()
  or (
    list_id is not null
    and exists (
      select 1
      from public.travel_lists l
      where l.id = travel_list_items.list_id
        and l.is_public = true
    )
  )
);

grant select on public.support_tickets to authenticated;
grant select on public.user_notifications to authenticated;
grant select on public.movie_lists to authenticated, anon;
grant select on public.movie_list_items to authenticated, anon;
grant select on public.travel_lists to authenticated, anon;
grant select on public.travel_list_items to authenticated, anon;

commit;
