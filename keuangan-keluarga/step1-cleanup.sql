-- ============================================
-- STEP 1: Cleanup - Run this FIRST
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Simple cleanup - just drop everything
DROP TABLE IF EXISTS recurring_payments CASCADE;
DROP TABLE IF EXISTS receivables CASCADE;  
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS savings CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS household_members CASCADE;
DROP TABLE IF EXISTS households CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

SELECT 'Cleanup completed - proceed to Step 2' as status;
