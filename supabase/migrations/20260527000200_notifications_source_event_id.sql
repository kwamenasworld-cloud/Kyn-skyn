-- Notification-side idempotency.
--
-- The mdi_webhook_events / stripe_processed_events dedup happens BEFORE we
-- decide to insert a notification, so in steady state this column is just a
-- belt-and-braces safety net. But we also want admin-tooling retries (the
-- existing "replay this MDI event" admin button) to be safe — replaying the
-- same source event should not double-stamp the patient's inbox.
--
-- Source convention: `mdi:<mdi_notification_id>` or `stripe:<stripe_event_id>`,
-- or `mdi-event:<event_type>:<webhook_event_row_id>` when MDI omits
-- notification_id. Partial unique index so legacy rows (null) don't collide.

alter table public.notifications
  add column if not exists source_event_id text;

create unique index if not exists notifications_source_event_id_key
  on public.notifications (source_event_id)
  where source_event_id is not null;

comment on column public.notifications.source_event_id is
  'Stable per-source-event key (e.g. mdi:<notification_id>, stripe:<event_id>) so duplicate webhook deliveries and admin replays do not double-stamp the inbox.';
