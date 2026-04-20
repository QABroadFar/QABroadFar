-- Fix categories table schema untuk support income categories
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_category_group_check;
ALTER TABLE categories ALTER COLUMN household_id DROP NOT NULL;
ALTER TABLE categories ALTER COLUMN category_group DROP NOT NULL;

-- Add new constraint yang mengizinkan NULL untuk income
ALTER TABLE categories ADD CONSTRAINT valid_category_group 
  CHECK (category_group IN ('kebutuhan', 'keinginan', 'tabungan') OR category_group IS NULL);
