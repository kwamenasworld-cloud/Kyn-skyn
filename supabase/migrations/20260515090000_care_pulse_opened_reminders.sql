-- Track non-clinical care-pulse engagement so nudges can be measured and
-- reminded once without storing health answers in Kyn's database.

alter table public.care_pulse_nudges
  add column if not exists opened_at timestamptz,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists reminder_count integer not null default 0;

create index if not exists care_pulse_nudges_reminder_idx
  on public.care_pulse_nudges (status, sent_at)
  where status = 'sent' and completed_at is null and reminder_count < 1;

comment on column public.care_pulse_nudges.opened_at is
  'First authenticated open of the monthly care-pulse link.';

comment on column public.care_pulse_nudges.reminder_sent_at is
  'Timestamp for the one allowed monthly reminder email.';

comment on column public.care_pulse_nudges.reminder_count is
  'Number of reminder emails sent for this monthly care pulse.';
