-- ============================================================================
-- Migration: Make kategoria_id nullable in produkty table
-- ============================================================================
-- Description: Allows products to be created without a category assignment.
--              This is needed for OCR flow where products are initially
--              created without categories and user assigns them later.
--
-- Changes:
--   - ALTER produkty.kategoria_id from NOT NULL to NULL
--
-- Impact:
--   - Products can now have NULL kategoria_id
--   - Foreign key constraint remains (if kategoria_id is set, it must be valid)
--   - ON DELETE RESTRICT still applies to non-null kategoria_id values
-- ============================================================================

-- Make kategoria_id nullable in produkty table
ALTER TABLE public.produkty 
ALTER COLUMN kategoria_id DROP NOT NULL;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
--   ✓ kategoria_id is now nullable in produkty table
--   ✓ Products can be created without category assignment
--   ✓ Foreign key constraint still enforced for non-null values
-- ============================================================================

