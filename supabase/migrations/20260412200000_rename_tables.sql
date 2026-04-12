-- Rename tables for clarity
-- saved_products → checker_saved_items (ingredient checker user data)
-- products → shop_catalog (admin-managed product catalog)

alter table public.saved_products rename to checker_saved_items;
alter table public.products rename to shop_catalog;

-- Update RLS policy names to match
alter policy "Anyone can view active products" on public.shop_catalog rename to "Anyone can view active catalog items";
