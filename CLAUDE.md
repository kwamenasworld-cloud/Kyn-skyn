# Kyn Skyn — Codebase Map

Skincare brand for fungal-acne-prone (Malassezia-driven) skin. The repo holds two
production apps plus supporting tooling:

1. **Marketing storefront** — Shopify Liquid theme (root). Hosted on Shopify; `master` auto-deploys to live kynskyn.com (no staging).
2. **Telehealth / care app** — Next.js + Supabase + Stripe + MD Integrations (`telehealth/`, a separate nested git repo). Deploys to `care.kynskyn.com`.
3. **Tooling** — Python/Node scripts in `scripts/` (FAQ sync, theme preview, SVG render, outreach prospecting, legacy pitch-deck automation).

The storefront **embeds** the care app: the "Kynsultation" consultation flow and the
Care Portal are iframes of `telehealth/`, so the two apps co-evolve.

## Repo layout (parent Shopify repo)

```
layout/theme.liquid      Master theme shell: <head>, font-face, :root vars, OG tags, header,
                         footer, mobile tab bar, <main> wrapper, base responsive CSS
sections/*.liquid        15 page sections: about, affiliate-hub, care-portal, coming-soon,
                         condition-care, consultation, contact, footer, handbook, header,
                         ingredient-checker, press, resources, shop, treatment-guide
templates/*.json         16 page templates (incl. condition pages fungal-acne /
                         seb-derm-dandruff / tinea-versicolor, ketoconazole + roflumilast guides)
snippets/                (empty)
config/                  settings_data.json + settings_schema.json
locales/en.default.json  i18n (nearly empty — pagination keys only)
assets/                  Flat CDN asset dir (~73 files): woff2 fonts, images/SVGs, handbook PDF,
                         logo animation mp4. MUST stay flat (see Key facts).
Brand-guidelines/        Brand archive (PDFs, PNGs, logos/). Not referenced by Shopify.
docs/local-preview.md    Local Shopify theme preview workflow
scripts/                 Tooling (see below)
supabase/                Shared backend: config.toml, 59 forward-only migrations (through
                         2026-05-24), functions/ocr/index.ts (ingredient-label OCR edge fn)
AGENTS.md                Quick agent context: parent/nested repo split + verified local CLIs
telehealth/              Next.js care app — SEPARATE nested git repo, gitignored here (see below)
```

`output/` (pitch-deck build artifacts) and the budget files (`Kyn-Skyn-Budget.xlsx`,
`scripts/build_budget.py`, `scripts/check_budget.py`) are gitignored / local-only, not
part of the repo. `telehealth/` is also gitignored by the parent (tracked separately).

## scripts/

- **Active:** `sync-faqs.mjs` (push FAQ content to Supabase), `dev-preview.ps1` (local Shopify theme preview — see `docs/local-preview.md`), `render-svg.mjs` + `capture.mjs` (Puppeteer SVG→PNG), `build_creator_outreach_list.py` / `derm_prospector.py` / `npi_pull.py` (US-only outreach prospecting).
- **Legacy pitch-deck automation** (operate on local `output/*.pptx`, gitignored): `edit_deck.py`, `restructure_deck.py`, `design_rebuild.py`, `design_polish.py`, `final_fixes.py`, `overflow_fixes.py`, `check_pptx.py`, `check_pptx_deep.py`.

Root `package.json` carries only Puppeteer (for `render-svg.mjs`). Scripts run from repo root.

## Key facts (storefront)

- **Host is Shopify. `sections/*.liquid` + `layout/theme.liquid` are the source of truth.** Pushing `master` deploys straight to live kynskyn.com.
- **No external CSS/JS.** All styles/scripts are inline: `theme.liquid` owns the shared styles (font-face, `:root` vars, header, footer, mobile tab bar, base responsive rules); each `sections/*.liquid` has its own page-specific `<style>` / `<script>`.
- **`assets/` is FLAT.** Subfolders don't deploy to Shopify; all refs use `{{ "filename" | asset_url }}` with no path. Keep it flat.
- **`contact.liquid` posts to Web3Forms** (`api.web3forms.com/submit`), not Shopify's built-in contact form. Inputs carry `aria-label`s.

