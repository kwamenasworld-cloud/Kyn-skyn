-- Stripe webhook idempotency.
--
-- Stripe explicitly documents at-least-once delivery and recommends consumers
-- dedupe by `event.id`. Without this, a duplicate `invoice.payment_failed`
-- delivery walks our `subscriptions.failed_payment_count` from N to N+1
-- twice, prematurely tripping the lock-at-3 threshold. Same risk on
-- payment_intent.succeeded (double audit_log) and subscription updates.
--
-- The webhook route does INSERT ... ON CONFLICT DO NOTHING on this table
-- before applying any side effects. If the insert reports zero rows the
-- event has already been processed and we return 200 immediately.

create table if not exists public.stripe_processed_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create index if not exists stripe_processed_events_event_type_idx
  on public.stripe_processed_events (event_type, processed_at desc);

alter table public.stripe_processed_events enable row level security;

comment on table public.stripe_processed_events is
  'Idempotency ledger for Stripe webhook deliveries. Service-role only; no public RLS policies.';
