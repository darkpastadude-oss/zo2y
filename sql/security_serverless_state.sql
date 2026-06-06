-- =====================================================================
-- Security infrastructure for serverless auth hardening
-- =====================================================================
-- In-memory state (rate limit, captcha, CSRF, lockout) does NOT survive
-- across Cloudflare Pages Functions instances. This migration moves
-- that state to Supabase so all instances see the same counters.
--
-- Tables:
--   1. security_rate_limit   - per-key counter with TTL
--   2. security_captcha      - captcha challenge/answer with TTL
--   3. security_csrf         - CSRF tokens with TTL (session-bound)
--   4. security_lockout      - account lockout per identifier
--   5. security_audit_log    - append-only audit trail
--   6. security_email_otp    - email-bound one-time tokens (replaces leaky generateLink-based flow)
-- =====================================================================

begin;

-- pgcrypto is needed for digest()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. security_rate_limit
-- ---------------------------------------------------------------------
create table if not exists public.security_rate_limit (
  bucket_key text not null,
  window_start timestamptz not null default now(),
  hit_count integer not null default 1,
  expires_at timestamptz not null default (now() + interval '1 hour'),
  primary key (bucket_key)
);

create index if not exists idx_security_rate_limit_expires
  on public.security_rate_limit (expires_at);

alter table public.security_rate_limit enable row level security;

-- No client access; service role only.
drop policy if exists security_rate_limit_no_select on public.security_rate_limit;
create policy security_rate_limit_no_select
  on public.security_rate_limit for select
  to authenticated, anon
  using (false);

drop policy if exists security_rate_limit_no_insert on public.security_rate_limit;
create policy security_rate_limit_no_insert
  on public.security_rate_limit for insert
  to authenticated, anon
  with check (false);

drop policy if exists security_rate_limit_no_update on public.security_rate_limit;
create policy security_rate_limit_no_update
  on public.security_rate_limit for update
  to authenticated, anon
  using (false);

drop policy if exists security_rate_limit_no_delete on public.security_rate_limit;
create policy security_rate_limit_no_delete
  on public.security_rate_limit for delete
  to authenticated, anon
  using (false);

-- ---------------------------------------------------------------------
-- 2. security_captcha
-- ---------------------------------------------------------------------
create table if not exists public.security_captcha (
  id text primary key,
  answer_hash text not null,
  hint text null,
  consumed boolean not null default false,
  consumed_at timestamptz null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists idx_security_captcha_expires
  on public.security_captcha (expires_at);

alter table public.security_captcha enable row level security;

drop policy if exists security_captcha_no_access on public.security_captcha;
create policy security_captcha_no_access
  on public.security_captcha for all
  to authenticated, anon
  using (false)
  with check (false);

-- ---------------------------------------------------------------------
-- 3. security_csrf
-- ---------------------------------------------------------------------
create table if not exists public.security_csrf (
  token_hash text primary key,
  session_hint text null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '4 hours')
);

create index if not exists idx_security_csrf_expires
  on public.security_csrf (expires_at);

alter table public.security_csrf enable row level security;

drop policy if exists security_csrf_no_access on public.security_csrf;
create policy security_csrf_no_access
  on public.security_csrf for all
  to authenticated, anon
  using (false)
  with check (false);

-- ---------------------------------------------------------------------
-- 4. security_lockout
-- ---------------------------------------------------------------------
create table if not exists public.security_lockout (
  identifier_hash text primary key,
  identifier_kind text not null check (identifier_kind in ('email', 'ip', 'user')),
  failed_count integer not null default 0,
  first_failed_at timestamptz not null default now(),
  last_failed_at timestamptz not null default now(),
  locked_until timestamptz null
);

create index if not exists idx_security_lockout_locked_until
  on public.security_lockout (locked_until);

alter table public.security_lockout enable row level security;

drop policy if exists security_lockout_no_access on public.security_lockout;
create policy security_lockout_no_access
  on public.security_lockout for all
  to authenticated, anon
  using (false)
  with check (false);

