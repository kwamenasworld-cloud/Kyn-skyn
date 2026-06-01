-- Guest-checkout recovery stash. In the guest flow the patient pays BEFORE
-- verifying their email; if they bounce before finishing, their intake (which
-- otherwise lives only in browser memory) would be lost and the charge stranded.
-- /api/booking/stash writes this row at payment time, keyed by a random
-- resume_token that is emailed as a magic-link. On return the patient re-adds
-- photos and submits against the EXISTING payment (stripe_reference) instead of
-- paying again. /api/book marks the row completed once the case is created, and
-- /api/payment + /api/subscription use it to refuse a duplicate charge while one
-- is still awaiting verification.
--
-- NOTE: deliberately NOT named pending_bookings — that table already exists
-- (20260516020000) as the Stripe Identity verification holding pen for patients
-- who already have an account + MDI patient. This one covers the pre-account
-- GUEST gap: it is keyed by email (no user_id yet), since the account isn't
-- created until the patient verifies after paying.
--
-- It holds PII (email + intake answers), and only the booking APIs (service role,
-- which bypasses RLS) touch it, so RLS is enabled with no policies — denying all
-- anon/authenticated access.
create table if not exists public.guest_booking_recovery (
  id uuid primary key default gen_random_uuid(),
  resume_token text not null unique,
  email text not null,
  stripe_reference text not null unique,
  intake jsonb not null,
  status text not null default 'awaiting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guest_booking_recovery_email_idx
  on public.guest_booking_recovery (email);

alter table public.guest_booking_recovery enable row level security;

comment on table public.guest_booking_recovery is
  'Guest-checkout recovery stash. Written by /api/booking/stash at payment time (keyed by emailed resume_token), read on resume, marked completed by /api/book. Service-role only. Distinct from pending_bookings (Stripe Identity holding pen).';

-- Rollback: drop table if exists public.guest_booking_recovery;
