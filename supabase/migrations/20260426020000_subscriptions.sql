-- Stripe subscriptions: true auto-renewing recurring billing for the
-- Monthly ($34.99/mo) and Quarterly ($89.99/qtr) Treatment Plans.
-- One-time consults stay as PaymentIntents and are not stored here.

-- Add stripe_customer_id to patients so we can reuse the same Stripe
-- Customer across re-subscriptions. One customer per Supabase user.
alter table public.patients
  add column if not exists stripe_customer_id text;

create unique index if not exists patients_stripe_customer_id_key
  on public.patients (stripe_customer_id)
  where stripe_customer_id is not null;

-- Subscriptions: one row per Stripe Subscription. A user can have
-- multiple historical rows (active + canceled), so we don't unique
-- on user_id. The current subscription is the most recent row with
-- status in ('active', 'trialing', 'past_due', 'unpaid').
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  plan text not null check (plan in ('monthly', 'quarterly')),
  -- Mirror of Stripe's subscription.status. Possible values per Stripe:
  -- incomplete, incomplete_expired, trialing, active, past_due, canceled, unpaid, paused.
  status text not null,
  -- Period bounds from Stripe. Updated on every customer.subscription.updated.
  current_period_start timestamptz,
  current_period_end timestamptz,
  -- Cancellation state. cancel_at_period_end means user clicked Cancel in
  -- our UI and access stays active until period_end.
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  -- Lock state for failed renewals. Set when failed_payment_count >= 3
  -- (Stripe Smart Retries default). Cleared when invoice.paid arrives.
  -- While locked = true, prescription/care features are restricted.
  failed_payment_count int not null default 0,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id, created_at desc);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status)
  where status in ('active', 'trialing', 'past_due', 'unpaid');

-- RLS: users can read their own subscription rows. Writes happen only
-- through the webhook (service role) and our subscription API routes
-- (which use service role internally because they need to mutate
-- after Stripe confirms).
alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

comment on table public.subscriptions is
  'Local mirror of Stripe Subscriptions. Source of truth lives in Stripe; this table is updated by webhook events and read by app code to gate features.';
comment on column public.subscriptions.failed_payment_count is
  'Incremented on each invoice.payment_failed for the same subscription. Reset to 0 on invoice.paid.';
comment on column public.subscriptions.locked_at is
  'Non-null when the subscription is locked due to >= 3 failed payments. App code checks this to restrict prescription/care access until card is updated.';
