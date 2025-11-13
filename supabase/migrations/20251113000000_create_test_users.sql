-- ============================================================================
-- Migration: Create Test Users for Development
-- ============================================================================
-- Description: Creates test users in auth.users for development and testing
-- ⚠️ WARNING: This migration is for LOCAL DEVELOPMENT ONLY
-- ⚠️ Do NOT run this in production
-- ============================================================================

-- Insert test users into auth.users
-- These users can be used for testing without going through the full auth flow
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
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'test1@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'test2@example.com',
    crypt('password123', gen_salt('bf')),
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
-- Summary:
--   ✓ Created 2 test users for development
--   ⚠️ These credentials should NEVER be used in production
-- ============================================================================

