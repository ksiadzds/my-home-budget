-- ============================================================================
-- Migration: Create E2E Test User
-- ============================================================================
-- Description: Creates specific test user for E2E tests
-- ⚠️ WARNING: This migration is for LOCAL DEVELOPMENT ONLY
-- ============================================================================

-- Insert E2E test user into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES
  (
    '00000000-0000-0000-0000-000000000099',
    '00000000-0000-0000-0000-000000000000',
    'test@example.com',
    extensions.crypt('Test1234!', extensions.gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================


