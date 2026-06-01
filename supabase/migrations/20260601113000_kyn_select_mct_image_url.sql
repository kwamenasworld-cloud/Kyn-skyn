-- Cache the live Shopify product image for the MCT Scalp Oil so the care
-- portal can render the product photo instead of the placeholder.

update public.shop_catalog
set image_url = 'https://cdn.shopify.com/s/files/1/0924/0477/7233/files/Oil_Coconut_NaturesOil_Vertical.jpg?v=1780273493'
where slug = 'kyn-mct-scalp-oil';
