-- Delete all user data - COMPLETE AUTH RESET
-- This will delete all users, profiles, and ALL related data
-- Must delete child tables first due to foreign key constraints

begin;

-- Delete all user-generated content (order matters for foreign keys)
delete from public.review_reactions;
delete from public.review_replies;
delete from public.review_reactions; -- in case of any remaining

-- Delete all reviews across all content types
delete from public.movie_reviews;
delete from public.tv_reviews;
delete from public.game_reviews;
delete from public.book_reviews;
delete from public.music_reviews;
delete from public.anime_reviews;
delete from public.travel_reviews;
delete from public.fashion_reviews;
delete from public.food_reviews;
delete from public.car_reviews;
delete from public.album_reviews;

-- Delete all list items
delete from public.movie_list_items;
delete from public.tv_list_items;
delete from public.game_list_items;
delete from public.book_list_items;
delete from public.music_list_items;
delete from public.anime_list_items;
delete from public.travel_list_items;
delete from public.fashion_list_items;
delete from public.food_list_items;
delete from public.car_list_items;
delete from public.list_tier_ranks;

-- Delete all lists
delete from public.movie_lists;
delete from public.tv_lists;
delete from public.game_lists;
delete from public.book_lists;
delete from public.music_lists;
delete from public.anime_lists;
delete from public.travel_lists;
delete from public.fashion_lists;
delete from public.food_lists;
delete from public.car_lists;
delete from public.lists;
delete from public.lists_restraunts;
delete from public.list_tier_meta;
delete from public.list_collaborators;

-- Delete user favorites
delete from public.user_favorite_teams;

-- Delete profile data
delete from public.profile_pinned_lists;
delete from public.home_spotlight_cache;
delete from public.user_activity_feed;

-- Delete user profiles
delete from public.user_profiles;

-- Delete auth users
delete from auth.users;

-- Reset sequences
alter sequence public.user_profiles_id_seq restart with 1;

commit;

-- Verify deletion
select 'Deleted all user data' as status;
