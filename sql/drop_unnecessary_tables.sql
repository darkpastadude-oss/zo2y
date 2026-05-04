-- Drop unnecessary/redundant tables to clean up schema
-- Keeps only essential tables for auth + content catalogs

begin;

-- DROP REDUNDANT TABLES (keeping only essential ones)

-- Drop social features tables (if not being used)
drop table if exists public.social_comments cascade;
drop table if exists public.social_reactions cascade;

-- Drop tier list tables (if not being used)
drop table if exists public.tier_list_items cascade;
drop table if exists public.tier_lists cascade;
drop table if exists public.list_tier_ranks cascade;
drop table if exists public.list_tier_meta cascade;

-- Drop legacy restaurant submission tables (if not being used)
drop table if exists public.restaurant_submissions cascade;
drop table if exists public.restaurant_gallery cascade;

-- Drop support tickets (if not needed)
drop table if exists public.support_tickets cascade;

-- Drop notification preferences (if not needed)
drop table if exists public.notification_preferences cascade;

-- Drop old/unused list tables
drop table if exists public.lists cascade;
drop table if exists public.lists_restraunts cascade;
drop table if exists public.list_collaborators cascade;

-- Drop analytics (if not needed)
drop table if exists public.analytics_events cascade;

-- Drop activity feed (if not needed)
drop table if exists public.user_activity_feed cascade;

-- Drop home spotlight cache (can be rebuilt)
drop table if exists public.home_spotlight_cache cascade;

commit;

-- Show remaining tables
select tablename 
from pg_tables 
where schemaname = 'public' 
order by tablename;
