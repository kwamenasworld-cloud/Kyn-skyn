-- Live Video Visits add-on: $59/mo (includes 1 call), $49 per extra call
insert into public.pricing_config (key, value, label) values
  ('video_addon_monthly', 59.00, 'Live Video Visits add-on (1 call/mo included)'),
  ('video_addon_extra_call', 49.00, 'Additional video call (per call)')
on conflict (key) do update
  set value = excluded.value, label = excluded.label, updated_at = now();
