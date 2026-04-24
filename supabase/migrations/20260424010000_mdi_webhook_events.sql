-- Durable log of every webhook received from MD Integrations. Lets us
-- replay or debug by event type, and gives us a foreign-key anchor if
-- we want to later derive case status mirrors from the event stream.

create table if not exists public.mdi_webhook_events (
  id bigserial primary key,
  event_type text not null,
  case_id text,
  patient_id text,
  metadata text,
  payload jsonb not null,
  signature_valid boolean not null default false,
  received_at timestamptz not null default now()
);

create index if not exists mdi_webhook_events_event_type_idx
  on public.mdi_webhook_events (event_type);

create index if not exists mdi_webhook_events_case_id_idx
  on public.mdi_webhook_events (case_id)
  where case_id is not null;

create index if not exists mdi_webhook_events_received_at_idx
  on public.mdi_webhook_events (received_at desc);

comment on table public.mdi_webhook_events is
  'Append-only log of webhooks received from MD Integrations. Service-role only.';
