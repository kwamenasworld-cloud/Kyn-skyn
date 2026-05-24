-- Pin the clinician's resolution message per case so the Treatment Plan view
-- stays stable as follow-up messages arrive. Populated by the case_completed
-- webhook handler in telehealth/src/lib/mdi-webhook-processor.ts.
--
-- Nullable: pre-existing completed cases have no pin until either the
-- webhook fires for a new case_completed event or the API route's
-- template-phrase fallback locates the resolution message at read time.

alter table public.user_order_refs
  add column if not exists resolution_message_id text;

comment on column public.user_order_refs.resolution_message_id is
  'MDI message id pinned as the clinician''s treatment-plan resolution. Set when case_completed webhook fires.';
