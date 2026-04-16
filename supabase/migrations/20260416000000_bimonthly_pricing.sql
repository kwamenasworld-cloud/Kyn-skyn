-- Bi-monthly cadence: 1-month supply, shipped/billed every 2 months
insert into public.pricing_config (key, value, label) values
  ('treatment_bimonthly', 89.99, 'Treatment Plan - billed every 2 months (1-month supply per shipment)'),
  ('treatment_bimonthly_prepay4', 179.98, 'Treatment Plan - 4-month prepay (2 shipments)')
on conflict (key) do update set value = excluded.value, label = excluded.label;
