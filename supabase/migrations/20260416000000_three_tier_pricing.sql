-- Three-tier pricing: Monthly $79, Quarterly $225, One-time $99
-- Kill self/delivered split — all treatment plans include delivery now

-- Core tiers
update public.pricing_config
  set value = 79.00, label = 'Treatment Plan (monthly)', updated_at = now()
  where key = 'treatment_monthly';

update public.pricing_config
  set value = 99.00, label = 'Treatment Plan (one-time)', updated_at = now()
  where key = 'treatment_onetime';

-- New quarterly tier
insert into public.pricing_config (key, value, label) values
  ('treatment_quarterly', 225.00, 'Treatment Plan (quarterly — $75/mo effective)')
on conflict (key) do update
  set value = excluded.value, label = excluded.label, updated_at = now();

-- Remove deprecated self/delivered keys
delete from public.pricing_config where key in (
  'treatment_self',
  'treatment_delivered',
  'treatment_self_onetime',
  'treatment_delivered_onetime'
);
