-- Stripe Identity verification sessions, one row per attempt. Created on
-- /api/book right after the MDI case is created, updated by the Stripe
-- webhook as the session progresses (`created` -> `processing` -> `verified`
-- or `requires_input` -> `canceled`).
--
-- A row with status='verified' for a given user_id means we never have to
-- charge another $1.50 to verify them again — /api/book skips creating a new
-- session when one already exists.

create table if not exists public.patient_identity_verifications (
  id                              uuid primary key default gen_random_uuid(),
  user_id                         uuid not null references auth.users(id) on delete cascade,
  stripe_verification_session_id  text not null unique,
  mdi_case_id                     text,
  status                          text not null default 'created'
    check (status in ('created', 'processing', 'verified', 'requires_input', 'canceled')),
  document_type                   text,
  document_country                text,
  document_state                  text,
  document_dob                    date,
  document_first_name             text,
  document_last_name              text,
  last_error_code                 text,
  last_error_reason               text,
  verified_at                     timestamptz,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists idx_patient_identity_verifications_user_id
  on public.patient_identity_verifications(user_id);
create index if not exists idx_patient_identity_verifications_status
  on public.patient_identity_verifications(status);
create index if not exists idx_patient_identity_verifications_mdi_case_id
  on public.patient_identity_verifications(mdi_case_id);

alter table public.patient_identity_verifications enable row level security;

-- Patients can read their own verifications (used by the booking page to show
-- the current verification status after they return from Stripe).
create policy "users read own identity verifications"
  on public.patient_identity_verifications for select
  to authenticated
  using (auth.uid() = user_id);

-- Writes are server-only via the service-role webhook + /api/book; no client
-- write policy on purpose.
