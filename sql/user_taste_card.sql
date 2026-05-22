-- user_taste_card: lets users pick one favorite item per category for their Taste Card
create table if not exists public.user_taste_card (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    category text not null check (category in (
        'movies', 'tv', 'anime', 'games', 'books', 'music',
        'sports', 'travel', 'fashion', 'food', 'cars'
    )),
    item_id text not null,
    item_name text not null,
    item_image text,
    item_subtitle text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id, category)
);

create index if not exists idx_taste_card_user on public.user_taste_card(user_id);
create index if not exists idx_taste_card_category_item on public.user_taste_card(category, item_id);

alter table public.user_taste_card enable row level security;

create policy "taste_card_select" on public.user_taste_card
    for select using (true);

create policy "taste_card_insert" on public.user_taste_card
    for insert with check (auth.uid() = user_id);

create policy "taste_card_update" on public.user_taste_card
    for update using (auth.uid() = user_id);

create policy "taste_card_delete" on public.user_taste_card
    for delete using (auth.uid() = user_id);
