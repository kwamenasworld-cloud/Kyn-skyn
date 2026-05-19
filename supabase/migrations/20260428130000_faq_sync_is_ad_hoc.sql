-- Correct the sync/async FAQ. The earlier 20260428000000 migration framed
-- sync as "an add-on on Monthly and Quarterly Treatment Plans," which was
-- never the new model. After confirming with MDI on 2026-04-28: sync isn't
-- pre-purchased at booking. Every consultation starts async; the patient
-- can request a live video call ad-hoc from their dashboard for an extra
-- $15. MDI clinicians handle the call themselves (no native scheduling).

update public.faqs
set answer = $$<p>Every consultation starts async. A licensed provider (MD, DO, or NP) reviews your intake and photos and sends you a written diagnosis and treatment plan, usually within 48 hours, with follow-up questions in the same thread. If you'd rather speak with your clinician live, you can request a video call from your dashboard for an extra $15. Most people stay async; the video option is there if you want it.</p>$$
where page = 'consultation' and position = 2;
