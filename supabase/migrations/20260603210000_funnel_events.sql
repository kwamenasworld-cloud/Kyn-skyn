-- First-party funnel / event tracking for the /book intake (and future surfaces).
-- PHI-LIGHT BY DESIGN: each row carries an anonymous session id, a coarse event
-- name, an optional step index, and small non-medical props (plan, total). It
-- NEVER stores questionnaire answers, photos, names, condition, or any health
-- data. Writes go through the service-role /api/track endpoint; reads through
-- the admin-gated analytics dashboard.

create table if not exists public.funnel_events (
  id bigint generated always as identity primary key,
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  step int,
  props jsonb,
  path text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists funnel_events_event_created_idx
  on public.funnel_events (event, created_at);
create index if not exists funnel_events_created_idx
  on public.funnel_events (created_at);
create index if not exists funnel_events_session_idx
  on public.funnel_events (session_id);

-- RLS on with NO policies: anon + authenticated are denied entirely. The
-- service-role key (used by /api/track to write and the admin dashboard to
-- read) bypasses RLS, so the table is reachable only through our own gated code.
alter table public.funnel_events enable row level security;

-- Aggregated rollup for the admin dashboard: distinct sessions per (event, step)
-- since a cutoff, so the dashboard never has to pull raw rows. Service-role only.
create or replace function public.funnel_summary(since timestamptz)
returns table (event text, step int, sessions bigint)
language sql
stable
as $$
  select event, step, count(distinct session_id) as sessions
  from public.funnel_events
  where created_at >= since
  group by event, step;
$$;

revoke execute on function public.funnel_summary(timestamptz) from public, anon, authenticated;

-- Rollback:
-- drop function if exists public.funnel_summary(timestamptz);
-- drop table if exists public.funnel_events;
