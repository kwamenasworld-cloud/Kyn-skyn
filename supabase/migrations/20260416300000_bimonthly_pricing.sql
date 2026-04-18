-- Bi-monthly maintenance tier: $109/2mo for stable patients
insert into public.pricing_config (key, value, label) values
  ('treatment_bimonthly', 109.00, 'Treatment Plan — maintenance (every 2 months)')
on conflict (key) do update
  set value = excluded.value, label = excluded.label, updated_at = now();
