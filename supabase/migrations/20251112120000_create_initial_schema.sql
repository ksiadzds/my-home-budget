-- ============================================================================
-- Migration: Initial Database Schema for HomeBudget Application
-- ============================================================================
-- Description: Creates the foundational database schema including:
--   - kategorie: product categories table
--   - produkty: user products table with category relationships
--   - ocr_error_logs: error logging for OCR processing failures
--
-- Tables affected: kategorie, produkty, ocr_error_logs
--
-- Security: Row Level Security (RLS) is DISABLED on all tables.
--           ⚠ Warning: All data is publicly accessible.
--           This configuration is suitable for development only.
--
-- Special notes:
--   - Requires uuid-ossp extension for UUID generation
--   - Foreign keys reference auth.users(id) from Supabase Auth
--   - All timestamps use timezone-aware types (timestamptz)
--   - Unique constraints ensure data integrity per user
--
-- About auth.users table:
--   - The 'users' table is NOT created in this migration
--   - It is automatically managed by Supabase Auth in the 'auth' schema
--   - Structure: auth.users (id, email, encrypted_password, created_at, confirmed_at, ...)
--   - Our tables reference auth.users(id) through foreign keys
--   - User management (registration, login, etc.) is handled by Supabase Auth
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable required PostgreSQL extensions
-- ----------------------------------------------------------------------------

-- Enable uuid-ossp extension for UUID generation via uuid_generate_v4()
-- This is required for default primary key values across all tables
create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABLE: kategorie
-- ============================================================================
-- Purpose: Stores predefined product categories available system-wide
-- Access: Full access (Row Level Security disabled)
-- Notes: 
--   - Categories are seeded during migration
--   - Category names are sorted alphabetically
--   - RLS is disabled - full public access
-- ============================================================================

create table public.kategorie (
  id uuid primary key default uuid_generate_v4(),
  nazwa_kategorii varchar(255) not null unique
);

-- Disable Row Level Security for kategorie table
alter table public.kategorie disable row level security;

-- ----------------------------------------------------------------------------
-- Seed Data: Insert predefined categories (alphabetically sorted)
-- ----------------------------------------------------------------------------

insert into public.kategorie (nazwa_kategorii) values
  ('Alkohol i używki'),
  ('Kosmetyki i przybory toaletowe'),
  ('Napoje'),
  ('Pozostałe'),
  ('Rozrywka'),
  ('Słodycze i przekąski'),
  ('Suplemencja'),
  ('Środki czystości'),
  ('Ubranie i obuwie'),
  ('Zakupy spożywcze');

-- ============================================================================
-- TABLE: produkty
-- ============================================================================
-- Purpose: Stores user-specific products with category associations
-- Access: Full access (Row Level Security disabled)
-- Notes: 
--   - Each product is tied to a specific user via user_id
--   - Product names must be unique per user (not globally)
--   - Category deletion is restricted if products reference it
--   - RLS is disabled - full public access
-- ============================================================================

create table public.produkty (
  id uuid primary key default uuid_generate_v4(),
  nazwa_produktu varchar(255) not null,
  kategoria_id uuid not null references public.kategorie(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Ensure product names are unique per user (not globally)
  constraint produkty_user_nazwa_unique unique (user_id, nazwa_produktu)
);

-- Create indexes for optimized query performance
-- Index on user_id: Optimizes filtering by user (most common query pattern)
create index idx_produkty_user_id on public.produkty(user_id);

-- Index on kategoria_id: Optimizes joins with kategorie table and category filtering
create index idx_produkty_kategoria_id on public.produkty(kategoria_id);

-- Disable Row Level Security for produkty table
alter table public.produkty disable row level security;

-- ============================================================================
-- TABLE: ocr_error_logs
-- ============================================================================
-- Purpose: Logs OCR processing errors and failures for debugging and monitoring
-- Access: Full access (Row Level Security disabled)
-- Notes:
--   - Tracks various error types with constrained values
--   - Captures performance metrics (image size, processing duration)
--   - Useful for troubleshooting and improving OCR accuracy
--   - RLS is disabled - full public access
-- ============================================================================

create table public.ocr_error_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Constrain error_type to predefined values for consistency
  error_type varchar(50) not null check (
    error_type in ('ocr_failed', 'summary_failed', 'parsing_error', 'network_error')
  ),
  error_message text not null,
  -- Optional metrics for performance analysis
  source_image_size integer null,
  processing_duration integer null,
  created_at timestamptz not null default now()
);

-- Create index for optimized query performance
-- Index on user_id: Optimizes filtering error logs by user
create index idx_ocr_error_logs_user_id on public.ocr_error_logs(user_id);

-- Optional: Index on created_at for time-based queries and cleanup operations
create index idx_ocr_error_logs_created_at on public.ocr_error_logs(created_at desc);

-- Disable Row Level Security for ocr_error_logs table
alter table public.ocr_error_logs disable row level security;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
--   ✓ Created kategorie table and seeded 10 predefined categories
--   ✓ Created produkty table with user relationships
--   ✓ Created ocr_error_logs table for error tracking
--   ✓ All foreign key relationships established
--   ✓ Indexes created for optimal query performance
--   ✓ Row Level Security DISABLED on all tables (full public access)
--   ⚠ Warning: All data is publicly accessible - suitable for development only
-- ============================================================================