-- ---------------------------------------------------------------------
-- 5. security_audit_log
-- ---------------------------------------------------------------------
create table if not exists public.security_audit_log (
  id bigint generated by default as identity primary key,
  event_name text not null check (char_length(event_name) between 3 and 80),
  event_status text not null default 'ok' check (event_status in ('ok', 'denied', 'error', 'warning')),
  actor_user_id uuid null references auth.users(id) on delete set null,
  actor_ip_hash text null,
  target_user_id uuid null references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  request_id text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_audit_log_created_at
  on public.security_audit_log (created_at desc);

create index if not exists idx_security_audit_log_event
  on public.security_audit_log (event_name, created_at desc);

create index if not exists idx_security_audit_log_actor
  on public.security_audit_log (actor_user_id, created_at desc);

alter table public.security_audit_log enable row level security;

-- Only the actor themselves can see their own audit log entries.
drop policy if exists security_audit_log_select_own on public.security_audit_log;
create policy security_audit_log_select_own
  on public.security_audit_log for select
  to authenticated
  using (actor_user_id = auth.uid());

-- Inserts are service-role only (no client insert policy).

-- ---------------------------------------------------------------------
-- 6. security_email_otp
-- ---------------------------------------------------------------------
-- One-time codes for email verification / password reset that survive
-- across Cloudflare Pages Functions instances. The OTP is generated
-- server-side and sent to the user's email. The user then submits
-- the OTP to complete the action. Replaces flows that relied on
-- Supabase generateLink and timing-leaky status checks.
create table if not exists public.security_email_otp (
  id bigint generated by default as identity primary key,
  purpose text not null check (purpose in ('signup', 'login', 'reset_password', 'change_email')),
  identifier_hash text not null,         -- sha256(lowercased email)
  identifier_kind text not null default 'email' check (identifier_kind in ('email')),
  code_hash text not null,               -- sha256(code)
  attempts integer not null default 0,
  consumed boolean not null default false,
  consumed_at timestamptz null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  -- Allows looking up by hash; we keep the index small.
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_security_email_otp_lookup
  on public.security_email_otp (identifier_hash, purpose, consumed, expires_at desc);

create index if not exists idx_security_email_otp_expires
  on public.security_email_otp (expires_at);

alter table public.security_email_otp enable row level security;

drop policy if exists security_email_otp_no_access on public.security_email_otp;
create policy security_email_otp_no_access
  on public.security_email_otp for all
  to authenticated, anon
  using (false)
  with check (false);

-- ---------------------------------------------------------------------
-- Helper: cleanup_expired_security_records
-- ---------------------------------------------------------------------
-- Best-effort garbage collection. Should be invoked by a scheduled
-- Supabase Edge Function (cron). This function is SECURITY DEFINER
-- so it can run even though no client can read the tables.
--
-- Retention policy:
--   - rate_limit, captcha, csrf, email_otp: TTL-based (their own expires_at)
--   - lockout:    24 h after lockout expires, 7 d after last failed attempt
--   - audit_log:  90 days (regulatory / forensic window)
--   - email_otp:  24 h grace after expiry to allow in-flight requests
create or replace function public.cleanup_expired_security_records(
  audit_log_retention interval default interval '90 days'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer := 0;
  n1 integer;
  n2 integer;
  n3 integer;
  n4 integer;
  n5 integer;
  n6 integer;
begin
  delete from public.security_rate_limit where expires_at < now();
  get diagnostics n1 = row_count;
  removed := removed + n1;

  delete from public.security_captcha where expires_at < now();
  get diagnostics n2 = row_count;
  removed := removed + n2;

  delete from public.security_csrf where expires_at < now();
  get diagnostics n3 = row_count;
  removed := removed + n3;

  delete from public.security_lockout
    where (locked_until is not null and locked_until < now() - interval '24 hours')
       or last_failed_at < now() - interval '7 days';
  get diagnostics n4 = row_count;
  removed := removed + n4;

  delete from public.security_email_otp
    where consumed = true
       or expires_at < now() - interval '24 hours';
  get diagnostics n5 = row_count;
  removed := removed + n5;

  -- Audit log retention. Default 90 days; call sites can pass
  -- `cleanup_expired_security_records(interval '180 days')` for
  -- longer forensic windows.
  delete from public.security_audit_log
    where created_at < now() - audit_log_retention;
  get diagnostics n6 = row_count;
  removed := removed + n6;

  return removed;
end;
$$;

revoke all on function public.cleanup_expired_security_records(interval) from public;
grant execute on function public.cleanup_expired_security_records(interval) to service_role;

-- ---------------------------------------------------------------------
-- Helper: cleanup_security_audit_log (standalone, for daily cron)
-- ---------------------------------------------------------------------
-- Separate function so the operator can schedule audit log GC
-- independently of in-flight state cleanup.
create or replace function public.cleanup_security_audit_log(
  retention interval default interval '90 days'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.security_audit_log
    where created_at < now() - retention;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.cleanup_security_audit_log(interval) from public;
grant execute on function public.cleanup_security_audit_log(interval) to service_role;

commit;
