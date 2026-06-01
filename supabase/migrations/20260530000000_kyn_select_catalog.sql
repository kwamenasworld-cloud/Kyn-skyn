-- Kyn Select: clinically matched OTC recommendations on the treatment plan.
-- Adds the catalog metadata that lets a shop_catalog row be surfaced as a
-- Kyn Select recommendation (matched to a patient's condition + treatment
-- phase) and added to the Shopify cart. All additive + idempotent.
-- Rollback: drop the added columns + index below.

alter table if exists public.shop_catalog
  add column if not exists shopify_variant_id text,
  add column if not exists shopify_product_handle text,
  add column if not exists kyn_select boolean not null default false,
  add column if not exists conditions text[] not null default '{}',
  add column if not exists treatment_phase text
    check (treatment_phase in ('acute', 'maintenance', 'any')),
  add column if not exists fulfillment_type text
    check (fulfillment_type in ('collective', 'dropship', 'made_to_order', 'owned')),
  add column if not exists clinical_reason text;

-- Lookup path for the recommendation query: active, flagged rows.
create index if not exists shop_catalog_kyn_select_idx
  on public.shop_catalog (kyn_select)
  where kyn_select = true and is_active = true;

-- Patient's condition, persisted from intake so Kyn Select recommendations
-- are deterministic without an extra MDI round-trip on every plan load.
-- Mirrors the condition-assets.ts PrimaryConcern union
-- (fungal_acne, tinea_versicolor, face_seb_derm, scalp_dandruff, multiple_unsure).
alter table if exists public.patients
  add column if not exists primary_concern text;
