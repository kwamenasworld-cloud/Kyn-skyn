-- FAQ copy decision: never list specific drug names beyond a single
-- canonical "(e.g., ketoconazole)" example for the antifungal category.
-- This keeps marketing copy out of regulated-prescription territory and
-- avoids setting expectations the clinician may need to deviate from.

-- Consultation FAQ #3 (Can I get a prescription?) — add the canonical
-- example phrasing.
update public.faqs
set answer = $$<p>Yes. If your provider decides a prescription is the right call, they e-prescribe it straight to your pharmacy. That typically means a topical or oral antifungal (e.g., ketoconazole), depending on what you have.</p>$$
where page = 'consultation' and position = 3;

-- Ingredient checker FAQ #7 (tinea versicolor safe ingredients) —
-- previously listed multiple antifungal drug actives by name. Strip
-- those, keep only moisturizing ingredients, and reference the
-- clinician-prescribed antifungal in line with the canonical phrasing.
update public.faqs
set answer = $$<p>Tinea versicolor is caused by the same Malassezia yeast behind fungal acne and seb derm. Safe moisturizing ingredients include glycerin, hyaluronic acid, niacinamide, squalane, and dimethicone. Treatment usually involves a clinician-prescribed antifungal (e.g., ketoconazole). Skip coconut oil, olive oil, shea butter, and any other plant oil with C12 to C24 fatty acids.</p>$$
where page = 'ingredient_checker' and position = 7;
