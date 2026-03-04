begin;

-- Force-drop any trigger wired to notification functions, regardless of table name.
do $$
declare
  r record;
begin
  for r in
    select
      n.nspname as schema_name,
      c.relname as table_name,
      t.tgname as trigger_name
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    where not t.tgisinternal
      and n.nspname = 'public'
      and p.proname in (
        'notify_friend_activity',
        'notify_review_reaction',
        'notify_review_reply',
        'notify_user_follow',
        'notify_list_follow'
      )
  loop
    execute format('drop trigger if exists %I on %I.%I', r.trigger_name, r.schema_name, r.table_name);
  end loop;
end $$;

-- Explicit known trigger names (safe if missing).
drop trigger if exists user_activity_feed_notify_followers on public.user_activity_feed;
drop trigger if exists review_reactions_notify on public.review_reactions;
drop trigger if exists review_replies_notify on public.review_replies;
drop trigger if exists follows_notify_user on public.follows;
drop trigger if exists list_follows_notify on public.list_follows;
drop trigger if exists user_notifications_sync_ids on public.user_notifications;

-- Drop notification functions.
drop function if exists public.notify_friend_activity() cascade;
drop function if exists public.notify_review_reaction() cascade;
drop function if exists public.notify_review_reply() cascade;
drop function if exists public.notify_user_follow() cascade;
drop function if exists public.notify_list_follow() cascade;
drop function if exists public.zo2y_push_notification(uuid, uuid, text, text, text, text, jsonb) cascade;
drop function if exists public.zo2y_sync_user_notifications_ids() cascade;

-- If table remains for legacy reasons, remove blocking NOT NULL.
do $$
begin
  if to_regclass('public.user_notifications') is not null then
    begin
      alter table public.user_notifications alter column user_id drop not null;
    exception when undefined_column then
      null;
    end;
  end if;
end $$;

commit;

