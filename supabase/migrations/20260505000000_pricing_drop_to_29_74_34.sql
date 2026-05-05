-- Pricing reset:
--   monthly:   $34.99 -> $29.99
--   quarterly: $89.99 -> $74.99   (relabeled "3-Month Treatment Plan" in UI)
--   one-time:  $39.99 -> $34.99
--
-- Sized to compete with Nurx's bundled offering. Internal key
-- 'treatment_quarterly' kept for backward compat with Stripe metadata,
-- subscription records, and the augment toggle on the consultation page.
-- Customer-facing copy now says "3 months" / "3-month plan".

update public.pricing_config
  set value = 29.99,
      label = 'Treatment Plan (monthly)',
      updated_at = now()
  where key = 'treatment_monthly';

update public.pricing_config
  set value = 74.99,
      label = '3-Month Treatment Plan (every 3 months)',
      updated_at = now()
  where key = 'treatment_quarterly';

update public.pricing_config
  set value = 34.99,
      label = 'One-time Consult',
      updated_at = now()
  where key = 'treatment_onetime';