## Preview / test theme

- The **streamlined storefront flow lives on the `test` branch**, previewed via a persistent **unpublished** Shopify theme (`#183643242769`) on store `1mehi7-fb.myshopify.com`. Re-push the working tree to that theme after test-branch changes. Ephemeral `shopify theme dev` previews are not the source of truth — a "reverted flow" is usually just a dead dev preview, so check the `test` branch before assuming lost work.
- Local preview workflow: `scripts/dev-preview.ps1` / `docs/local-preview.md`.

## Telehealth / care app (`telehealth/`)

A standalone **Next 16 + React 19** app (own `package.json`, `node_modules`, Tailwind,
TypeScript), nested repo `kyn-skyn-telehealth`, gitignored by the parent. Run git from
**inside** `telehealth/`; the parent `git status` does not describe telehealth state.
Deploys to `care.kynskyn.com` (Railway). Extensive vitest suite (`src/lib/__tests__` +
route `__tests__`).

**Responsibility split:** Kyn owns the portal shell, billing/subscriptions, Care Pulse,
shopping (Kyn Select), and account UX. **MD Integrations is the clinical source of truth**
(records, case history, provider messaging, prescriptions), surfaced via `/dashboard`,
`/messages`, and the MDI-hosted `/visit/*` workflows. The provider panel is all
board-certified dermatologists.

Major subsystems:

- **Booking → MDI sync:** `/book` → `/api/book` writes a `pending_mdi_sync` row; an async worker (`lib/mdi-sync-worker.ts`, `/api/internal/mdi-sync/tick`) drains it and creates/updates the MDI patient + case, then updates `booking_submissions` + `user_order_refs`. The async worker exists because MDI has no live sync / scheduling / video endpoint.
- **MDI client:** OAuth2 client-credentials → bearer JWT (`MDI_CLIENT_ID` / `MDI_CLIENT_SECRET`); HMAC-verified webhooks at `/api/webhook/mdi` logged to `mdi_webhook_events`; admin viewer + replay at `/admin/mdi-webhooks`. Patient↔clinician messaging is the white-label MDI portal iframed in via `/messages`.
- **Intake:** Form.io-driven (`lib/formio-intake.ts`, `FormioIntake.tsx`, `intake-to-mdi.ts`) with an admin flow editor/tester at `/admin/intake/*`. After a template change, run `telehealth/scripts/push-intake-template.ts` to sync the live questionnaire.
- **Billing:** Stripe subscriptions (`/api/subscription/*`, `lib/care-subscription.ts`, `lib/subscription-access.ts`, `/account/subscription`). Consultation pricing is server-validated (see security below).
- **Care Pulse:** deliberately **monthly** (not daily) engagement for active subscribers. Answers are evaluated then discarded; only `care_pulse_nudges` metadata persists. Railway cron → `/api/care-pulse/send-due`. See `telehealth/CARE_PULSE.md`.
- **Kyn Select:** in-portal OTC recommendations + purchase that pushes a paid order into Shopify after the Stripe charge (`lib/shopify-admin.ts`, `lib/shopify-orders.ts`, `/api/kyn-select/order`, `/api/webhook/shopify-orders`).
- **Affiliate:** AffiliateBase (`lib/affiliatebase.ts`, `AffiliateBaseScript.tsx`).

Telehealth docs: `AGENTS.md` (verified CLIs), `MDI_INTEGRATION.md` (full integration brief),
`CARE_PULSE.md` (cadence + data boundary), `PORTAL_QA.md` (launch QA + sandbox test path).

## Consultation-payment security (must preserve)

No patient (logged-in or guest) must be able to get a case created without a real,
server-validated payment. Anything touching consultation pricing must keep these invariants:

