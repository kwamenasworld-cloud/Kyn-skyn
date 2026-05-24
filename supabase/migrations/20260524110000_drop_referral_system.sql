-- Drop the custom referral_codes / affiliate_invitations system. Endorsely
-- now owns affiliate attribution end-to-end via its Stripe App (it reads
-- endorsely_referral from the Stripe PaymentIntent + Subscription metadata
-- our app stamps in /api/payment and /api/subscription/create).
--
-- Order matters: drop the otc_orders FK column first (it's the only
-- non-cascade reference into referral_codes), then the child tables, then
-- the parents.

alter table if exists public.otc_orders
  drop column if exists referral_code_id;

drop table if exists public.affiliate_invitations;
drop table if exists public.referral_payouts;
drop table if exists public.referral_code_usage;
drop table if exists public.referral_codes;

-- patients.attribution jsonb column was added in 20260412000000_attribution.sql
-- and never read by any current code (verified by grep at teardown time).
alter table if exists public.patients
  drop column if exists attribution;
