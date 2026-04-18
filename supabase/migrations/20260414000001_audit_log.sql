-- Audit log — tracks PHI access events
-- Required by HIPAA Security Rule 45 CFR 164.312(b)

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,          -- 'view_orders', 'view_service', 'update_profile', 'book_appointment', 'save_transaction'
  resource_type text,            -- 'order', 'service', 'profile', 'appointment', 'transaction'
  resource_id text,              -- GUID of the resource accessed
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "Users can view own audit log"
  on public.audit_log for select
  using (auth.uid() = user_id);

create policy "Authenticated users can insert audit entries"
  on public.audit_log for insert
  with check (auth.uid() = user_id);

-- Index for querying by user and time range
create index audit_log_user_created on public.audit_log (user_id, created_at desc);
