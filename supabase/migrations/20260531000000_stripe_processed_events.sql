-- Idempotency ledger for Stripe webhook deliveries (Stripe is at-least-once).
-- /api/webhook/stripe inserts {event_id, event_type} as its FIRST step and
-- treats a unique violation (23505) as a duplicate delivery. This table was
-- referenced by the webhook but never created by a migration, so every Stripe
-- delivery failed at the dedup insert and the handler returned 500 BEFORE any
-- side effect ran. Net effect: subscriptions were never recorded (the row stays
-- empty even though Stripe has an active subscription), invoice/identity side
-- effects never applied, and Stripe kept retrying into the same 500.
create table if not exists public.stripe_processed_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- Only the webhook (service role, which bypasses RLS) touches this table, so
-- enable RLS with no policies to deny all anon/authenticated access.
alter table public.stripe_processed_events enable row level security;

comment on table public.stripe_processed_events is
  'Idempotency ledger of processed Stripe webhook event ids. Written by /api/webhook/stripe before applying side effects; unique event_id makes redeliveries no-ops.';

-- Rollback: drop table if exists public.stripe_processed_events;
