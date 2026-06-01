-- Kyn Select: wire the MCT Scalp Oil to its Shopify product and broaden its
-- targeting. It is now recommended for both facial and scalp seborrheic
-- dermatitis (previously facial seb derm + fungal acne) and is eligible at
-- intake (phase 'any', was 'maintenance') so it can be offered as a one-time
-- checkout add-on to brand-new (acute-phase) patients.
--
-- Linked to the "coconut oil - fractionated mct" product, 2 oz variant
-- (53611199594769, $5.99). Price is set to the variant's retail price so the
-- Stripe charge and the Shopify order line stay consistent; live Collective
-- shipping is added on top at checkout.
--
-- Idempotent: re-running sets the same fixed values.
-- Rollback: set conditions = array['fungal_acne','face_seb_derm'],
--   treatment_phase = 'maintenance', price = 24.00, shopify_variant_id = null,
--   shopify_product_handle = null where slug = 'kyn-mct-scalp-oil'.

update public.shop_catalog
set
  conditions = array['face_seb_derm', 'scalp_dandruff'],
  treatment_phase = 'any',
  price = 5.99,
  shopify_variant_id = '53611199594769',
  shopify_product_handle = 'coconut-oil-fractionated-mct'
where slug = 'kyn-mct-scalp-oil';
