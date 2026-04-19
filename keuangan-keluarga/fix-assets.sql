-- Fix assets table - make 'value' nullable since app uses purchase_value
ALTER TABLE assets ALTER COLUMN value DROP NOT NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchase_value NUMERIC(15, 2);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_value NUMERIC(15, 2);
SELECT 'Assets table fixed!' as status;
