-- Add current_value column to assets
ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_value NUMERIC(15, 2) DEFAULT 0;

SELECT 'Assets columns ready!' as status;
