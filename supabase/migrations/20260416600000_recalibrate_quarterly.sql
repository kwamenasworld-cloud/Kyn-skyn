-- Recalibrate quarterly pricing: $225 was based on old $79 monthly w/ delivery included.
-- New monthly is $59.99 (unbundled), so quarterly needs to drop to offer a real per-month discount.
-- $149/qtr = $49.67/mo effective = saves $10.32/mo vs monthly.

update public.pricing_config
  set value = 149.00, label = 'Treatment Plan (quarterly — $49.67/mo effective)', updated_at = now()
  where key = 'treatment_quarterly';
