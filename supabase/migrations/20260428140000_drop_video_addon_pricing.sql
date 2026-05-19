-- Remove the video_addon_* rows from pricing_config. The $59/mo Live Video
-- Visits add-on never matched the new sync/async model: sync isn't
-- pre-purchased at booking, it's requested ad-hoc through MDI's white-label
-- dashboard for a flat $15. The booking-flow checkbox and the rx-pricing
-- exports were removed in the same change. The original 20260416100000
-- migration that inserted these rows stays untouched (forward-only).

delete from public.pricing_config
where key in ('video_addon_monthly', 'video_addon_extra_call');
