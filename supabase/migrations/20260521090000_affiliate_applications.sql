-- Affiliate / creator partnership applications.
--
-- Public form at /refer collects applicant info. Founder reviews in
-- /admin/referrals and clicks "Approve" to mint a referral_codes row
-- (code_type='influencer') with the chosen payout per use.
--
-- We keep applications separate from referral_codes so that:
--   1. A pending application doesn't pollute the active-codes table.
--   2. We retain audit history of rejections without dead referral rows.
--   3. The shape of "what an applicant told us" can evolve without
--      muddying the production codes schema.

create table if not exists public.affiliate_applications (
  id uuid primary key default gen_random_uuid(),

  -- Who they are.
  name text not null,
  email text not null,

  -- Social presence. All optional individually but the API enforces
  -- that at least one of (instagram, tiktok, youtube) is supplied.
  instagram_handle text,
  tiktok_handle text,
  youtube_handle text,
  other_link text,

  -- Audience signal.
  audience_size integer,         -- self-reported follower count
  audience_description text,     -- "What does your audience care about?"
  why_kyn_skyn text,             -- "Why do you want to partner?"

  -- Payout config (mirrors referral_codes.owner_payout_*).
  payout_method text,            -- 'paypal' | 'venmo' | 'wise' | 'cashapp' | 'ach'
  payout_handle text,            -- the email/handle for that method

  -- Lifecycle.
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  approved_code_id uuid references public.referral_codes(id) on delete set null,
  admin_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliate_applications_status_idx
  on public.affiliate_applications (status, created_at desc);

create index if not exists affiliate_applications_email_idx
  on public.affiliate_applications (lower(email));

-- RLS: locked down to service role.
-- Public submissions hit the API route under service role anyway, and
-- only admins read the table via /api/admin/referrals.
alter table public.affiliate_applications enable row level security;

-- updated_at trigger reuses the helper from earlier migrations.
create trigger affiliate_applications_updated_at
  before update on public.affiliate_applications
  for each row execute function public.handle_updated_at();
