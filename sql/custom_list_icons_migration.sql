-- Ensure all custom list tables support editable icons.
-- Safe to run multiple times.

do $$
begin
  if to_regclass('public.lists') is not null then
    execute 'alter table public.lists add column if not exists icon text';
    execute 'update public.lists set icon = ''list'' where icon is null';
  end if;

  if to_regclass('public.movie_lists') is not null then
    execute 'alter table public.movie_lists add column if not exists icon text';
    execute 'update public.movie_lists set icon = ''movie'' where icon is null';
  end if;

  if to_regclass('public.tv_lists') is not null then
    execute 'alter table public.tv_lists add column if not exists icon text';
    execute 'update public.tv_lists set icon = ''tv'' where icon is null';
  end if;

  if to_regclass('public.game_lists') is not null then
    execute 'alter table public.game_lists add column if not exists icon text';
    execute 'update public.game_lists set icon = ''game'' where icon is null';
  end if;

  if to_regclass('public.book_lists') is not null then
    execute 'alter table public.book_lists add column if not exists icon text';
    execute 'update public.book_lists set icon = ''book'' where icon is null';
  end if;
end $$;
