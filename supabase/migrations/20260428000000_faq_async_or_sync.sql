-- Positioning update: communicate that BOTH async and sync consultations
-- are available, instead of leading with "fully async, no scheduling".
-- Sync (live video) is an add-on on recurring plans; async is the default
-- on every plan. The FAQ now lays out both clearly.

update public.faqs
set answer = $$<p>You choose async or sync. Async means a written intake plus photos: a licensed provider (MD, DO, or NP) reviews everything and sends you a written diagnosis and treatment plan, usually within 48 hours, with follow-up questions in the same thread. Sync means a live video visit with a clinician, available as an add-on on the Monthly and Quarterly Treatment Plans. Most people start async and add video later if they want it.</p>$$
where page = 'consultation' and position = 2;
