-- Drop bi-monthly (maintenance cadence) from $89 to $69.99.
-- Effective rate: $35/mo — now the cheapest per-month tier, positioned
-- for stable patients who skip consults most cycles.
update public.pricing_config
  set value = 69.99, label = 'Treatment Plan — maintenance (every 2 months, $35/mo effective)', updated_at = now()
  where key = 'treatment_bimonthly';
