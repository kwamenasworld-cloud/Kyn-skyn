-- FAQs are edited in Supabase Studio. A statement-level trigger calls a GitHub
-- repository_dispatch endpoint via pg_net on insert/update/delete. The PAT is
-- stored in Supabase Vault under name 'github_pat_for_faq_sync'; if no secret
-- is configured the trigger silently no-ops, which lets the migration apply
-- before the PAT is set up.

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  page text not null check (page in ('consultation', 'ingredient_checker')),
  position int not null,
  question text not null,
  answer text not null,
  dynamic_pricing boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index faqs_page_active_pos on public.faqs (page, is_active, position);

alter table public.faqs enable row level security;

create policy "Anyone can read active FAQs"
  on public.faqs for select
  using (is_active = true);

create or replace function public.faqs_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger faqs_set_updated_at
  before update on public.faqs
  for each row execute function public.faqs_set_updated_at();

-- Seed from current hardcoded FAQs in sections/consultation.liquid
-- and sections/ingredient-checker.liquid.
insert into public.faqs (page, position, question, answer, dynamic_pricing) values
  ('consultation', 1, $$What conditions can I get diagnosed for?$$, $$<p>Our providers focus on Malassezia-related skin conditions: fungal acne (Malassezia folliculitis), seborrheic dermatitis, and tinea versicolor. They all trace back to the same yeast overgrowth, which is why generic acne or eczema treatments tend to miss.</p>$$, false),
  ('consultation', 2, $$How does the consultation work?$$, $$<p>You fill out a thorough intake and upload photos of your skin — no scheduling, no video call. A licensed provider (MD, DO, or NP) reviews everything and sends you a written diagnosis and treatment plan, usually within 24 hours. You can ask follow-up questions in the same thread.</p>$$, false),
  ('consultation', 3, $$Can I get a prescription?$$, $$<p>Yes. If your provider decides a prescription is the right call, they e-prescribe it straight to your pharmacy. That typically means a topical or oral antifungal, depending on what you have.</p>$$, false),
  ('consultation', 4, $$Is this covered by insurance?$$, $$<p>It depends on your plan. A lot of insurers do cover virtual dermatology visits, but some don't — call yours before you book. We'll hand you an itemized receipt so you can file a claim yourself.</p>$$, false),
  ('consultation', 5, $$How is my health information protected?$$, $$<p>All consultations run on a HIPAA-compliant platform. Your medical records are encrypted at rest and in transit, and we don't share them with third parties. We also keep the care platform entirely separate from the shop — your clinical data never sits next to your order history.</p>$$, false),
  ('consultation', 6, $$I already used the Ingredient Checker. Should I still book?$$, $$<p>The Ingredient Checker flags products that may be feeding Malassezia, but it can't diagnose you. A provider can tell you whether it's actually fungal acne, seb derm, or tinea versicolor — and can prescribe the antifungals you can't buy over the counter.</p>$$, false),
  ('consultation', 7, $$How much does a consultation cost?$$, $$<p>Treatment Plans are $59.99/month, $69.99 every 2 months, or $149 quarterly. All include your provider consultation and prescription sent to your pharmacy. A one-time consult is $79. Payment runs securely through Stripe.</p>$$, true),
  ('consultation', 8, $$Do I need to upload photos of my skin?$$, $$<p>Photos are optional, but please upload them if you can — they make a real difference for your provider. You can attach up to 5 during intake. We strip GPS and device metadata before storing them, and only your treating provider can see them.</p>$$, false),
  ('consultation', 9, $$How do I select a pharmacy?$$, $$<p>During booking, you search for pharmacies by name and ZIP code. If your provider prescribes anything, the e-prescription is sent to whichever pharmacy you picked.</p>$$, false),
  ('consultation', 10, $$What payment methods do you accept?$$, $$<p>All payments run through Stripe. We take major credit and debit cards (Visa, Mastercard, Amex, Discover), plus Apple Pay and Google Pay.</p>$$, false),
  ('ingredient_checker', 1, $$What is Malassezia and why does it matter for skincare?$$, $$<p>Malassezia is a genus of yeast that naturally lives on human skin. When it overgrows, it can cause fungal acne (Malassezia folliculitis), seborrheic dermatitis, dandruff, and tinea versicolor. A lot of common skincare ingredients contain fatty acids in the C12 to C24 range that this yeast feeds on, which tends to make those conditions flare. This tool flags those ingredients on a label.</p>$$, false),
  ('ingredient_checker', 2, $$How do I check if my skincare is fungal acne safe?$$, $$<p>Use this free tool. Paste in the product's ingredient list, scan the label with your camera, or pick a product from the built-in database of 77+ popular items (CeraVe, Vanicream, The Ordinary, La Roche-Posay, and so on). Every Malassezia-feeding ingredient gets flagged with a swap suggestion. There's more background in our <a href="/pages/handbook">Malassezia Handbook</a>.</p>$$, false),
  ('ingredient_checker', 3, $$What ingredients should I avoid for fungal acne?$$, $$<p>Avoid ingredients with fatty acid chains in the C12 to C24 range. That covers most plant oils (coconut, olive, argan, jojoba, rosehip), free fatty acids (lauric, stearic, oleic), esters such as isopropyl myristate and glyceryl stearate, polysorbates 20/40/60/80, and fermented ingredients like galactomyces ferment filtrate. Reach for squalane, MCT oil (C8/C10 only), mineral oil, dimethicone, or caprylic/capric triglyceride instead.</p>$$, false),
  ('ingredient_checker', 4, $$Is coconut oil safe for fungal acne?$$, $$<p>No. Coconut oil is loaded with lauric acid (C12), myristic acid (C14), and palmitic acid (C16), which Malassezia feeds on directly. Use MCT oil (caprylic/capric triglyceride, C8/C10 only) or squalane instead.</p>$$, false),
  ('ingredient_checker', 5, $$What moisturizer is safe for seborrheic dermatitis?$$, $$<p>Look for moisturizers with no fatty acids in the C12 to C24 range and no plant oils. Good bases are squalane, dimethicone, petrolatum, or caprylic/capric triglyceride. Commonly recommended seb derm options include Vanicream products, Sebamed Clear Face Care Gel, and The Ordinary Natural Moisturizing Factors. Run any product through the checker above if you're not sure.</p>$$, false),
  ('ingredient_checker', 6, $$Is CeraVe safe for fungal acne?$$, $$<p>Depends on the product. CeraVe Foaming Facial Cleanser scores well and has only one flagged ingredient. CeraVe Moisturizing Cream contains cetearyl alcohol and cetyl alcohol (debated fatty alcohols); some people with fungal acne tolerate them, others don't. Check specific CeraVe products in the tool above.</p>$$, false),
  ('ingredient_checker', 7, $$What skincare ingredients are safe for tinea versicolor?$$, $$<p>Tinea versicolor is caused by the same Malassezia yeast behind fungal acne and seb derm. Safe ingredients include glycerin, hyaluronic acid, niacinamide, squalane, dimethicone, zinc pyrithione, ketoconazole, selenium sulfide, salicylic acid, and azelaic acid. Skip coconut oil, olive oil, shea butter, and any other plant oil with C12 to C24 fatty acids.</p>$$, false),
  ('ingredient_checker', 8, $$Are fatty alcohols safe for fungal acne?$$, $$<p>Fatty alcohols like cetyl alcohol (C16), stearyl alcohol (C18), and cetearyl alcohol are debated in the fungal acne community. They tend to be better tolerated than oils and esters, but some people with Malassezia-prone skin still react. The tool marks these as "caution" rather than "unsafe." Patch test first if you're not sure.</p>$$, false),
  ('ingredient_checker', 9, $$What sunscreen is safe for fungal acne?$$, $$<p>Look for mineral sunscreens with zinc oxide or titanium dioxide as the active, and check that the inactive list is free of plant oils and fatty acid esters. EltaMD UV Clear SPF 46 and CeraVe Mineral Body Sunscreen SPF 50 are popular picks. Run the full ingredient list through the tool; plenty of sunscreens hide problem ingredients in the inactive section.</p>$$, false),
  ('ingredient_checker', 10, $$Is this tool a substitute for seeing a dermatologist?$$, $$<p>No. This tool is educational and helps you screen ingredients. It isn't a diagnosis or medical advice. If you think you have fungal acne, <a href="/pages/handbook#seb-derm">seborrheic dermatitis</a>, <a href="/pages/handbook#tinea">tinea versicolor</a>, or another Malassezia-related condition, see a dermatologist for diagnosis and treatment, or <a href="/pages/consultation">book a video consultation</a> with one of our licensed providers.</p>$$, false);

-- GitHub dispatch trigger added AFTER the seed so the initial inserts
-- don't fire 20 webhook events. Set the PAT once with:
--   select vault.create_secret('YOUR_PAT_HERE', 'github_pat_for_faq_sync');
create or replace function public.faqs_notify_github()
returns trigger language plpgsql security definer as $$
declare
  pat text;
begin
  select decrypted_secret into pat
    from vault.decrypted_secrets
    where name = 'github_pat_for_faq_sync'
    limit 1;

  if pat is null then
    return null;
  end if;

  perform net.http_post(
    url := 'https://api.github.com/repos/kwamenasworld-cloud/Kyn-skyn/dispatches',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || pat,
      'Accept', 'application/vnd.github+json',
      'Content-Type', 'application/json',
      'User-Agent', 'kyn-skyn-supabase-faq-sync'
    ),
    body := jsonb_build_object('event_type', 'faq-changed')
  );

  return null;
end;
$$;

create trigger faqs_after_change
  after insert or update or delete on public.faqs
  for each statement execute function public.faqs_notify_github();
