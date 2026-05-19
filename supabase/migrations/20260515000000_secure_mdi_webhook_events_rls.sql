-- Explicitly codify service-role-only access to the MDI webhook event log.
-- Payloads must remain PHI-stripped before insertion.

alter table public.mdi_webhook_events enable row level security;

comment on table public.mdi_webhook_events is
  'Append-only PHI-stripped webhook log from MD Integrations. No public RLS policies; service-role/admin access only.';
