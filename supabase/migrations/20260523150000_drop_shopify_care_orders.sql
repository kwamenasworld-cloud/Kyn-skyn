-- Drop shopify_care_orders. Created in 20260522010000 to bridge Shopify
-- paid orders to the care funnel, but the embed-Stripe pivot removed
-- Shopify cart-add entirely. No code path writes or reads this table
-- now (the only writer was /api/webhook/shopify/orders-paid, just
-- deleted, and the only reader was lib/shopify-care.ts, also deleted).
--
-- Cascade-safe: nothing references shopify_care_orders via foreign key.

drop table if exists public.shopify_care_orders cascade;
