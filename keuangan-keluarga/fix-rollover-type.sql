-- Drop the rollover column and recreate as boolean
ALTER TABLE budgets DROP COLUMN IF EXISTS rollover;
ALTER TABLE budgets ADD COLUMN rollover BOOLEAN DEFAULT false;

SELECT 'Rollover column recreated as BOOLEAN!' as status;
