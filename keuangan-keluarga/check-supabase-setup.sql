-- ============================================
-- CHECK: Verify Supabase setup is complete
-- Run this in Supabase SQL Editor after applying the schema
-- ============================================

-- Check if all required tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'households', 
        'household_members', 
        'profiles', 
        'categories', 
        'accounts', 
        'transactions', 
        'budgets', 
        'assets', 
        'savings', 
        'debts', 
        'receivables', 
        'recurring_payments'
    )
ORDER BY tablename;

-- Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'households', 
        'household_members', 
        'profiles', 
        'categories', 
        'accounts', 
        'transactions', 
        'budgets', 
        'assets', 
        'savings', 
        'debts', 
        'receivables', 
        'recurring_payments'
    )
ORDER BY tablename;

-- Test a simple query to household_members (should work now)
SELECT COUNT(*) as household_members_count FROM household_members;

-- Test authentication (run this after logging into the app)
-- Should return 1 row if user exists
SELECT auth.uid() as current_user_id;
