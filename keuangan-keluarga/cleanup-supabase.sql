-- ============================================
-- CLEANUP: Remove existing policies and tables before re-applying schema
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can CRUD own households" ON households;
DROP POLICY IF EXISTS "Users can view own memberships" ON household_members;
DROP POLICY IF EXISTS "Users can insert themselves" ON household_members;
DROP POLICY IF EXISTS "Owners can manage members" ON household_members;
DROP POLICY IF EXISTS "Household members can CRUD categories" ON categories;
DROP POLICY IF EXISTS "Household members can CRUD accounts" ON accounts;
DROP POLICY IF EXISTS "Household members can CRUD transactions" ON transactions;
DROP POLICY IF EXISTS "Household members can CRUD budgets" ON budgets;
DROP POLICY IF EXISTS "Household members can CRUD assets" ON assets;
DROP POLICY IF EXISTS "Household members can CRUD savings" ON savings;
DROP POLICY IF EXISTS "Household members can CRUD debts" ON debts;
DROP POLICY IF EXISTS "Household members can CRUD receivables" ON receivables;
DROP POLICY IF EXISTS "Household members can CRUD recurring_payments" ON recurring_payments;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop all tables (this will cascade delete all data)
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

-- Drop functions and triggers
DROP TRIGGER IF EXISTS update_households_updated_at ON households;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
DROP TRIGGER IF EXISTS update_savings_updated_at ON savings;
DROP TRIGGER IF EXISTS update_debts_updated_at ON debts;
DROP TRIGGER IF EXISTS update_receivables_updated_at ON receivables;
DROP TRIGGER IF EXISTS update_recurring_payments_updated_at ON recurring_payments;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_household_members_updated_at ON household_members;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();
