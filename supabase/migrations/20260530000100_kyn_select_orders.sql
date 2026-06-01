-- Kyn Select: attribute Shopify OTC orders back to the individual patient.
-- The Shopify orders/create webhook (api/webhook/shopify-orders) upserts into
-- otc_orders keyed on shopify_order_id (idempotent across Shopify retries).
-- `source` distinguishes these from the internal Stripe storefront orders.
-- Additive + idempotent. Rollback: drop the added columns + index below.

alter table if exists public.otc_orders
  add column if not exists shopify_order_id text,
  add column if not exists source text not null default 'care_stripe'
    check (source in ('care_stripe', 'shopify'));

-- One otc_orders row per Shopify order. Partial unique so existing
-- care_stripe rows (null shopify_order_id) are unaffected and multiple
-- internal orders can coexist.
create unique index if not exists otc_orders_shopify_order_id_key
  on public.otc_orders (shopify_order_id)
  where shopify_order_id is not null;