- **`/api/payment`** never trusts client `amount` for `type: "consultation"`. The server requires the requested amount to match `canonicalOnetimePrice` exactly (1¢ rounding tolerance) and sets `metadata.type = "consultation"` on every PaymentIntent it creates.
- **`verifyConsultationPaymentReference`** (`lib/stripe-rollback.ts`) rejects if `metadata.type` is anything other than `"consultation"`, and rejects if `paymentIntent.amount < canonicalPrice - 1¢`. It caches the canonical price in module memory and refreshes on server restart.
- **Guest checkout links payment by `email`, not just `user_id`.** Booking takes payment BEFORE account creation/verification, for all plans. `/api/payment` + `/api/subscription/create` stamp server-set `metadata.user_id` when authenticated, else `metadata.email` (guest). `verifyConsultationPaymentReference(reference, userId, userEmail?)` accepts the reference when `metadata.user_id === userId`, or (when no `user_id` is present) when `metadata.email === userEmail` (normalized) — never a blank/mismatched fallback. For guest subscriptions, `claimGuestStripeReference` stamps `user_id` onto the Stripe subscription + customer after the patient verifies via OTP. A guest who pays but bounces before verifying is recovered via the `guest_booking_recovery` table (`/api/booking/stash` writes it at payment, `/book/finish` resumes against the same reference); a 2h double-charge guard in both payment routes refuses a second guest charge while one is awaiting verification. (Do not confuse `guest_booking_recovery` with `pending_bookings`, the Stripe Identity holding pen.)
- **No Kyn-side discount engine.** Affiliate attribution lives in AffiliateBase. Client-side: their JS captures `?via=` / `?referral=` into the `ab_referral` cookie + `window.affiliatebase_referral`, and `PaymentForm.tsx` fires `affiliatebase("conversion", {...})` from the Stripe success callback. Server-side: `/api/payment` and `/api/subscription/create` stamp the captured referral onto Stripe `metadata.affiliatebase_referral` as defense-in-depth. The legacy `referral_codes` / per-code Stripe coupon / `MARGIN_CAP_CENTS` system was torn out 2026-05-24; Endorsely was swapped for AffiliateBase the same day.
- **`BOOKING_TEST_TOKEN`** comparison uses `crypto.timingSafeEqual` — never reintroduce `===`.
- **Stripe metadata is server-set, never client-input.** If a client can write PaymentIntent metadata, AffiliateBase attribution becomes spoofable. Never put PHI in Stripe metadata.
- The **consultation/booking flow has no Shopify payment path** (post embedded-Stripe pivot; nothing produces `shopify:*` transaction_ids in `/api/book`). The Shopify Admin bridge that now exists is **OTC-fulfillment only** (Kyn Select), not a consultation payment reference. (`lib/shopify-care.ts` was removed.)

Known limits:
1. Admin gate is `ADMIN_EMAILS` env-list-only (no TOTP / hardware key).
2. `BOOKING_TEST_TOKEN` is a single static secret. Rotate via the env var if it leaks; the whole check goes away post-launch.
3. Subscription conversions don't fire client-side (`PaymentForm` passes `amount=0` for plans, which the conversion helper skips). AffiliateBase's Stripe Connect integration is wired (confirmed 2026-05-24), so attribution happens via the `affiliatebase_referral` metadata stamped on the Subscription. If that integration is disconnected, subscription commissions stop attributing — wire a server-side `POST /api/v1/referrals` from the Stripe webhook on `invoice.paid` instead.

## Conventions

- **Don't commit without explicit request.**
- `master` auto-deploys the live theme; the streamlined flow is developed on `test` (preview theme `#183643242769`).
- Supabase migrations are live and forward-only, dated prefix `YYYYMMDDHHMMSS_name.sql`. Never amend past migrations.
- Storefront uses hand-written CSS with `:root` variables; telehealth uses Tailwind. Don't mix telehealth deps with the root.
- US-only market: filter outreach, ads, and creator research to US-based only.
- `telehealth/public/photos/` duplicates root `assets/` team photos on purpose (separate apps, each owns its assets; Windows symlinks are unreliable).
