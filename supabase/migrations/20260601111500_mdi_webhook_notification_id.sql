-- Store MDI's stable per-notification identifier so webhook retries can be
-- treated idempotently before user notifications/audit rows are applied.

alter table public.mdi_webhook_events
  add column if not exists notification_id text;

create unique index if not exists mdi_webhook_events_notification_id_uidx
  on public.mdi_webhook_events (notification_id)
  where notification_id is not null;

comment on column public.mdi_webhook_events.notification_id is
  'MDI notification_id used to deduplicate at-least-once webhook deliveries.';
