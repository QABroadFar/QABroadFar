-- Add deadline column to savings table
ALTER TABLE savings ADD COLUMN IF NOT EXISTS deadline DATE;
SELECT 'Savings table fixed!' as status;
