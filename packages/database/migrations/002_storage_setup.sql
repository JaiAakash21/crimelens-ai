-- ============================================================================
-- CrimeLens AI — Supabase Storage Setup
-- Migration: 002_storage_setup
-- Description: Creates storage bucket and policies for incident images
-- Dependencies: 001_initial_schema (incidents, incident_images tables)
-- ============================================================================
-- Apply via: Supabase SQL Editor (must be run as a Supabase-managed migration)
-- ============================================================================

-- ============================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================

-- Check if bucket exists before inserting (idempotent setup)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, owner)
SELECT
    'incident-images',
    'incident-images',
    true,                              -- Public read access (images embedded in app)
    5242880,                           -- 5 MB per file (5 * 1024 * 1024)
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[],
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'incident-images'
);

COMMENT ON COLUMN storage.buckets.file_size_limit IS '5 MB limit per image.';
COMMENT ON COLUMN storage.buckets.allowed_mime_types IS 'Only JPEG, PNG, and WebP images allowed.';

-- ============================================================
-- 2. STORAGE RLS POLICIES
-- ============================================================

-- Enable RLS on storage.objects (may already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------
-- 2.1 Public read access
-- Anyone can view/download images in the incident-images bucket
-- -----------------------------------------------------------
CREATE POLICY "incident_images_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'incident-images');

-- -----------------------------------------------------------
-- 2.2 Authenticated users can upload
-- Users must be logged in to upload images
-- -----------------------------------------------------------
CREATE POLICY "incident_images_insert_auth"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'incident-images'
    AND auth.role() = 'authenticated'
    -- Ensure file path follows expected pattern: incidents/<uuid>/<filename>
    -- The path starts with "incidents/" (no leading slash in storage.objects)
    AND (storage.foldername(name))[1] = 'incidents'
);

-- -----------------------------------------------------------
-- 2.3 Users can update their own uploads
-- -----------------------------------------------------------
CREATE POLICY "incident_images_update_own"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'incident-images'
    AND auth.uid() = owner
)
WITH CHECK (
    bucket_id = 'incident-images'
    AND auth.uid() = owner
);

-- -----------------------------------------------------------
-- 2.4 Users can delete their own uploads
-- Admins can delete any upload
-- -----------------------------------------------------------
CREATE POLICY "incident_images_delete_own"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'incident-images'
    AND (
        auth.uid() = owner
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin')
        )
    )
);

-- ============================================================
-- 3. STORAGE FOLDER STRUCTURE CONVENTION
-- ============================================================
-- Objects should be stored under:
--   incidents/<incident_uuid>/<image_uuid>.<ext>
--
-- Example:
--   incidents/a1b2c3d4-e5f6-7890-abcd-ef1234567890/550e8400-e29b-41d4-a716-446655440000.jpg
--
-- The backend service should:
--   1. Generate a unique filename (UUID + original extension)
--   2. Upload to: incidents/<incident_id>/<uuid>.<ext>
--   3. Insert a record into incident_images with the storage_path
-- ============================================================

-- ============================================================
-- 4. VERIFY SETUP
-- ============================================================
-- Run after applying:
--   SELECT * FROM storage.buckets WHERE id = 'incident-images';
--   SELECT * FROM storage.policies WHERE bucket_id = 'incident-images';
-- ============================================================

-- ============================================================
-- END OF MIGRATION
-- ============================================================
