-- Add categoryGroup column to categories table
-- This is needed for the Categorized Dropdown feature (Kebutuhan, Keinginan, Tabungan)

ALTER TABLE categories ADD COLUMN IF NOT EXISTS category_group TEXT 
  CHECK (category_group IN ('kebutuhan', 'keinginan', 'tabungan'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_category_group ON categories(category_group);
