-- Fix categories table untuk schema tanpa household
-- Hapus constraint yang tidak perlu
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_category_group_check;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS valid_category_group;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_household_id_fkey;
ALTER TABLE categories DROP COLUMN IF EXISTS household_id;
ALTER TABLE categories DROP COLUMN IF EXISTS category_group;
