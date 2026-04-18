-- Add delivery-specific pricing keys
insert into public.pricing_config (key, value, label) values
  ('treatment_self', 49.00, 'Treatment Plan - Rx to your pharmacy (monthly)'),
  ('treatment_delivered', 79.00, 'Treatment Plan + Delivery (monthly)'),
  ('treatment_self_onetime', 59.00, 'Treatment Plan - Rx to your pharmacy (one-time)'),
  ('treatment_delivered_onetime', 99.00, 'Treatment Plan + Delivery (one-time)')
on conflict (key) do update set value = excluded.value, label = excluded.label;
