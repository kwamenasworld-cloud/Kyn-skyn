-- Two-sided referral system: discount for the customer, payout to the
-- influencer who owns the code. Coexists with legacy referral_codes rows
-- via the new code_type column. Discount math for influencer codes lives
-- entirely in Stripe Coupons (referenced via env vars); Supabase tracks
-- identity, eligibility, and payout accounting.

-- Tag each code as legacy or influencer. Existing rows default to legacy
-- and continue using the old discount_type/discount_value fields.
alter table public.referral_codes
  add column if not exists code_type text not null default 'legacy'
    check (code_type in ('legacy', 'influencer'));

-- Influencer info + payout config. Used only when code_type = 'influencer'.
alter table public.referral_codes
  add column if not exists owner_name text,
  add column if not exists owner_email text,
  add column if not exists owner_payout_method text,        -- 'paypal', 'ach', 'wise', 'check', etc
  add column if not exists owner_payout_handle text,        -- their email, account, etc
  add column if not exists payout_per_use_cents integer not null default 500;

comment on column public.referral_codes.code_type is
  'legacy: old client-side discount math via discount_type/discount_value. influencer: Stripe Coupon-driven discount + Supabase-tracked payout to owner.';
comment on column public.referral_codes.payout_per_use_cents is
  'How much we owe the influencer per redemption. Default 500 = $5.';

-- Payouts owed to influencers. One row per redemption that should result
-- in payment to the code owner. Status flow: pending -> paid (or void).
create table if not exists public.referral_payouts (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.referral_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  -- Either a PaymentIntent (one-time) or a Subscription's first invoice.
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  amount_cents integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'void')),
  paid_at timestamptz,
  payout_method text,
  payout_reference text,                                    -- ACH txn id, PayPal txn, check #
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Idempotency: never double-record a payout for the same redemption.
  -- A given customer using a given code can only generate one payout.
  unique (code_id, user_id)
);

create index if not exists referral_payouts_status_idx
  on public.referral_payouts (status, created_at desc);

create index if not exists referral_payouts_code_id_idx
  on public.referral_payouts (code_id);

alter table public.referral_payouts enable row level security;

-- No customer should be able to read payout records.
-- Service role (used by the Stripe webhook) bypasses RLS automatically.
-- Admin reads happen in Supabase Studio under the service role too.

create trigger referral_payouts_updated_at
  before update on public.referral_payouts
  for each row execute function public.handle_updated_at();
