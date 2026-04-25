-- Enable the pg_net extension required by the faqs_notify_github trigger.
-- Without it the trigger raises "schema 'net' does not exist" on any change to
-- public.faqs and rolls the write back. Lives in the extensions schema by
-- Supabase convention.

create extension if not exists pg_net with schema extensions;
