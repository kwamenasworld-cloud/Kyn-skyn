-- Attribution tracking for UTM params from Shopify → Care portal
alter table public.patients add column if not exists attribution jsonb;
