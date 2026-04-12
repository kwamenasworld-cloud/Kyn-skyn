-- Telehealth tables — simplified bridge to Ola Digital
-- Ola Digital is the source of truth for all medical data.
-- Supabase only stores auth + bridge fields (no PHI).

-- Patients: bridge between Supabase auth and Ola Digital user accounts
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ola_user_guid text, -- set after first booking via Ola API
  order_guids text[] not null default '{}', -- Ola order GUIDs for this patient
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.patients enable row level security;

create policy "Patients can view own record"
  on public.patients for select
  using (auth.uid() = user_id);

create policy "Patients can insert own record"
  on public.patients for insert
  with check (auth.uid() = user_id);

create policy "Patients can update own record"
  on public.patients for update
  using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger patients_updated_at
  before update on public.patients
  for each row execute function public.handle_updated_at();
