-- Quarterly pricing tiers (~15% discount vs monthly)
-- Monthly: $49 treatment / $69 delivered → Quarterly: $42/mo ($126/qtr) / $59/mo ($177/qtr)
insert into public.pricing_config (key, value, label) values
  ('treatment_self_quarterly', 126.00, 'Treatment Plan - Rx to your pharmacy (quarterly, $42/mo)'),
  ('treatment_delivered_quarterly', 177.00, 'Treatment Plan + Delivery (quarterly, $59/mo)')
on conflict (key) do update set value = excluded.value, label = excluded.label;

-- Subscription pauses (snooze / pause)
create table if not exists public.subscription_pauses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paused_at timestamptz not null default now(),
  resume_at timestamptz not null,
  reason text, -- optional: user-provided reason
  status text not null default 'active' check (status in ('active', 'resumed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscription_pauses enable row level security;

create policy "Users can view own pauses"
  on public.subscription_pauses for select
  using (auth.uid() = user_id);

create policy "Users can insert own pauses"
  on public.subscription_pauses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pauses"
  on public.subscription_pauses for update
  using (auth.uid() = user_id);

-- Updated_at trigger (reuse existing function if available)
create trigger subscription_pauses_updated_at
  before update on public.subscription_pauses
  for each row execute function public.handle_updated_at();
