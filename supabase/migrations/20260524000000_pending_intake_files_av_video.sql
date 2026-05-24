-- Allow the pending-intake-files Storage bucket to hold the AV-flow
-- intro video (state-mandated verification recording).
--
-- The bucket was originally image-only since intake photos were the only
-- intake-time files. We now also stage a short (~10s) webcam recording
-- when the patient's state requires AV — the worker uploads it to MDI as
-- type 'av-video' and passes the returned file_id as intro_video_id when
-- creating the patient.
--
-- Allowed list grows to include video/webm (desktop Chrome/Firefox) and
-- video/mp4 (iOS Safari). MediaRecorder picks whichever is supported in
-- VideoRecorderModal.tsx.
--
-- file_size_limit goes from 10MB to 25MB. A 60s 480p webm tops out around
-- 8MB; 25MB leaves headroom for higher-bitrate captures on faster
-- networks without rejecting the upload.

update storage.buckets
set
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/webm',
    'video/mp4'
  ],
  file_size_limit = 26214400  -- 25 MiB
where id = 'pending-intake-files';
