-- Unbundle delivery: base subscription is now consultation + Rx only.
-- Ola consultation COGS rose to $49.99, so base dropped to $59.99 + optional delivery add-on.

-- New base: consultation + prescription (sent to patient's pharmacy)
update public.pricing_config
  set value = 59.99, label = 'Treatment Plan — consultation + Rx (monthly)', updated_at = now()
  where key = 'treatment_monthly';

-- Optional delivery + medication add-on ($50/mo equivalent, scales per billing cycle)
insert into public.pricing_config (key, value, label) values
  ('delivery_addon_monthly', 50.00, 'Delivery + medication add-on (per month of cycle)')
on conflict (key) do update
  set value = excluded.value, label = excluded.label, updated_at = now();
