-- =====================================================================
-- Security RPCs (atomic, idempotent, serverless-safe)
-- =====================================================================
-- These run as SECURITY DEFINER so callers do not need any table
-- privilege, and so atomicity is guaranteed by the database (no
-- read-modify-write race across Cloudflare Pages Functions instances).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- zo2y_increment_rate_limit
-- ---------------------------------------------------------------------
-- Atomic "increment if window not expired else reset to 1".
-- Returns: json { count, window_expired }
create or replace function public.zo2y_increment_rate_limit(
  p_bucket text,
  p_window_ms integer,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.security_rate_limit%rowtype;
  now_ts timestamptz := now();
  new_count integer;
  window_seconds numeric := p_window_ms::numeric / 1000.0;
begin
  if p_bucket is null or length(p_bucket) = 0 or length(p_bucket) > 200 then
    raise exception 'invalid bucket';
  end if;
  if p_window_ms is null or p_window_ms < 1000 then
    raise exception 'invalid window';
  end if;

  select * into existing
  from public.security_rate_limit
  where bucket_key = p_bucket
  for update;

  if not found then
    insert into public.security_rate_limit (bucket_key, window_start, hit_count, expires_at)
    values (p_bucket, now_ts, 1, p_expires_at)
    returning * into existing;
    return jsonb_build_object('count', 1, 'window_expired', false);
  end if;

  -- Reset if the existing window has expired.
  if existing.expires_at < now_ts then
    update public.security_rate_limit
    set window_start = now_ts,
        hit_count = 1,
        expires_at = p_expires_at
    where bucket_key = p_bucket
    returning hit_count into new_count;
    return jsonb_build_object('count', new_count, 'window_expired', true);
  end if;

  new_count := existing.hit_count + 1;
  update public.security_rate_limit
  set hit_count = new_count
  where bucket_key = p_bucket;

  return jsonb_build_object('count', new_count, 'window_expired', false);
end;
$$;

revoke all on function public.zo2y_increment_rate_limit(text, integer, timestamptz) from public;
grant execute on function public.zo2y_increment_rate_limit(text, integer, timestamptz) to service_role;

-- ---------------------------------------------------------------------
-- zo2y_record_failed_auth
-- ---------------------------------------------------------------------
-- Atomic lockout tracking per identifier hash. Returns the new
-- failed_count and locked status.
create or replace function public.zo2y_record_failed_auth(
  p_identifier_hash text,
  p_kind text,
  p_threshold integer,
  p_lockout_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.security_lockout%rowtype;
  now_ts timestamptz := now();
  lockout_until timestamptz;
  new_count integer;
  should_lock boolean;
begin
  if p_identifier_hash is null or length(p_identifier_hash) = 0 then
    raise exception 'invalid identifier';
  end if;
  if p_kind not in ('email', 'ip', 'user') then
    raise exception 'invalid kind';
  end if;

  select * into existing
  from public.security_lockout
  where identifier_hash = p_identifier_hash
    and identifier_kind = p_kind
  for update;

  if not found then
    insert into public.security_lockout (identifier_hash, identifier_kind, failed_count, first_failed_at, last_failed_at)
    values (p_identifier_hash, p_kind, 1, now_ts, now_ts)
    returning * into existing;
    new_count := 1;
  else
    -- Reset the rolling window if the last failure is older than lockout_ms.
    if existing.last_failed_at + (p_lockout_ms::text || ' milliseconds')::interval < now_ts then
      new_count := 1;
      update public.security_lockout
      set failed_count = 1,
          first_failed_at = now_ts,
          last_failed_at = now_ts,
          locked_until = null
      where identifier_hash = p_identifier_hash and identifier_kind = p_kind;
    else
      new_count := existing.failed_count + 1;
      update public.security_lockout
      set failed_count = new_count,
          last_failed_at = now_ts
      where identifier_hash = p_identifier_hash and identifier_kind = p_kind;
    end if;
  end if;

  should_lock := new_count >= p_threshold;
  if should_lock then
    lockout_until := now_ts + (p_lockout_ms::text || ' milliseconds')::interval;
    update public.security_lockout
    set locked_until = lockout_until
    where identifier_hash = p_identifier_hash and identifier_kind = p_kind;
  else
    lockout_until := null;
  end if;

  return jsonb_build_object(
    'count', new_count,
    'locked', should_lock,
    'lockout_remaining', case when lockout_until is null then 0
                              else greatest(0, extract(epoch from (lockout_until - now_ts)) * 1000)::integer
                         end
  );
end;
$$;

revoke all on function public.zo2y_record_failed_auth(text, text, integer, integer) from public;
grant execute on function public.zo2y_record_failed_auth(text, text, integer, integer) to service_role;

commit;
