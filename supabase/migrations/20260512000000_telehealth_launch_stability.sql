-- Launch stability additions for the MDI booking/webhook flow.

alter table public.mdi_webhook_events
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists processing_status text not null default 'pending',
  add column if not exists processed_at timestamptz,
  add column if not exists processing_error text,
  add column if not exists replay_count integer not null default 0,
  add column if not exists last_replayed_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mdi_webhook_events_processing_status_check'
  ) then
    alter table public.mdi_webhook_events
      add constraint mdi_webhook_events_processing_status_check
      check (processing_status in ('pending', 'processed', 'failed'));
  end if;
end $$;

create index if not exists mdi_webhook_events_status_idx
  on public.mdi_webhook_events (processing_status, received_at desc);

create index if not exists mdi_webhook_events_user_idx
  on public.mdi_webhook_events (user_id, received_at desc)
  where user_id is not null;

create table if not exists public.booking_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id text not null,
  status text not null default 'processing',
  mdi_case_id text,
  mdi_patient_id text,
  rollback_status text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_submissions_status_check
    check (status in ('processing', 'succeeded', 'failed', 'rollback_failed'))
);

create unique index if not exists booking_submissions_transaction_idx
  on public.booking_submissions (transaction_id);

create index if not exists booking_submissions_user_idx
  on public.booking_submissions (user_id, created_at desc);

alter table public.booking_submissions enable row level security;

drop policy if exists "Users can read own booking submissions"
  on public.booking_submissions;
create policy "Users can read own booking submissions"
  on public.booking_submissions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own booking submissions"
  on public.booking_submissions;
create policy "Users can insert own booking submissions"
  on public.booking_submissions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own booking submissions"
  on public.booking_submissions;
create policy "Users can update own booking submissions"
  on public.booking_submissions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.booking_submissions is
  'Idempotency and recovery ledger for paid consultation submissions.';
