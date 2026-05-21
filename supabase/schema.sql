-- ============================================================
-- Home Inventory — Supabase Schema
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================

create table if not exists public.items (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  category            text not null default 'Other',
  quantity            numeric(10,2) not null default 0,
  unit                text not null default 'pieces',
  low_stock_threshold numeric(10,2) not null default 1,
  expiry_date         date,
  notes               text,
  user_id             uuid not null references auth.users(id) on delete cascade,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Index for fast per-user queries
create index if not exists items_user_id_idx on public.items(user_id);

-- Row Level Security: each user can only see and modify their own items
alter table public.items enable row level security;

create policy "Users can select own items"
  on public.items for select
  using (auth.uid() = user_id);

create policy "Users can insert own items"
  on public.items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own items"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own items"
  on public.items for delete
  using (auth.uid() = user_id);

-- Auto-set user_id on insert
create or replace function public.set_user_id()
returns trigger language plpgsql security definer as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$;

create or replace trigger items_set_user_id
  before insert on public.items
  for each row execute function public.set_user_id();

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();
