-- Make a failed or skipped Shopify push visible instead of silent. When a Kyn
-- Select charge succeeds but the order cannot be pushed to Shopify (unusable
-- variant, or the Admin API errors), the otc_orders row is marked so it can be
-- found and fulfilled manually rather than stranding a paid patient.
--   null   = not applicable / not a Kyn Select push
--   synced = pushed to Shopify (shopify_order_id is set)
--   error  = push attempted and failed (needs manual fulfillment)
-- The pre-charge guard in /api/kyn-select/order blocks the "no variant id / no
-- Admin API token" cases before taking money, so 'error' is the residual case:
-- configured + variant present, but the create call threw or returned nothing.
alter table if exists public.otc_orders
  add column if not exists shopify_sync_status text;

comment on column public.otc_orders.shopify_sync_status is
  'Kyn Select Shopify push outcome: null=n/a, synced=pushed ok, error=push failed (manual fulfillment needed)';

-- Rollback: alter table public.otc_orders drop column if exists shopify_sync_status;
