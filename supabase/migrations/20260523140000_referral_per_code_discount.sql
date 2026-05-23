-- Per-affiliate customer discount.
--
-- Until now, every influencer code at checkout received the SAME flat
-- Stripe Coupon (env vars STRIPE_COUPON_REFERRAL_MONTHLY / _QUARTERLY).
-- Now each code carries its own discount amount, set by the admin at
-- create-time, with a $9 cap on (payout_per_use + customer_discount)
-- enforced by the API.
--
-- The dynamic per-code Stripe Coupon id is stashed on the row so the
-- subscription/payment endpoints can apply the right discount without
-- another round-trip. Legacy codes with NULL stripe_coupon_id fall
-- back to the env-var coupon at checkout.

alter table public.referral_codes
  add column if not exists customer_discount_cents integer not null default 0,
  add column if not exists stripe_coupon_id text;

comment on column public.referral_codes.customer_discount_cents is
  'Per-code dollar discount at checkout in cents (e.g. 400 = $4). Constraint enforced by API: customer_discount_cents + payout_per_use_cents <= 900.';
comment on column public.referral_codes.stripe_coupon_id is
  'Stripe Coupon id created when the code is minted, if customer_discount_cents > 0. NULL = legacy code, fall back to env-var coupon at checkout.';
