-- Pricing config table — single source of truth for plan pricing.
-- Keys are referenced from the Shopify Liquid sections (telehealth, shop).
-- Must be created before migration 20260413000000_delivery_pricing.sql, which
-- assumes the table exists and only writes seed rows.

create table if not exists public.pricing_config (
  key varchar(100) primary key,
  value decimal(10,2) not null,
  label text,
  updated_at timestamptz not null default now()
);

alter table public.pricing_config enable row level security;

-- Prices are shown publicly on marketing pages, so anon read is intentional.
create policy "Anyone can read pricing"
  on public.pricing_config
  for select
  using (true);

-- Seed the assessment price that telehealth.liquid reads. Other keys are
-- seeded by the delivery_pricing + bimonthly_pricing migrations that follow.
insert into public.pricing_config (key, value, label) values
  ('assessment_price', 35.00, 'Skin Assessment (one-time)')
on conflict (key) do nothing;
