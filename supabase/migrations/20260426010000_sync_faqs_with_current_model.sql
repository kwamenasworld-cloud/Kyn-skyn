-- Sync FAQ rows in public.faqs with the current site copy and the post-MDI model.
-- The seed in 20260425145402_create_faqs.sql had stale Ola-era pricing,
-- a 24h SLA that was tightened past what we operationally support, an
-- itemized-receipt promise we don't generate, em dashes the brand voice
-- avoids, missing dandruff in the conditions list, and a stale
-- "video consultation" link in the ingredient checker FAQ. This migration
-- brings every affected row in line with the current sections/*.liquid copy.

-- 1. Conditions list: add dandruff (scalp seb derm).
update public.faqs
set answer = $$<p>Our providers focus on Malassezia-related skin conditions: fungal acne (Malassezia folliculitis), seborrheic dermatitis, dandruff (scalp seborrheic dermatitis), and tinea versicolor. They all trace back to the same yeast overgrowth, which is why generic acne or eczema treatments tend to miss.</p>$$
where page = 'consultation' and position = 1;

-- 2. How the consultation works: soften SLA from 24h to 48h, drop em dash.
update public.faqs
set answer = $$<p>You fill out a thorough intake and upload photos of your skin. No scheduling, no video call. A licensed provider (MD, DO, or NP) reviews everything and sends you a written diagnosis and treatment plan, usually within 48 hours. You can ask follow-up questions in the same thread.</p>$$
where page = 'consultation' and position = 2;

-- 4. Insurance: drop the itemized-receipt promise and the em dash.
update public.faqs
set answer = $$<p>It depends on your plan. A lot of insurers do cover virtual dermatology visits, but some don't, so call yours before you book.</p>$$
where page = 'consultation' and position = 4;

-- 5. HIPAA: drop em dash.
update public.faqs
set answer = $$<p>All consultations run on a HIPAA-compliant platform. Your medical records are encrypted at rest and in transit, and we don't share them with third parties. We also keep the care platform entirely separate from the shop, so your clinical data never sits next to your order history.</p>$$
where page = 'consultation' and position = 5;

-- 6. Already used checker: drop em dash.
update public.faqs
set answer = $$<p>The Ingredient Checker flags products that may be feeding Malassezia, but it can't diagnose you. A provider can tell you whether it's actually fungal acne, seb derm, or tinea versicolor, and they can prescribe the antifungals you can't buy over the counter.</p>$$
where page = 'consultation' and position = 6;

-- 7. Cost: replace stale pricing ($59.99/$69.99/$149/$79 with bimonthly) with
-- the current monthly $34.99 / quarterly $89.99 / one-time $39.99 plan. Drop
-- the "15g" tube specificity and the pickup-frequency claim.
update public.faqs
set answer = $$<p>Treatment Plans are $34.99 a month, or $89.99 quarterly (about $30 a month). Both cover your provider consultation and your prescription, sent to the pharmacy you select during booking. A one-time consult is $39.99. Payment runs securely through Stripe.</p>$$
where page = 'consultation' and position = 7;

-- 8. Photos: soften "only your treating provider can see them" to acknowledge
-- the authorized care team. Supersedes 20260426000000_update_photos_faq.sql.
update public.faqs
set answer = $$<p>Yes. Please add at least 2 photos during intake; you can attach up to 5. If you skip them, your clinician will likely message you for photos before they can diagnose, which adds 1 to 2 days to your wait. We strip GPS and device metadata before storing them. Access is limited to your treating clinician and authorized Kyn Skyn care staff.</p>$$
where page = 'consultation' and position = 8;

-- Ingredient checker pos 10: the consult is async case-based via MD Integrations,
-- not a video call. Replace "video consultation" with "online consultation".
update public.faqs
set answer = $$<p>No. This tool is educational and helps you screen ingredients. It isn't a diagnosis or medical advice. If you think you have fungal acne, <a href="/pages/handbook#seb-derm">seborrheic dermatitis</a>, <a href="/pages/handbook#tinea">tinea versicolor</a>, or another Malassezia-related condition, see a dermatologist for diagnosis and treatment, or <a href="/pages/consultation">book an online consultation</a> with one of our licensed providers.</p>$$
where page = 'ingredient_checker' and position = 10;
