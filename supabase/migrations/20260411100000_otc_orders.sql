-- OTC cosmetics orders
create table if not exists public.otc_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  items jsonb not null,
  subtotal decimal(10,2) not null,
  shipping decimal(10,2) not null,
  total decimal(10,2) not null,
  referral_code_id uuid references public.referral_codes(id),
  discount_amount decimal(10,2) default 0,
  stripe_payment_intent varchar(255),
  shipping_address jsonb not null,
  status text not null default 'processing'
    check (status in ('processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.otc_orders enable row level security;

create policy "Users can view own OTC orders"
  on public.otc_orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own OTC orders"
  on public.otc_orders for insert
  with check (auth.uid() = user_id);
