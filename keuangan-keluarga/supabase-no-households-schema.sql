-- ============================================
-- Keuangan Keluarga - Schema Without Households
-- Uses TEXT IDs to match app's ID format (acc-xxx, cat-xxx, etc)
-- ============================================

-- ============================================
-- CATEGORIES
-- ============================================
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6b7280',
  parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ACCOUNTS
-- ============================================
DROP TABLE IF EXISTS accounts CASCADE;

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'digital_wallet', 'investment', 'other')),
  balance NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TRANSACTIONS
-- ============================================
DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  note TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- BUDGETS
-- ============================================
DROP TABLE IF EXISTS budgets CASCADE;

CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  spent NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, year, month)
);

-- ============================================
-- ASSETS
-- ============================================
DROP TABLE IF EXISTS assets CASCADE;

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('property', 'vehicle', 'jewelry', 'other')),
  value NUMERIC(15, 2) NOT NULL CHECK (value >= 0),
  purchase_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SAVINGS
-- ============================================
DROP TABLE IF EXISTS savings CASCADE;

CREATE TABLE savings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount >= 0),
  current_amount NUMERIC(15, 2) DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DEBTS
-- ============================================
DROP TABLE IF EXISTS debts CASCADE;

CREATE TABLE debts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  paid_amount NUMERIC(15, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  interest_rate NUMERIC(5, 2),
  due_date DATE,
  description TEXT,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RECEIVABLES
-- ============================================
DROP TABLE IF EXISTS receivables CASCADE;

CREATE TABLE receivables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  paid_amount NUMERIC(15, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  due_date DATE,
  description TEXT,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RECURRING_PAYMENTS
-- ============================================
DROP TABLE IF EXISTS recurring_payments CASCADE;

CREATE TABLE recurring_payments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  last_processed DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES (Simple - Allow All)
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;

-- Simple RLS - Allow all operations
CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_assets" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_savings" ON savings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_debts" ON debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_receivables" ON receivables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_recurring_payments" ON recurring_payments FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_updated_at BEFORE UPDATE ON savings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_payments_updated_at BEFORE UPDATE ON recurring_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE
-- ============================================
SELECT 'Schema created successfully!' as status;
