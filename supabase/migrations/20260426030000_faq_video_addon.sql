-- The "How does the consultation work?" FAQ previously claimed no video
-- call ever. The booking flow actually offers live video visits as an
-- optional add-on for Monthly and Quarterly Treatment Plans, so the FAQ
-- contradicted reality. Update the answer to acknowledge the add-on
-- without confusing customers about what the default async consult is.

update public.faqs
set answer = $$<p>You fill out a thorough intake and upload photos of your skin. The default consultation is fully async, no scheduling required. A licensed provider (MD, DO, or NP) reviews everything and sends you a written diagnosis and treatment plan, usually within 48 hours. You can ask follow-up questions in the same thread. If you prefer live video visits, those are available as an optional add-on on the Monthly and Quarterly Treatment Plans.</p>$$
where page = 'consultation' and position = 2;
