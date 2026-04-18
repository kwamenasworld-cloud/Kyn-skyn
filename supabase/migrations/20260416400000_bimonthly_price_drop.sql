-- Drop bi-monthly from $109 to $89 — must undercut one-time ($99)
update public.pricing_config
  set value = 89.00, label = 'Treatment Plan — maintenance (every 2 months)', updated_at = now()
  where key = 'treatment_bimonthly';
