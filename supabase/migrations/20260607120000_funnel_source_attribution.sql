-- Adds traffic-source rollups for the admin analytics dashboard and excludes
-- Ghana traffic from first-party funnel analytics. The country value is written
-- by /api/track from deployment geo headers, not trusted from the client.

create or replace function public.funnel_summary(since timestamptz)
returns table (event text, step int, sessions bigint)
language sql
stable
as $$
  select event, step, count(distinct session_id) as sessions
  from public.funnel_events
  where created_at >= since
    and coalesce(upper(props->>'country_code'), '') not in ('GH', 'GHA', 'GHANA')
  group by event, step;
$$;

create or replace function public.funnel_source_summary(since timestamptz)
returns table (source text, sessions bigint, intake_sessions bigint, bookings bigint)
language sql
stable
as $$
  with cleaned as (
    select
      session_id,
      event,
      created_at,
      lower(nullif(props->>'traffic_source', '')) as traffic_source,
      lower(nullif(props->>'utm_source', '')) as utm_source,
      lower(nullif(props->>'referrer_host', '')) as referrer_host
    from public.funnel_events
    where created_at >= since
      and coalesce(upper(props->>'country_code'), '') not in ('GH', 'GHA', 'GHANA')
  ),
  session_sources as (
    select distinct on (session_id)
      session_id,
      case
        when coalesce(traffic_source, utm_source, referrer_host) ~ 'instagram|(^|[._-])ig([._-]|$)' then 'instagram'
        when coalesce(traffic_source, utm_source, referrer_host) ~ 'facebook|(^|[._-])fb([._-]|$)|meta' then 'facebook'
        when coalesce(traffic_source, utm_source, referrer_host) ~ 'tiktok' then 'tiktok'
        when coalesce(traffic_source, utm_source, referrer_host) ~ 'google' then 'google'
        when coalesce(traffic_source, utm_source, referrer_host) ~ 'bing|microsoft' then 'bing'
        when coalesce(traffic_source, utm_source, referrer_host) ~ 'youtube|youtu\.be' then 'youtube'
        when coalesce(traffic_source, utm_source, referrer_host) ~ 'email|newsletter|klaviyo' then 'email'
        when coalesce(traffic_source, utm_source, referrer_host) ~ 'affiliate|creator|influencer' then 'affiliate'
        else coalesce(traffic_source, utm_source, referrer_host, 'direct')
      end as source
    from cleaned
    order by session_id, created_at
  ),
  session_rollup as (
    select
      c.session_id,
      coalesce(s.source, 'direct') as source,
      bool_or(c.event = 'intake_landed') as reached_intake,
      bool_or(c.event = 'booking_complete') as booked
    from cleaned c
    left join session_sources s using (session_id)
    group by c.session_id, s.source
  )
  select
    source,
    count(*) as sessions,
    count(*) filter (where reached_intake) as intake_sessions,
    count(*) filter (where booked) as bookings
  from session_rollup
  group by source
  order by sessions desc, source asc;
$$;

revoke execute on function public.funnel_summary(timestamptz) from public, anon, authenticated;
revoke execute on function public.funnel_source_summary(timestamptz) from public, anon, authenticated;

-- Rollback:
-- drop function if exists public.funnel_source_summary(timestamptz);
-- restore public.funnel_summary(timestamptz) from 20260603210000_funnel_events.sql.
