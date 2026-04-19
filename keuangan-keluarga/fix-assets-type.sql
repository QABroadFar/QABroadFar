-- Make type column nullable with default
ALTER TABLE assets ALTER COLUMN type DROP NOT NULL;
ALTER TABLE assets ALTER COLUMN type SET DEFAULT 'other';

SELECT 'Assets type column fixed!' as status;
