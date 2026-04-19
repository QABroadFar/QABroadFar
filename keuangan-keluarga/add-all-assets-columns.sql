-- Add missing columns to assets
ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchase_value NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_value NUMERIC(15, 2) DEFAULT 0;

SELECT 'Assets columns ready!' as status;
