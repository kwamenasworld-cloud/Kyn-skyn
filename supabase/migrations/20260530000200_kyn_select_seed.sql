-- Kyn Select: launch catalog. Shopify variant IDs are filled in manually
-- (Supabase Table Editor) after the products exist in Shopify. Rows with a
-- null shopify_variant_id are hidden from recommendations until set, so this
-- seed is safe to ship before the Shopify products are live.
-- Idempotent: on conflict (slug) do nothing.

insert into public.shop_catalog
  (slug, name, price, description, category, is_rx, is_active,
   kyn_select, conditions, treatment_phase, fulfillment_type, clinical_reason, sort_order)
values
  (
    'kyn-antifungal-shampoo',
    'Antifungal Shampoo',
    18.00,
    'Medicated wash for Malassezia-prone scalp and skin.',
    'treatment',
    false,
    true,
    true,
    array['fungal_acne', 'scalp_dandruff', 'face_seb_derm', 'tinea_versicolor'],
    'any',
    'dropship',
    'Helps manage flakes and buildup between prescription courses.',
    20
  ),
  (
    'kyn-mct-scalp-oil',
    'MCT Scalp Oil',
    24.00,
    'Lightweight MCT oil that hydrates without feeding Malassezia.',
    'treatment',
    false,
    true,
    true,
    array['fungal_acne', 'face_seb_derm'],
    'maintenance',
    'made_to_order',
    'Microbiome-safe hydration for ongoing maintenance.',
    21
  ),
  (
    -- Prescription antifungal. Dispensed by the pharmacy via MD Integrations,
    -- not sold through Shopify, so it is inactive and never add-to-cart-able
    -- (the recommendation query requires kyn_select + is_active + a variant).
    -- Kept as a catalog reference for plan context only.
    'kyn-ketoconazole-2',
    'Ketoconazole 2%',
    0.00,
    'Prescription antifungal dispensed by your pharmacy as part of your plan.',
    'treatment',
    true,
    false,
    false,
    array['fungal_acne', 'face_seb_derm', 'tinea_versicolor'],
    'acute',
    null,
    'Prescribed by your provider; shown here for plan context.',
    22
  )
on conflict (slug) do nothing;
