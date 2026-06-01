-- Kyn Select: surface Shopify fulfillment + tracking back into the care portal.
-- A Shopify fulfillments webhook (api/webhook/shopify-fulfillment) updates these
-- on the otc_orders row keyed by shopify_order_id, and the treatment-plan API
-- reads them so patients see shipped / tracking. Also give Kyn Select orders
-- their own source value so they're easy to query. Additive + idempotent.

alter table if exists public.otc_orders
  add column if not exists tracking_number text,
  add column if not exists tracking_url text;

-- Tag Kyn Select (card-on-file) orders distinctly from the internal Stripe shop.
alter table if exists public.otc_orders
  drop constraint if exists otc_orders_source_check;
alter table if exists public.otc_orders
  add constraint otc_orders_source_check
    check (source in ('care_stripe', 'shopify', 'kyn_select'));
