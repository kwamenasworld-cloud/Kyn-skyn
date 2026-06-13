-- Clarify consultation FAQ payment positioning: Kyn Skyn is cash pay only.

update faqs
set
  question = $$Is this cash pay only?$$,
  answer = $$<p>Yes. Kyn Skyn is cash pay only. We do not bill insurance, so you pay directly at checkout before your provider reviews your intake.</p>$$,
  updated_at = now()
where page = 'consultation'
  and position = 4;
