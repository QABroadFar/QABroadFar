-- Migration: Remove household_id columns without losing data
-- Run this in Supabase SQL Editor

-- Drop RLS policies related to households
DROP POLICY IF EXISTS "allow_all_households" ON households;
DROP POLICY IF EXISTS "allow_all_household_members" ON household_members;
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;

-- Drop triggers
DROP TRIGGER IF EXISTS update_households_updated_at ON households;
DROP TRIGGER IF EXISTS update_household_members_updated_at ON household_members;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Drop tables with CASCADE (will cascade to dependent objects)
DROP TABLE IF EXISTS household_members CASCADE;
DROP TABLE IF EXISTS households CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Remove household_id from categories
ALTER TABLE categories DROP COLUMN IF EXISTS household_id;
DROP INDEX IF EXISTS idx_categories_household_id;

-- Remove household_id from accounts
ALTER TABLE accounts DROP COLUMN IF EXISTS household_id;
DROP INDEX IF EXISTS idx_accounts_household_id;

-- Remove household_id from transactions
ALTER TABLE transactions DROP COLUMN IF EXISTS household_id;
DROP INDEX IF EXISTS idx_transactions_household_id;

-- Remove household_id from budgets
ALTER TABLE budgets DROP COLUMN IF EXISTS household_id;
DROP INDEX IF EXISTS idx_budgets_household_id;

-- Remove household_id from assets
ALTER TABLE assets DROP COLUMN IF EXISTS household_id;
DROP INDEX IF EXISTS idx_assets_household_id;

-- Remove household_id from savings
ALTER TABLE savings DROP COLUMN IF EXISTS household_id;
DROP INDEX IF EXISTS idx_savings_household_id;

-- Remove household_id from debts
ALTER TABLE debts DROP COLUMN IF EXISTS household_id;
DROP INDEX IF EXISTS idx_debts_household_id;

-- Remove household_id from receivables
ALTER TABLE receivables DROP COLUMN IF EXISTS household_id;
DROP INDEX IF EXISTS idx_receivables_household_id;

-- Remove household_id from recurring_payments
ALTER TABLE recurring_payments DROP COLUMN IF EXISTS household_id;
DROP INDEX IF EXISTS idx_recurring_payments_household_id;

-- Fix budgets unique constraint (remove household_id)
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_household_id_category_id_year_month_key;
ALTER TABLE budgets ADD CONSTRAINT budgets_category_year_month_key UNIQUE (category_id, year, month);

-- Fix recurring_payments constraints
ALTER TABLE recurring_payments DROP CONSTRAINT IF EXISTS recurring_payments_household_id_name_key;

SELECT 'Migration completed successfully!' as status;
