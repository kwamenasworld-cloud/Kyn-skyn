-- Invite-based affiliate onboarding.
--
-- Replaces the apply-then-approve flow as the default path. The admin
-- picks the affiliate first (quality control), creates a referral_codes
-- row with the payout terms set but is_active=false and owner_* still
-- null, and creates a matching row here with an unguessable token. They
-- share https://care.kynskyn.com/refer/invite/<token> with the invitee.
--
-- The invitee opens that URL, sees the code + terms, submits their name,
-- email, and payout method/handle. On accept, the API:
--   1. fills owner_name/email/payout_method/payout_handle on the code,
--   2. flips referral_codes.is_active = true,
--   3. marks this invitation status = 'accepted', accepted_at = now().
--
-- Until acceptance the code is dormant — patients who enter it during
-- checkout get no discount and no payout is attributed.

create table if not exists public.affiliate_invitations (
  id uuid primary key default gen_random_uuid(),

  -- Unguessable token used in the invite URL. Issued by the admin
  -- create endpoint via crypto.randomBytes(24).toString('hex').
  token text not null unique,

  -- The pre-minted code this invitation activates on acceptance.
  referral_code_id uuid not null references public.referral_codes(id) on delete cascade,

  -- Admin-side context. invitee_email is informational only — the
  -- canonical owner_email lives on referral_codes and is filled in
  -- by the invitee themselves on the accept form (may differ).
  invitee_name text,
  invitee_email text,
  invitee_notes text,

  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  accepted_at timestamptz,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists affiliate_invitations_token_idx
  on public.affiliate_invitations (token);
create index if not exists affiliate_invitations_status_idx
  on public.affiliate_invitations (status, created_at desc);
create index if not exists affiliate_invitations_code_idx
  on public.affiliate_invitations (referral_code_id);

-- RLS: locked to service role. Public accept endpoint validates by token
-- using the service role key (not auth.uid), and admin reads/writes
-- through /api/admin/referrals/* under service role too.
alter table public.affiliate_invitations enable row level security;

create trigger affiliate_invitations_updated_at
  before update on public.affiliate_invitations
  for each row execute function public.handle_updated_at();
