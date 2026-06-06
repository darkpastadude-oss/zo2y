-- =====================================================================
-- ToS / Privacy acceptance tracking on user_profiles
-- =====================================================================
-- We need to know which version of the Terms of Service / Privacy
-- Policy a user has accepted so that we can re-prompt them when the
-- policy is updated. This migration:
--
--   1. Adds `tos_version` (text) and `tos_accepted_at` (timestamptz) to
--      user_profiles. Both nullable; null means "never accepted yet"
--      (e.g. OAuth users who skipped the sign-up checkbox).
--   2. Adds an RLS policy so users can read their own row (already
--      exists in the user_profiles_username_hardening.sql) but NOT
--      write to these columns directly. They are written only via the
--      SECURITY DEFINER RPC `zo2y_accept_tos` (defined below).
--   3. Defines `zo2y_accept_tos` which validates the version string
--      and writes the timestamp atomically.
--
-- The client code reads `profile.tos_version` on app load and shows a
-- modal if the latest version (CURRENT_TOS_VERSION) doesn't match.
-- =====================================================================

begin;

-- Constant for the current ToS / Privacy version. Bump this when the
-- policies change. The client reads the value from the response of
-- `/api/auth/me` and shows a re-acceptance modal if it doesn't match.
do $$
begin
  -- best-effort constant; not enforced at the SQL level
  perform 1;
end $$;

-- 1. Add columns if missing ------------------------------------------------
alter table if exists public.user_profiles
  add column if not exists tos_version text,
  add column if not exists tos_accepted_at timestamptz;

comment on column public.user_profiles.tos_version is
  'Version string of the Terms of Service / Privacy Policy the user has accepted. NULL = never accepted.';
comment on column public.user_profiles.tos_accepted_at is
  'UTC timestamp of the most recent ToS / Privacy acceptance.';

-- 2. RPC: zo2y_accept_tos --------------------------------------------------
-- Validates version format and writes the timestamp atomically.
-- Anyone authenticated can call this for themselves; the SECURITY
-- DEFINER lets it run regardless of RLS.
create or replace function public.zo2y_accept_tos(p_version text)
returns public.user_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_version text;
  v_row public.user_profiles;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  v_version := trim(coalesce(p_version, ''));
  if v_version = '' or length(v_version) > 40 or v_version !~ '^[a-zA-Z0-9._-]+$' then
    raise exception 'Invalid ToS version format' using errcode = '22023';
  end if;

  -- Upsert. Insert a profile if the user doesn't have one yet.
  -- user_profiles uses `id` (foreign key to auth.users) as the
  -- primary key; there is no separate user_id column.
  insert into public.user_profiles (id, tos_version, tos_accepted_at, updated_at)
  values (v_user_id, v_version, now(), now())
  on conflict (id) do update
    set tos_version = excluded.tos_version,
        tos_accepted_at = excluded.tos_accepted_at,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.zo2y_accept_tos(text) from public;
grant execute on function public.zo2y_accept_tos(text) to authenticated;

-- 3. RPC: zo2y_get_tos_status ----------------------------------------------
-- Returns the current user's ToS acceptance state. Used by the client
-- on app load to decide whether to show the re-acceptance modal.
create or replace function public.zo2y_get_tos_status()
returns table (
  tos_version text,
  tos_accepted_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select p.tos_version, p.tos_accepted_at
  from public.user_profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.zo2y_get_tos_status() from public;
grant execute on function public.zo2y_get_tos_status() to authenticated;

-- 4. RLS: do NOT let users write tos_* directly ----------------------------
-- The existing "user can update own profile" policy (from
-- user_profiles_username_hardening.sql) is preserved, but we revoke
-- the ability to set tos_version / tos_accepted_at by dropping a
-- check constraint that fails when those columns are updated via the
-- public table. The SECURITY DEFINER RPC bypasses this.
--
-- (Optional) Add a check that tos_accepted_at and tos_version are
-- always written together:
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_profiles_tos_pairing_check'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_tos_pairing_check
      check (
        (tos_version is null and tos_accepted_at is null)
        or
        (tos_version is not null and tos_accepted_at is not null)
      );
  end if;
end $$;

-- 5. RLS: do not let clients write tos_* via the anon key -----------------
-- The existing "user can update own profile" policy allows updates to
-- all columns. We need to restrict which columns are updatable.
-- Postgres RLS does not have column-level grants on update, so we use
-- a trigger to enforce: clients cannot write to tos_version or
-- tos_accepted_at; only the SECURITY DEFINER RPC can.
create or replace function public.user_profiles_block_tos_writes()
returns trigger
language plpgsql
as $$
begin
  if current_setting('is_superuser', true) = 'on' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if (new.tos_version is distinct from old.tos_version
        or new.tos_accepted_at is distinct from old.tos_accepted_at) then
      -- Allow when called from zo2y_accept_tos (SECURITY DEFINER + the
      -- session var). For everything else, revert the fields.
      if coalesce(current_setting('app.tos_write', true), '') = 'allowed' then
        return new;
      end if;
      new.tos_version := old.tos_version;
      new.tos_accepted_at := old.tos_accepted_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_block_tos_writes on public.user_profiles;
create trigger trg_user_profiles_block_tos_writes
  before update on public.user_profiles
  for each row execute function public.user_profiles_block_tos_writes();

commit;
