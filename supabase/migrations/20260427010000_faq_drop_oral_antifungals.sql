-- Positioning decision: never mention oral antifungals in FAQ copy.
-- Only topical antifungals are referenced. Drops "or oral" from the
-- prescription FAQ on the consultation page.

update public.faqs
set answer = $$<p>Yes. If your provider decides a prescription is the right call, they e-prescribe it straight to your pharmacy. That typically means a topical antifungal (e.g., ketoconazole), depending on what you have.</p>$$
where page = 'consultation' and position = 3;
