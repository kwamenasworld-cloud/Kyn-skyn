-- Rename Ola-era columns to MDI after swapping telehealth vendors pre-launch.
-- Column values remain — just the name changes. Types and meanings are
-- identical (external vendor-side patient UUID).

alter table if exists public.patients
  rename column ola_user_guid to mdi_patient_id;

alter table if exists public.user_order_refs
  rename column ola_user_guid to mdi_patient_id;

comment on column public.patients.mdi_patient_id is
  'MD Integrations partner-side patient UUID. Set after first case creation.';

comment on column public.user_order_refs.mdi_patient_id is
  'MD Integrations partner-side patient UUID that owns this case.';
