begin;

-- Disable all notification emitters first.
drop trigger if exists user_activity_feed_notify_followers on public.user_activity_feed;
drop trigger if exists review_reactions_notify on public.review_reactions;
drop trigger if exists review_replies_notify on public.review_replies;
drop trigger if exists follows_notify_user on public.follows;
drop trigger if exists list_follows_notify on public.list_follows;
drop trigger if exists user_notifications_sync_ids on public.user_notifications;

-- Remove notification-related functions.
drop function if exists public.notify_friend_activity() cascade;
drop function if exists public.notify_review_reaction() cascade;
drop function if exists public.notify_review_reply() cascade;
drop function if exists public.notify_user_follow() cascade;
drop function if exists public.notify_list_follow() cascade;
drop function if exists public.zo2y_push_notification(uuid, uuid, text, text, text, text, jsonb) cascade;
drop function if exists public.zo2y_sync_user_notifications_ids() cascade;
drop function if exists public.zo2y_touch_updated_at() cascade;

-- Remove notification storage tables.
drop table if exists public.user_notifications cascade;
drop table if exists public.weekly_digest_preferences cascade;

commit;

