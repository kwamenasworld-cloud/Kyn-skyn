# Kyn Skyn — Codebase Map

Skincare brand for fungal-acne-prone skin. Repo contains three loosely coupled pieces:
1. **Marketing site** — static HTML + Shopify Liquid theme (root)
2. **Telehealth app** — Next.js + Supabase + Stripe (`telehealth/`)
3. **Tooling** — Python/Node scripts for prospecting + pitch decks (`scripts/`, `output/`)

## Repo Layout

```
/                              Marketing site (Shopify theme)
  layout/theme.liquid          Master Shopify theme shell — owns <head>, font-face,
                               :root vars, OG tags, mobile tab bar, <main> wrapper
  sections/*.liquid            Reusable Liquid sections (mirror the HTML pages)
  templates/*.json             Shopify page templates
  snippets/                    Small Liquid partials
  config/settings_*.json       Shopify theme settings
  locales/en.default.json      i18n (nearly empty — only pagination keys)
  assets/                      Shopify's flat asset dir — everything here ships to CDN.
                               4 woff2 fonts, site images/SVGs (logomark, body-map,
                               molecule, team photos), handbook PDF, logo animation mp4
  Brand-guidelines/            Reference PDFs + PNGs + logo archive (logos/ subfolder
                               with Logomark/Logoword/Horizontal/Scrambled variants).
                               NOT referenced by Shopify — pure brand archive.

telehealth/                    Next.js 16 + React 19 app — nested git repo (kyn-skyn-telehealth)
  MDI_INTEGRATION.md           Developer brief for the MD Integrations team
  src/app/                     Pages + API routes (App Router)
  src/app/api/                 Endpoints: auth, book, email, orders, payment,
                               rx-payment, shop-payment, pharmacy, profile,
                               referral, service, webhook/stripe, webhook/mdi
  src/components/              Header, Footer, Cart, PaymentForm, PharmacySearch,
                               PhotoUpload, ConsentForms, SessionTimeout…
  src/lib/                     supabase-browser, supabase-server, mdi-client,
                               mdi-types, mdi-mappers, email (Resend),
                               otc-products, rx-pricing, audit
  email-templates/             magic-link.html, signup-confirmation.html
  public/photos/               DUPLICATE of root /assets/ photos
  middleware.ts                Auth middleware
  tailwind.config.ts           Tailwind (only used inside telehealth/)
  vitest.config.ts             Vitest — aliases `server-only` to a no-op shim

supabase/
  config.toml                  Project config
  migrations/                  ~16 SQL files — actively edited (daily through Apr 16)
  functions/ocr/index.ts       Edge function for ingredient label OCR

scripts/
  derm_prospector.py           Dermatologist outreach prospector (NPI + Google enrich)
  npi_pull.py                  Standalone NPI registry pull → output/phase1_npi_raw.csv
  edit_deck.py, restructure_deck.py, design_rebuild.py,
  design_polish.py, final_fixes.py, overflow_fixes.py,
  check_pptx.py, check_pptx_deep.py          PPTX automation
  render-svg.mjs               Puppeteer SVG→PNG renderer
  capture.mjs                  Puppeteer: renders output/annotated-render.html
                               → output/kyn-skyn-annotated.png. Run from repo root.

output/                        Build artifacts (~200MB). Kyn_skyn_final.pptx +
                               Kyn_skyn_updated.pptx (referenced by scripts), PDFs,
                               100+ slide JPGs from review iterations, prospect Excel,
                               skin-annotation-tool.html, annotated-render.html
visuals/seb-derm/              Educational SVGs (+ rendered PNGs)
unpacked/                      Decompressed PPTX internals (293 files)
```

## Key facts

- **Host is Shopify. `sections/*.liquid` + `layout/theme.liquid` are the source of truth.** (Stale root `*.html` exports were deleted on 2026-04-19.)
- **No external CSS/JS files.** All styles and scripts are inline — `theme.liquid` owns shared styles (font-face, `:root` vars, header, footer, mobile tab bar, base responsive rules); each `sections/*.liquid` has its own page-specific `<style>` and `<script>` blocks.
- **Telehealth is a standalone Next.js app** with its own `package.json`, `node_modules`, Tailwind, and TypeScript. Don't mix its deps with the root.
- **Root `package.json`** has only Puppeteer (for `render-svg.mjs`).
- **Supabase migrations are live.** Edit forward, don't amend past migrations.
- **Assets are copied, not symlinked.** `assets/*.jpg` and `telehealth/public/photos/*.jpg` are duplicated.
- **Shopify `assets/` is FLAT.** Subfolders inside `assets/` don't deploy to Shopify — all asset refs use `{{ "filename" | asset_url }}` with no path. Keep flat.

## Known issues (from 2026-04-19 review)

1. **`contact.liquid` form inputs have no `<label>`s** (placeholder-only, lines 19-24). WCAG violation. Same pattern may recur in other sections — audit before assuming it's only here.
2. `contact.liquid` posts to Web3Forms (`api.web3forms.com/submit`), not Shopify's built-in contact form. Confirm this is intentional.

## Telehealth — MD Integrations swap (2026-04-24)

Ola Telehealth was fully replaced by MD Integrations (DoseSpot-proxy e-prescribing) pre-launch. Key facts:

