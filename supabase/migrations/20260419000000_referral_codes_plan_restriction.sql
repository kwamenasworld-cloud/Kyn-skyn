-- Add plan restriction to referral codes.
-- NULL = unrestricted (code applies to any plan). Array of plan names
-- restricts the code to only those plans. Values match form.billingType
-- in the booking app: 'monthly', 'bimonthly', 'quarterly', 'one-time'.

ALTER TABLE referral_codes
  ADD COLUMN allowed_plans TEXT[] DEFAULT NULL;

COMMENT ON COLUMN referral_codes.allowed_plans IS
  'If NULL, code applies to all plans. If array (e.g. ARRAY[''quarterly'']), only validates for those plan types. Values: monthly, bimonthly, quarterly, one-time.';
