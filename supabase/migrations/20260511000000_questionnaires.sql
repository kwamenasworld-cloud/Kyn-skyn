-- Questionnaires: visual-designer-driven intake schemas, edited via the
-- /admin/intake page (Formio FormBuilder). One row per saved version; the
-- row with is_active=true is the schema served to /book Step 3.
--
-- Schema JSON is the raw Formio form definition. Branching, validation,
-- and option lists all live inside the JSON — no joined tables. That
-- keeps the admin save path a single UPSERT and the read path a single
-- SELECT.

create table if not exists public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  version integer not null,
  schema_json jsonb not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, version)
);

-- Only one active row per slug.
create unique index if not exists questionnaires_active_per_slug
  on public.questionnaires (slug)
  where is_active;

create index if not exists questionnaires_slug_idx
  on public.questionnaires (slug, version desc);

alter table public.questionnaires enable row level security;

-- Anyone (including anon) can read the active schema, since /book reads it
-- before the patient is fully through signup. Inactive versions are
-- service-role only.
create policy "active questionnaire is public"
  on public.questionnaires
  for select
  using (is_active);

-- Writes go through the API route under service-role, which checks
-- ADMIN_EMAILS, so we don't need an authenticated-user RLS policy here.
