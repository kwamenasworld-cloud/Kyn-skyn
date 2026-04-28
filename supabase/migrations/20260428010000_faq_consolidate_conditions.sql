-- Consolidate the consultation FAQ #1 conditions list to match the
-- 3-condition site structure: Fungal Acne / Seb Derm & Dandruff /
-- Tinea Versicolor. Previously listed 4 items with dandruff separated
-- from seb derm; the site nav, cards, and dedicated pages all use the
-- combined "Seb Derm & Dandruff" framing now.

update public.faqs
set answer = $$<p>Three conditions, all driven by the same <em>Malassezia</em> yeast: fungal acne (Malassezia folliculitis), seb derm and dandruff (same condition; dandruff is just scalp seb derm), and tinea versicolor. Generic acne or eczema treatments tend to miss because they don't target yeast.</p>$$
where page = 'consultation' and position = 1;
