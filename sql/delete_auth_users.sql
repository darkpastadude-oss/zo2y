-- Delete all auth users - must delete child data first due to foreign keys
begin;

-- Delete all reviews that reference users
delete from public.reviews;
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
delete from public.user_album_reviews;

-- Delete user profiles
delete from public.user_profiles;

-- Now delete auth users
delete from auth.users;

commit;