- **Vendor:** MD Integrations. Base URL `https://api.mdintegrations.com/v1`. Sandbox via path prefix or `is_sandbox` flag.
- **Auth:** OAuth 2 client credentials → bearer JWT, 24h lifetime. `MDI_CLIENT_ID` / `MDI_CLIENT_SECRET` env. Token cached in module memory, 401 triggers refresh.
- **Model:** case-based async consultation. No time-slot scheduling. Booking flow is now 7 steps (was 8 — provider-slot step removed).
- **Payment:** Stripe owns it. The Stripe `payment_intent_id` rides along in MDI case `metadata`.
- **Webhooks:** `POST /api/webhook/mdi` verifies HMAC-SHA256 `Signature` + pre-registered `Authorization`. All deliveries logged to `public.mdi_webhook_events`. Patient-facing email dispatch is stubbed as `TODO(email)` until sandbox smoke-testing confirms payload shapes.
- **DB:** `ola_user_guid` column renamed to `mdi_patient_id` on `patients` + `user_order_refs` (migration `20260424000000_rename_ola_to_mdi.sql`). New table `mdi_webhook_events` (migration `20260424010000_mdi_webhook_events.sql`).
- **Tests:** `src/lib/__tests__/mdi-mappers.test.ts` and `mdi-client.test.ts` (HMAC signature verification). 27 tests passing via vitest.
- **Still TODO before launch:** wire patient-facing emails in the webhook `TODO(email)` branches once MDI payloads are confirmed in sandbox, sandbox smoke test with MDI creds. (The two MDI migrations were applied on 2026-04-24.)

Read `telehealth/MDI_INTEGRATION.md` for the full integration brief (endpoints hit, credentials needed, open questions for MDI).

## Cleanup log

### Done 2026-04-19
- Root `*.html` files deleted (stale Shopify exports).
- `unpacked/` deleted (293-file decompressed PPTX, unreferenced).
- `fonts/` deleted (only the deleted HTMLs used it — Shopify loads from `assets/`).
- `output/capture.mjs` → `scripts/capture.mjs`.
- Logo subfolders (`Logomark`, `Logoword`, `Horizontal`, `Scrambled Logoword`) moved from `assets/` → `Brand-guidelines/logos/` (Shopify assets is flat; these were archive material).
- `sections/contact.liquid`: added `aria-label` to each form input (WCAG fix).
- `output/` pruned from 286 → 41 files. Kept the latest JPG set (`vfinal-*`, 29 files, 14:08 timestamps) as a reference snapshot of the final deck; deleted all older iteration prefixes (`bcg-`, `dr-`, `current-`, `design-slide-`, `final-slide-`, `vr-slide-`, `r2-slide-`, `polish-slide-`, `review-slide-`, `overflow-`, `fix-slide-`, `fix2-slide-`, `fix3-slide-`, `fix4-slide-`, `ofix-slide-`, `r2-fix-slide-`, `verify-slide-`, `slide-`).

### Deliberately left alone
- **`telehealth/public/photos/`** duplication of root `assets/` team photos. Next.js and Shopify are separate apps; each owns its assets. Windows symlinks are unreliable. Duplication is correct.
- **`Brand-guidelines/Kyn Skyn Colours-{1..7}.pdf`** (7 different sizes). Not straight dupes — appear to be different pages/spreads. It's the brand archive folder; safe to leave.
- **`.claude/worktrees/distracted-lovelace/`** — worktree has uncommitted work (101 lines in `layout/theme.liquid`, 16 lines in `sections/header.liquid`). Don't touch.

## Free-consultation security (post-AffiliateBase-cutover)

Hardened paths so a logged-in patient can't get a case created without a real, server-validated payment. Anything that touches consultation pricing must keep these invariants:

- **`/api/payment`** never trusts client `amount` for `type: "consultation"`. Server requires the requested amount to match `canonicalOnetimePrice` exactly (1¢ rounding tolerance). `metadata.type = "consultation"` is set on every PaymentIntent it creates.
- **`verifyConsultationPaymentReference`** (in `lib/stripe-rollback.ts`) rejects if `metadata.type` is set to anything other than `"consultation"`, and rejects if `paymentIntent.amount < canonicalPrice - 1¢`. Caches the canonical price in module memory; refreshes when server restarts.
- **There is no Kyn-side discount engine.** Affiliate attribution lives in AffiliateBase. Client-side: their JS captures `?via=` / `?referral=` into the `ab_referral` cookie + `window.affiliatebase_referral`, and `PaymentForm.tsx` fires `affiliatebase("conversion", {...})` from the Stripe success callback. Server-side: `/api/payment` and `/api/subscription/create` stamp the captured referral onto Stripe PaymentIntent / Subscription `metadata.affiliatebase_referral` as a defense-in-depth path. Legacy `referral_codes`/per-code Stripe coupon/`MARGIN_CAP_CENTS` system was torn out 2026-05-24; Endorsely was swapped for AffiliateBase same day.
- **`BOOKING_TEST_TOKEN`** comparison uses `crypto.timingSafeEqual` — never reintroduce `===`.
- **Stripe metadata is server-set, never client-input.** If you ever let a client write to PaymentIntent metadata, AffiliateBase's attribution becomes spoofable.
- **Shopify payment-reference path is gone** from `/api/book` (post-embed-Stripe pivot, nothing produces `shopify:*` transaction_ids). `lib/shopify-care.ts` exists but isn't called; treat as deprecated.

Known limitations:
1. Admin gate is `ADMIN_EMAILS` env-list-only (no TOTP/hardware key).
2. `BOOKING_TEST_TOKEN` is a single static secret. Rotate via the env var if it leaks; whole check goes away post-launch.
3. Subscription conversions don't fire client-side (PaymentForm passes `amount=0` for plans, which the conversion helper skips). They rely on AffiliateBase reading the Stripe Subscription metadata; if AffiliateBase's Stripe integration isn't connected, subscription commissions are missed.

## Conventions

- Don't commit without explicit request.
- Supabase migrations: forward-only, dated prefix `YYYYMMDDHHMMSS_name.sql`.
- Telehealth uses Tailwind; marketing site uses hand-written CSS with `:root` variables.
- Scripts expect to be run from repo root (`scripts/foo.py` reads/writes `output/`).
