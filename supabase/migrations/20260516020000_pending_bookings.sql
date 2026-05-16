-- Bookings that finished payment + photo upload + MDI patient creation but
-- are waiting for the patient to complete Stripe Identity verification before
-- the MDI case is actually created. This is the holding pen between
-- "patient paid and submitted" and "clinician sees the case in MDI" — the
-- whole point is that an unverified patient's case never lands in front of
-- the clinician.
--
-- The webhook on identity.verification_session.verified looks up the row by
-- pending_booking_id (carried in the Stripe Identity session metadata) and
-- calls createCase with everything stored here.

create table if not exists public.pending_bookings (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,

  -- MDI patient was created during /api/book; case will reference it.
  mdi_patient_id           text not null,

  -- Payment reconciliation. Exactly one of these is set per booking.
  payment_intent_id        text,
  subscription_id          text,

  -- Optional pointer back to the booking_submissions row so the webhook can
  -- update it to status='succeeded' with the new case id once the case is
  -- finally created.
  booking_submission_id    uuid,

  -- Everything createCase needs once verification clears.
  file_ids                 jsonb not null default '[]'::jsonb,
  case_questions           jsonb not null default '[]'::jsonb,
  case_metadata            text not null,

  status                   text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'expired')),

  -- Set on status='completed' so we can join verification rows back to the
  -- eventual case. Null until the webhook resolves the booking.
  mdi_case_id              text,
  last_error               text,
  resolved_at              timestamptz,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_pending_bookings_user_id on public.pending_bookings(user_id);
create index if not exists idx_pending_bookings_status on public.pending_bookings(status);
create index if not exists idx_pending_bookings_created_at on public.pending_bookings(created_at);
create index if not exists idx_pending_bookings_payment_intent_id
  on public.pending_bookings(payment_intent_id)
  where payment_intent_id is not null;

alter table public.pending_bookings enable row level security;

-- Patients can read their own pending bookings — used by the dashboard to
-- show "your case is being prepared" between identity verification and
-- webhook-driven case creation.
create policy "users read own pending bookings"
  on public.pending_bookings for select
  to authenticated
  using (auth.uid() = user_id);

-- Writes are server-only via /api/book and the Stripe webhook (service role).
