-- email_has_paid_account(email): true when an account with this email has
-- already PAID — an active/recent care subscription, or at least one succeeded
-- consultation booking. The booking intake calls this (via /api/account/
-- check-email) so a returning paying patient who starts a fresh GUEST checkout
-- under their existing email is stopped and sent to sign in, instead of paying
-- twice or creating a duplicate account.
--
-- "Paid" deliberately excludes stub accounts that signed up but never paid
-- (no succeeded booking, no active sub) — those may continue as guests.
--
-- SECURITY DEFINER so it can read auth.users + the billing tables; it returns
-- ONLY a boolean, never any row data. Execute is restricted to service_role
-- (the API route calls it server-side) so it can't be used as a public
-- paid-customer enumeration oracle via PostgREST RPC.
create or replace function public.email_has_paid_account(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    where lower(u.email) = lower(trim(p_email))
      and (
        exists (
          select 1 from public.booking_submissions b
          where b.user_id = u.id
            and b.status = 'succeeded'
        )
        or exists (
          select 1 from public.subscriptions s
          where s.user_id = u.id
            and s.status in ('active', 'trialing', 'past_due')
        )
      )
  );
$$;

revoke all on function public.email_has_paid_account(text) from public;
revoke all on function public.email_has_paid_account(text) from anon;
revoke all on function public.email_has_paid_account(text) from authenticated;
grant execute on function public.email_has_paid_account(text) to service_role;

-- Rollback: drop function if exists public.email_has_paid_account(text);
