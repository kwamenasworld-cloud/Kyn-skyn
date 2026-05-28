-- Lock down patients.mdi_patient_id and patients.stripe_customer_id so the
-- authenticated role can never set or change them from the browser. Same for
-- user_order_refs (mdi_patient_id, order_guid, user_id) — those rows must be
-- created server-side by /api/book + the MDI sync worker, never by a client
-- POST. Pre-launch hardening — without these guards a logged-in user can
-- forge ownership of arbitrary MDI patient/case records via Supabase REST
-- and then trick our /api/orders/[guid], /api/service/[guid], /api/messages,
-- /api/profile and /api/cases endpoints into returning another patient's data.

-- patients: drop the broad UPDATE policy and add one that allows updates
-- only when bridge fields don't change. A BEFORE INSERT/UPDATE trigger
-- enforces the same invariant for any code path that reaches the table
-- through a non-service role (defence in depth — column-level RLS would
-- be cleaner but Postgres doesn't have native column-level grants for
-- RLS WITH CHECK).

create or replace function public.patients_guard_bridge_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    ''
  );
begin
  -- service_role is the only writer that may set or change the bridge
  -- fields. anon never reaches authenticated-only tables; authenticated
  -- (browser session) is what we are hardening here.
  if v_role = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.mdi_patient_id is not null then
      raise exception 'patients.mdi_patient_id can only be set by the server'
        using errcode = '42501';
    end if;
    if new.stripe_customer_id is not null then
      raise exception 'patients.stripe_customer_id can only be set by the server'
        using errcode = '42501';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.mdi_patient_id is distinct from old.mdi_patient_id then
      raise exception 'patients.mdi_patient_id can only be changed by the server'
        using errcode = '42501';
    end if;
    if new.stripe_customer_id is distinct from old.stripe_customer_id then
      raise exception 'patients.stripe_customer_id can only be changed by the server'
        using errcode = '42501';
    end if;
    -- user_id is the auth.users link and must never be repointed by a
    -- non-service writer. RLS already keeps a user from updating another
    -- row, but a USER_ID rewrite of their own row would still be wrong.
    if new.user_id is distinct from old.user_id then
      raise exception 'patients.user_id is immutable'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists patients_guard_bridge_fields on public.patients;
create trigger patients_guard_bridge_fields
  before insert or update on public.patients
  for each row execute function public.patients_guard_bridge_fields();

-- user_order_refs: drop the user-side INSERT policy. The only legitimate
-- writers are /api/book (via the MDI sync worker) and the MDI webhook
-- processor — both run as service role and bypass RLS. Removing the
-- policy closes the self-claim attack where a client could insert a row
-- pinning an arbitrary order_guid + mdi_patient_id to their user_id and
-- then read another patient's MDI case via /api/orders/[guid].

drop policy if exists "Users can insert own order refs" on public.user_order_refs;

-- Also guard against any future code path that grants the authenticated
-- role insert/update on this table — a row's user_id and order_guid must
-- never be repointed by a non-service writer.
create or replace function public.user_order_refs_guard_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    ''
  );
begin
  if v_role = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'user_order_refs rows can only be created by the server'
      using errcode = '42501';
  elsif tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
       or new.order_guid is distinct from old.order_guid
       or new.mdi_patient_id is distinct from old.mdi_patient_id then
      raise exception 'user_order_refs identity columns can only be changed by the server'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists user_order_refs_guard_writes on public.user_order_refs;
create trigger user_order_refs_guard_writes
  before insert or update on public.user_order_refs
  for each row execute function public.user_order_refs_guard_writes();
