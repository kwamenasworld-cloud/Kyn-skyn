-- Consent records — persists evidence that patient consented
-- Required for HIPAA compliance: must be able to prove consent was obtained

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,              -- 'telehealth' | 'medical_release' | 'hipaa_notice'
  consent_version text not null default '2026-04-10',  -- version of the policy consented to
  granted_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

alter table public.consent_records enable row level security;

create policy "Users can view own consents"
  on public.consent_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own consents"
  on public.consent_records for insert
  with check (auth.uid() = user_id);
