begin;

create or replace function public.zo2y_normalize_username(
  p_value text,
  p_fallback text default 'user'
)
returns text
language plpgsql
immutable
as $$
declare
  normalized text;
begin
  normalized := lower(trim(coalesce(p_value, '')));
  normalized := replace(normalized, '@', '');
  normalized := regexp_replace(normalized, '[''’]+', '', 'g');
  normalized := regexp_replace(normalized, '[^a-z0-9_]+', '_', 'g');
  normalized := regexp_replace(normalized, '_+', '_', 'g');
  normalized := regexp_replace(normalized, '^_+|_+$', '', 'g');

  if normalized = '' then
    normalized := lower(trim(coalesce(p_fallback, 'user')));
    normalized := replace(normalized, '@', '');
    normalized := regexp_replace(normalized, '[''’]+', '', 'g');
    normalized := regexp_replace(normalized, '[^a-z0-9_]+', '_', 'g');
    normalized := regexp_replace(normalized, '_+', '_', 'g');
    normalized := regexp_replace(normalized, '^_+|_+$', '', 'g');
  end if;

  if normalized = '' then
    normalized := 'user';
  end if;

  if char_length(normalized) < 3 then
    normalized := 'user_' || normalized;
  end if;

  return left(normalized, 30);
end;
$$;

do $$
begin
  if to_regclass('public.user_profiles') is null then
    return;
  end if;

  update public.user_profiles p
  set username = public.zo2y_normalize_username(
    coalesce(
      nullif(trim(p.username), ''),
      nullif(trim(p.full_name), ''),
      split_part(coalesce(u.email, ''), '@', 1),
      p.id::text
    ),
    split_part(coalesce(u.email, ''), '@', 1)
  )
  from auth.users u
  where u.id = p.id
    and (
      p.username is null
      or p.username !~ '^[a-z0-9_]{3,30}$'
      or p.username <> public.zo2y_normalize_username(p.username, split_part(coalesce(u.email, ''), '@', 1))
    );

  update public.user_profiles p
  set username = public.zo2y_normalize_username(
    coalesce(nullif(trim(p.username), ''), nullif(trim(p.full_name), ''), p.id::text),
    p.id::text
  )
  where not exists (
      select 1 from auth.users u where u.id = p.id
    )
    and (
      p.username is null
      or p.username !~ '^[a-z0-9_]{3,30}$'
      or p.username <> public.zo2y_normalize_username(coalesce(nullif(trim(p.username), ''), nullif(trim(p.full_name), ''), p.id::text), p.id::text)
    );

  with ranked as (
    select
      p.id,
      public.zo2y_normalize_username(
        p.username,
        split_part(coalesce(u.email, ''), '@', 1)
      ) as base_username,
      row_number() over (
        partition by lower(public.zo2y_normalize_username(p.username, split_part(coalesce(u.email, ''), '@', 1)))
        order by p.created_at nulls first, p.id
      ) as rn
    from public.user_profiles p
    left join auth.users u
      on u.id = p.id
  ),
  resolved as (
    select
      id,
      case
        when rn = 1 then base_username
        else left(base_username, greatest(3, 30 - 7)) || '_' || left(replace(id::text, '-', ''), 6)
      end as final_username
    from ranked
  )
  update public.user_profiles p
  set username = r.final_username
  from resolved r
  where p.id = r.id
    and p.username is distinct from r.final_username;

  execute 'alter table public.user_profiles drop constraint if exists user_profiles_username_format_check';
  execute 'alter table public.user_profiles add constraint user_profiles_username_format_check check (username ~ ''^[a-z0-9_]{3,30}$'')';
  execute 'create unique index if not exists ux_user_profiles_username_lower on public.user_profiles (lower(username))';
end
$$;

commit;
