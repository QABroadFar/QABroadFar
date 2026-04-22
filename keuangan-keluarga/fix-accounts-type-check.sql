-- Fix accounts_type_check constraint to include all valid account types
-- Drop existing constraint
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;

-- Add new constraint with all valid types from the form
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check 
CHECK (type IN ('cash', 'bank', 'credit_card', 'digital_wallet', 'investment', 'savings'));