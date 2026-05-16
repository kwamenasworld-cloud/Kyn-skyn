-- Enforce 1:1 mapping between Kyn patients and MDI patient records.
-- Without this constraint, two Kyn users could theoretically be linked to
-- the same `mdi_patient_id` (the application layer prevents it, but the DB
-- did not). Pre-launch there is no data to conflict with, so this is safe
-- to add as a hard constraint.
--
-- A partial unique index lets `mdi_patient_id` remain nullable for users
-- who haven't been provisioned in MDI yet (signup before first case), while
-- still guaranteeing every populated value is unique.

create unique index if not exists patients_mdi_patient_id_unique
  on public.patients (mdi_patient_id)
  where mdi_patient_id is not null;

comment on index public.patients_mdi_patient_id_unique is
  'Enforces 1:1 Kyn user ↔ MDI patient. Allows NULL for not-yet-provisioned users.';
