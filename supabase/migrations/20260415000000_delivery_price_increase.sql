-- Raise delivery tier: $69→$79/mo, $89→$99 one-time
-- Driven by RxAve COGS (consult $25 + medication + $20 shipping)
update public.pricing_config
  set value = 79.00, updated_at = now()
  where key = 'treatment_delivered';

update public.pricing_config
  set value = 99.00, updated_at = now()
  where key = 'treatment_delivered_onetime';
