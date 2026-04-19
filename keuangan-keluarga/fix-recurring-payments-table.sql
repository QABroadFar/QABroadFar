-- ============================================
-- Recreate Recurring Payments table with correct columns
-- ============================================
DROP TABLE IF EXISTS recurring_payments CASCADE;

CREATE TABLE recurring_payments (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense',
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  category_id TEXT,
  subcategory_id TEXT,
  account_id TEXT,
  due_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT false,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_recurring_payments" ON recurring_payments FOR ALL USING (true) WITH CHECK (true);

-- Add trigger
CREATE TRIGGER update_recurring_payments_updated_at BEFORE UPDATE ON recurring_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Recurring payments table recreated!' as status;
