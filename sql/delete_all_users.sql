-- Delete ALL users and their data completely
-- This script removes ALL user-related data including auth.users
-- Preserves only content catalogs (games, movies, brands, etc.)

begin;

-- Temporarily disable foreign key constraints to allow deletion
SET session_replication_role = 'replica';

-- DELETE ALL USER-GENERATED CONTENT

-- Unified media lists (new schema)
truncate table if exists public.media_list_items cascade;
truncate table if exists public.media_lists cascade;

-- Reviews and reactions
truncate table if exists public.review_reactions cascade;
truncate table if exists public.review_replies cascade;
truncate table if exists public.reviews cascade;
truncate table if exists public.movie_reviews cascade;
truncate table if exists public.tv_reviews cascade;
truncate table if exists public.game_reviews cascade;
truncate table if exists public.book_reviews cascade;
truncate table if exists public.music_reviews cascade;
truncate table if exists public.anime_reviews cascade;
truncate table if exists public.travel_reviews cascade;
truncate table if exists public.fashion_reviews cascade;
truncate table if exists public.food_reviews cascade;
truncate table if exists public.car_reviews cascade;
truncate table if exists public.album_reviews cascade;
truncate table if exists public.user_album_reviews cascade;

-- Social features
truncate table if exists public.social_comments cascade;
truncate table if exists public.social_reactions cascade;

-- Legacy list items
truncate table if exists public.movie_list_items cascade;
truncate table if exists public.tv_list_items cascade;
truncate table if exists public.game_list_items cascade;
truncate table if exists public.book_list_items cascade;
truncate table if exists public.music_list_items cascade;
truncate table if exists public.anime_list_items cascade;
truncate table if exists public.travel_list_items cascade;
truncate table if exists public.fashion_list_items cascade;
truncate table if exists public.food_list_items cascade;
truncate table if exists public.car_list_items cascade;

-- Tier lists
truncate table if exists public.list_tier_ranks cascade;
truncate table if exists public.tier_list_items cascade;
truncate table if exists public.tier_lists cascade;
truncate table if exists public.list_tier_meta cascade;

-- Legacy lists
truncate table if exists public.movie_lists cascade;
truncate table if exists public.tv_lists cascade;
truncate table if exists public.game_lists cascade;
truncate table if exists public.book_lists cascade;
truncate table if exists public.music_lists cascade;
truncate table if exists public.anime_lists cascade;
truncate table if exists public.travel_lists cascade;
truncate table if exists public.fashion_lists cascade;
truncate table if exists public.food_lists cascade;
truncate table if exists public.car_lists cascade;
truncate table if exists public.lists cascade;
truncate table if exists public.lists_restraunts cascade;
truncate table if exists public.list_collaborators cascade;

-- User-specific data
truncate table if exists public.user_favorite_teams cascade;
truncate table if exists public.notification_preferences cascade;
truncate table if exists public.profile_pinned_lists cascade;
truncate table if exists public.home_spotlight_cache cascade;
truncate table if exists public.user_activity_feed cascade;
truncate table if exists public.restaurant_submissions cascade;
truncate table if exists public.support_tickets cascade;
truncate table if exists public.analytics_events cascade;

-- User profiles
truncate table if exists public.user_profiles cascade;

-- Travel plans
truncate table if exists public.travel_plans cascade;

-- Re-enable foreign key constraints
SET session_replication_role = 'origin';

-- Delete all auth users
delete from auth.users;

-- Reset sequences
alter sequence if exists public.user_profiles_id_seq restart with 1;
alter sequence if exists public.media_lists_id_seq restart with 1;
alter sequence if exists public.media_list_items_id_seq restart with 1;
alter sequence if exists public.analytics_events_id_seq restart with 1;
alter sequence if exists public.support_tickets_id_seq restart with 1;
alter sequence if exists public.profile_pinned_lists_id_seq restart with 1;

commit;

-- Verify deletion
select 'Deleted all users and their data completely' as status;
select count(*) as remaining_auth_users from auth.users;
select count(*) as remaining_user_profiles from public.user_profiles;
