-- Monthly care pulse nudges.
-- This table intentionally stores engagement metadata only. The clinical
-- answers are evaluated in-session and are not persisted in Kyn's database;
-- provider-review escalations route into the existing MDI case flow.

create table if not exists public.care_pulse_nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  pulse_month date not null default date_trunc('month', now())::date,
  status text not null default 'due',
  due_at timestamptz not null default now(),
  sent_at timestamptz,
  completed_at timestamptz,
  outcome text,
  email_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint care_pulse_nudges_status_check
    check (status in ('due', 'sent', 'completed')),
  constraint care_pulse_nudges_outcome_check
    check (outcome is null or outcome in ('self_guidance', 'provider_review_recommended')),
  constraint care_pulse_nudges_user_month_key unique (user_id, pulse_month)
);

create index if not exists care_pulse_nudges_user_created_idx
  on public.care_pulse_nudges (user_id, created_at desc);

create index if not exists care_pulse_nudges_due_idx
  on public.care_pulse_nudges (status, due_at)
  where status in ('due', 'sent');

alter table public.care_pulse_nudges enable row level security;

drop policy if exists "Users can read own care pulse nudges"
  on public.care_pulse_nudges;
create policy "Users can read own care pulse nudges"
  on public.care_pulse_nudges for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own care pulse nudges"
  on public.care_pulse_nudges;
create policy "Users can insert own care pulse nudges"
  on public.care_pulse_nudges for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own care pulse nudges"
  on public.care_pulse_nudges;
create policy "Users can update own care pulse nudges"
  on public.care_pulse_nudges for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists care_pulse_nudges_updated_at on public.care_pulse_nudges;
create trigger care_pulse_nudges_updated_at
  before update on public.care_pulse_nudges
  for each row execute function public.handle_updated_at();

comment on table public.care_pulse_nudges is
  'Non-clinical monthly care-pulse engagement metadata. Clinical answers are not stored here.';
