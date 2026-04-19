-- Add missing columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subcategory_id TEXT;

-- Also add to accounts table if missing
-- (these might already exist but just in case)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(15, 2) DEFAULT 0;

SELECT 'Missing columns added!' as status;
