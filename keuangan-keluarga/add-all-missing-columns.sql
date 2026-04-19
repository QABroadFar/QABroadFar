-- ============================================
-- Add all missing columns to match app data structure
-- ============================================

-- Categories - add subcategories as JSONB
ALTER TABLE categories ADD COLUMN IF NOT EXISTS subcategories JSONB DEFAULT '[]';

-- Categories - add parent_id if missing (might already exist)
-- (It's already in the schema, just making sure)

-- Accounts - add initial_balance (optional, for reference)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(15, 2) DEFAULT 0;

-- Transactions - ensure subcategory_id exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subcategory_id TEXT;

-- Recurring payments - add missing columns if any
ALTER TABLE recurring_payments ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

SELECT 'All missing columns added!' as status;
