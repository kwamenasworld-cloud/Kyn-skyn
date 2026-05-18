-- B2 decoupling: move ALL MDI write operations (file upload, patient create,
-- pharmacy link, case create) out of the /api/book request path and into a
-- queue drained by a worker. A sustained MDI outage no longer fails the
-- patient's booking submit — the row just stays "pending" until MDI recovers.
--
-- Lifecycle of a row:
--   1. /api/book inserts row with status='pending' (or 'awaiting_identity'
--      if the patient hasn't cleared Stripe Identity yet).
--   2. Stripe Identity verification webhook flips identity_verified_at when
--      the patient passes; that also flips status from 'awaiting_identity'
--      to 'pending'.
--   3. The mdi-sync worker picks up status='pending' rows on a cron tick,
--      walks them through the MDI steps idempotently (skip already-done
--      sub-steps), and flips status='complete' on the last one.
--   4. Files in pending-intake-files Storage bucket are deleted after the
--      row hits status='complete' (worker handles).

create table if not exists public.pending_mdi_sync (
  id                                uuid primary key default gen_random_uuid(),
  user_id                           uuid not null references auth.users(id) on delete cascade,
  booking_submission_id             uuid,

  -- Inputs the worker will replay against MDI. Stored as JSON snapshots
  -- so the worker is independent of the row's authoring session.
  --
  -- patient_payload: createPatient body sans driver_license_id (worker
  -- fills that in once the ID file uploads). Shape mirrors
  -- MdiCreatePatientRequest minus is_sandbox/metadata which the lib adds.
  patient_payload                   jsonb not null,
  case_questions                    jsonb not null default '[]'::jsonb,
  case_metadata                     text not null,
  preferred_pharmacy_id             text,

  -- Files staged in the pending-intake-files Storage bucket. Worker walks
  -- this array, uploads each to MDI, records the resulting MDI file_id
  -- back on the entry, then proceeds.
  --
  -- Shape per entry:
  --   {
  --     storage_path: "<user_id>/<sync_id>/<filename>",
  --     original_name: "skin-front.jpg",
  --     mdi_file_type: "face-photo" | "driver-license" | ...,
  --     mdi_file_id: "<set by worker after upload>"
  --   }
  files                             jsonb not null default '[]'::jsonb,

  -- Identity gate. /api/book sets identity_required=true and creates the
  -- Stripe Identity session in parallel; the Stripe webhook flips
  -- identity_verified_at when the patient passes. Worker only runs
  -- (status='pending') after this clears.
  identity_required                 boolean not null default false,
  identity_verified_at              timestamptz,
  identity_verification_session_id  text,

  -- Worker state.
  status                            text not null default 'pending'
    check (status in ('pending', 'awaiting_identity', 'in_progress', 'complete', 'failed')),
  pharmacy_linked_at                timestamptz,

  -- Artifacts populated as the worker progresses.
  mdi_patient_id                    text,
  mdi_case_id                       text,

  -- Payment reconciliation — exactly one of these set when /api/book runs.
  payment_intent_id                 text,
  subscription_id                   text,

  attempts                          int not null default 0,
  last_attempt_at                   timestamptz,
  last_error                        text,

  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now()
);

-- One sync row per booking_submission. If /api/book retries (failed submission
-- restart), it should reuse the existing sync row rather than spawn a parallel
-- one — the worker's idempotency relies on a single source of truth per booking.
create unique index if not exists idx_pending_mdi_sync_submission_unique
  on public.pending_mdi_sync(booking_submission_id)
  where booking_submission_id is not null;

create index if not exists idx_pending_mdi_sync_status
  on public.pending_mdi_sync(status);
create index if not exists idx_pending_mdi_sync_user_id
  on public.pending_mdi_sync(user_id);
create index if not exists idx_pending_mdi_sync_identity_session
  on public.pending_mdi_sync(identity_verification_session_id)
  where identity_verification_session_id is not null;
create index if not exists idx_pending_mdi_sync_payment_intent_id
  on public.pending_mdi_sync(payment_intent_id)
  where payment_intent_id is not null;
-- Worker scans this index on every tick: rows that are ready to run, oldest first.
create index if not exists idx_pending_mdi_sync_ready
  on public.pending_mdi_sync(status, created_at)
  where status = 'pending';

alter table public.pending_mdi_sync enable row level security;

-- Patients can read their own row — used by the dashboard to show "your
-- case is being prepared" between submit and worker completion.
create policy "users read own pending mdi sync"
  on public.pending_mdi_sync for select
  to authenticated
  using (auth.uid() = user_id);

-- Writes are server-only via /api/book (anon-routed with auth.uid()) and
-- the worker + Stripe webhook (service role). No insert/update/delete
-- policies for the authenticated role; the route uses the service-role
-- client for writes.

-- Private Storage bucket for staged intake photos. Files live here only
-- between /api/book persist and worker MDI upload — deleted on completion.
-- Service role bypasses RLS so no policies needed for the worker; absence
-- of any read policy means no patient or anon role can list these objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pending-intake-files',
  'pending-intake-files',
  false,
  10485760, -- 10MB matches MAX_PHOTO_SIZE_BYTES in book-security.ts
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;
