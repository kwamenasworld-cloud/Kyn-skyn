-- Photos are functionally required (the booking flow asks for at least 2 and
-- warns of a 1-2 day delay if skipped). Update FAQ #8 on the consultation page
-- so the wording matches reality.

update public.faqs
set answer = $$<p>Yes. Please add at least 2 photos during intake; you can attach up to 5. If you skip them, your clinician will likely message you for photos before they can diagnose, which adds 1 to 2 days to your wait. We strip GPS and device metadata before storing them, and only your treating provider can see them.</p>$$
where page = 'consultation'
  and position = 8;
