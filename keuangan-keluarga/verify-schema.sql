-- ============================================
-- VERIFY: Check if schema is properly applied
-- Run this in Supabase SQL Editor after applying schema
-- ============================================

-- Check if accounts table has balance column
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'accounts' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if all required tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'households', 'household_members', 'categories', 'accounts', 
        'transactions', 'budgets', 'assets', 'savings', 'debts', 
        'receivables', 'recurring_payments'
    );

-- Test inserting a sample account (should work if schema is correct)
INSERT INTO accounts (household_id, name, type, balance, currency, is_active, created_by) 
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'Test Account', 
    'cash', 
    1000.00, 
    'IDR', 
    true, 
    '00000000-0000-0000-0000-000000000000'::uuid
) 
ON CONFLICT DO NOTHING;

-- Check if insert worked
SELECT * FROM accounts WHERE name = 'Test Account' LIMIT 1;
