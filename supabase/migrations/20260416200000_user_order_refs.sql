-- Server-side order tracking — replaces localStorage PHI storage
-- Stores mapping of user_id → Ola order GUIDs

create table if not exists public.user_order_refs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_guid text not null,
  ola_user_guid text,
  order_type text not null default 'consultation', -- consultation | prescription | cosmetics
  created_at timestamptz not null default now()
);

create index idx_user_order_refs_user on public.user_order_refs(user_id);
create unique index idx_user_order_refs_guid on public.user_order_refs(order_guid);

alter table public.user_order_refs enable row level security;

create policy "Users can read own order refs"
  on public.user_order_refs for select
  using (auth.uid() = user_id);

create policy "Users can insert own order refs"
  on public.user_order_refs for insert
  with check (auth.uid() = user_id);

-- Link consent records to specific bookings
alter table public.consent_records
  add column if not exists order_guid text;
