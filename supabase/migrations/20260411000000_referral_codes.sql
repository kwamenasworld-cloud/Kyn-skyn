-- Private referral code system
-- Admin creates codes in Supabase dashboard, patients enter at checkout

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) unique not null,
  discount_type text not null default 'percent'
    check (discount_type in ('percent', 'fixed')),
  discount_value decimal(10,2) not null,
  applies_to text not null default 'consultation'
    check (applies_to in ('consultation', 'medication', 'both')),
  max_uses integer, -- null = unlimited
  uses_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  note text, -- internal admin note
  created_at timestamptz not null default now()
);

create table if not exists public.referral_code_usage (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.referral_codes(id) on delete cascade,
  user_id uuid references auth.users(id),
  original_amount decimal(10,2) not null,
  discount_amount decimal(10,2) not null,
  final_amount decimal(10,2) not null,
  stripe_payment_intent varchar(255),
  created_at timestamptz not null default now(),
  unique (code_id, user_id)
);

-- RLS: anyone can read codes for validation, but not insert/update/delete
alter table public.referral_codes enable row level security;

create policy "Anyone can validate referral codes"
  on public.referral_codes for select
  using (true);

-- RLS: users can only see their own usage
alter table public.referral_code_usage enable row level security;

create policy "Users can view own referral usage"
  on public.referral_code_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own referral usage"
  on public.referral_code_usage for insert
  with check (auth.uid() = user_id);

-- Auto-increment uses_count when usage is inserted
create or replace function public.increment_referral_uses()
returns trigger as $$
begin
  update public.referral_codes
  set uses_count = uses_count + 1
  where id = new.code_id;
  return new;
end;
$$ language plpgsql;

create trigger referral_usage_increment
  after insert on public.referral_code_usage
  for each row execute function public.increment_referral_uses();
