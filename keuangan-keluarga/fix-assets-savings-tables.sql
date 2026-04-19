-- ============================================
-- Recreate Assets table with correct columns
-- ============================================
DROP TABLE IF EXISTS assets CASCADE;

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'other',
  value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_value NUMERIC(15, 2) DEFAULT 0,
  purchase_value NUMERIC(15, 2) DEFAULT 0,
  purchase_date DATE,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Recreate Savings table with correct columns
-- ============================================
DROP TABLE IF EXISTS savings CASCADE;

CREATE TABLE savings (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(15, 2) DEFAULT 0,
  currentAmount NUMERIC(15, 2) DEFAULT 0,
  target_date DATE,
  deadline DATE,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_savings" ON savings FOR ALL USING (true) WITH CHECK (true);

-- Add triggers
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_updated_at BEFORE UPDATE ON savings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Assets and Savings tables recreated!' as status;
