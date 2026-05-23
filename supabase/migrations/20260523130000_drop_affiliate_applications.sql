-- Drop the apply-then-approve affiliate flow. The invite-based flow
-- (affiliate_invitations + referral_codes) is now the sole path.
--
-- Cascading the drop is safe here because:
--   - affiliate_applications was the only producer of approved_code_id
--     references; legacy referral_codes rows (code_type='legacy') and
--     invite-created influencer codes don't link back to applications.
--   - No production applications were submitted (pre-launch).

drop table if exists public.affiliate_applications cascade;
