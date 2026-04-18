-- Pricing config managed via Supabase dashboard
-- Change prices without code deploys

create table if not exists public.pricing_config (
  key varchar(50) primary key,
  value decimal(10,2) not null,
  label text,
  updated_at timestamptz not null default now()
);

alter table public.pricing_config enable row level security;

create policy "Anyone can read pricing"
  on public.pricing_config for select using (true);

-- Seed current prices
insert into public.pricing_config (key, value, label) values
  ('assessment_price', 35.00, 'Skin Assessment (one-time)'),
  ('treatment_monthly', 49.00, 'Treatment Plan (monthly subscription)'),
  ('treatment_onetime', 69.00, 'Treatment Plan (one-time purchase)'),
  ('full_routine_monthly', 69.00, 'Full Routine (monthly, future)'),
  ('full_routine_onetime', 89.00, 'Full Routine (one-time, future)');
