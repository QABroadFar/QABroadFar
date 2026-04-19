-- Add rollover column to budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS rollover NUMERIC(15, 2) DEFAULT 0;

SELECT 'Rollover column added!' as status;
