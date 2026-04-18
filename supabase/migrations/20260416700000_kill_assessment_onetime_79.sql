-- Kill the loss-making $35 Skin Assessment tier.
-- Ola consult COGS ($49.99) means $35 Assessment loses $16 per sale.
-- Drop one-time from $99 → $79 as the single "one-time consult" option.

delete from public.pricing_config where key = 'assessment_price';

update public.pricing_config
  set value = 79.00, label = 'One-time Consult (single visit, consult + Rx)', updated_at = now()
  where key = 'treatment_onetime';
