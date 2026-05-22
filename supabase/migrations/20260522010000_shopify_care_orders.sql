-- Shopify paid-order bridge for the care funnel.
-- Shopify stores only commercial attribution and order metadata. Clinical
-- intake/photos/pharmacy still post to the care backend and MDI workflow.

create table if not exists public.shopify_care_orders (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text not null unique,
  order_name text,
  email text not null,
  currency text not null default 'USD',
  total_price text,
  financial_status text,
  care_plan text not null check (care_plan in ('monthly', 'quarterly', 'one-time')),
  affiliate_code text,
  endorsely_referral text,
  care_handoff_token text,
  attribution jsonb,
  status text not null default 'pending' check (status in ('pending', 'paid', 'void')),
  raw_order jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shopify_care_orders_email_idx
  on public.shopify_care_orders (lower(email), created_at desc);

create index if not exists shopify_care_orders_status_idx
  on public.shopify_care_orders (status, created_at desc);

alter table public.shopify_care_orders enable row level security;

-- Customers should not query paid Shopify care orders directly. The care app
-- resolves a paid order through service-role webhook/API code.

create trigger shopify_care_orders_updated_at
  before update on public.shopify_care_orders
  for each row execute function public.handle_updated_at();
