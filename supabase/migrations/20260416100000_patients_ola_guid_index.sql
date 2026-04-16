-- Index to speed up patient lookup by Ola Digital user GUID. This column is
-- queried on every Ola booking callback to map external users back to our
-- Supabase patient rows.
create index if not exists idx_patients_ola_user_guid
  on public.patients (ola_user_guid)
  where ola_user_guid is not null;
