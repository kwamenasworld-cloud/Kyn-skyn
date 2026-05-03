-- Replace em dashes in user-facing FAQ answers with cleaner punctuation.
-- The brand voice is no em dashes; the rendered markup in
-- sections/consultation.liquid is already clean, but scripts/sync-faqs.mjs
-- regenerates that markup from this table whenever a FAQ is edited in
-- Supabase Studio, so the data has to match.
--
-- Targeted UPDATEs (rather than a global regex replace) so each
-- replacement reads naturally per sentence.

update public.faqs set answer = replace(
  answer,
  $$upload photos of your skin — no scheduling, no video call.$$,
  $$upload photos of your skin. No scheduling, no video call.$$
) where page = 'consultation' and position = 2;

update public.faqs set answer = replace(
  answer,
  $$but some don't — call yours before you book.$$,
  $$but some don't, so call yours before you book.$$
) where page = 'consultation' and position = 4;

update public.faqs set answer = replace(
  answer,
  $$separate from the shop — your clinical data never sits next to your order history.$$,
  $$separate from the shop, so your clinical data never sits next to your order history.$$
) where page = 'consultation' and position = 5;

update public.faqs set answer = replace(
  answer,
  $$tinea versicolor — and can prescribe the antifungals you can't buy over the counter.$$,
  $$tinea versicolor, and they can prescribe the antifungals you can't buy over the counter.$$
) where page = 'consultation' and position = 6;

update public.faqs set answer = replace(
  answer,
  $$please upload them if you can — they make a real difference for your provider.$$,
  $$please upload them if you can. They make a real difference for your provider.$$
) where page = 'consultation' and position = 8;

-- Pricing labels in public.pricing_config also picked up em dashes through
-- successive UPDATE migrations. The label field isn't currently rendered on
-- the marketing site, but keep the data clean since it's brand copy.
update public.pricing_config
set label = replace(label, ' — ', ', ')
where label like '% — %';
