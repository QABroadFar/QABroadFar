-- Add any missing columns for budgets
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS month INTEGER;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2);
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS spent NUMERIC(15, 2) DEFAULT 0;

SELECT 'Budget columns ready!' as status;
