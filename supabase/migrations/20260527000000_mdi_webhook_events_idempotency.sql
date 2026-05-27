-- MDI webhook idempotency.
--
-- Every MDI webhook payload includes a `notification_id` (stable per-event
-- UUID from MDI). Promote it to a first-class column so duplicate deliveries
-- — Stripe-style retry-after-no-200, or any at-least-once redelivery — fail
-- the insert in the webhook route and we short-circuit before processing.
--
-- Older events without a notification_id are still accepted; the unique index
-- is partial so NULLs don't collide.

alter table public.mdi_webhook_events
  add column if not exists notification_id text;

create unique index if not exists mdi_webhook_events_notification_id_key
  on public.mdi_webhook_events (notification_id)
  where notification_id is not null;

comment on column public.mdi_webhook_events.notification_id is
  'MDI per-event UUID (from webhook payload). Partial-unique to make duplicate webhook deliveries idempotent.';
