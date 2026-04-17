-- ============================================
-- Keuangan Keluarga - Supabase Database Schema
-- Household Sharing Version
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HOUSEHOLDS
-- ============================================
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_households_created_by ON households(created_by);
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own households" ON households FOR ALL USING (auth.uid() = created_by);

-- ============================================
-- HOUSEHOLD_MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own memberships" ON household_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Household owners can manage members" ON household_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'owner'
  )
);

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- ACCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet', 'credit', 'investment', 'other')),
  initial_balance NUMERIC(15, 2) DEFAULT 0,
  current_balance NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, name)
);

CREATE INDEX IF NOT EXISTS idx_accounts_household ON accounts(household_id);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD accounts" ON accounts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = accounts.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  color TEXT,
  subcategories JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_household ON categories(household_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD categories" ON categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = categories.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_household ON transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD transactions" ON transactions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = transactions.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ============================================
-- BUDGETS
-- ============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount NUMERIC(15, 2) NOT NULL,
  rollover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, category_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_household ON budgets(household_id);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD budgets" ON budgets FOR ALL USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = budgets.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ============================================
-- ASSETS
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  purchase_value NUMERIC(15, 2) NOT NULL,
  current_value NUMERIC(15, 2),
  purchase_date DATE,
  notes TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_household ON assets(household_id);
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD assets" ON assets FOR ALL USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = assets.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ============================================
-- SAVINGS
-- ============================================
CREATE TABLE IF NOT EXISTS savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL,
  current_amount NUMERIC(15, 2) DEFAULT 0,
  target_date DATE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_savings_household ON savings(household_id);
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD savings" ON savings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = savings.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ============================================
-- DEBTS
-- ============================================
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  total_amount NUMERIC(15, 2) NOT NULL,
  remaining_amount NUMERIC(15, 2) NOT NULL,
  interest_rate NUMERIC(5, 2),
  minimum_payment NUMERIC(15, 2),
  due_date INTEGER,
  is_paid BOOLEAN DEFAULT false,
  paid_amount NUMERIC(15, 2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debts_household ON debts(household_id);
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD debts" ON debts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = debts.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ============================================
-- RECEIVABLES
-- ============================================
CREATE TABLE IF NOT EXISTS receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  description TEXT,
  is_received BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receivables_household ON receivables(household_id);
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD receivables" ON receivables FOR ALL USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = receivables.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ============================================
-- RECURRING_PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(15, 2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_due_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_household ON recurring_payments(household_id);
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD recurring" ON recurring_payments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM household_members hm
    WHERE hm.household_id = recurring_payments.household_id
      AND hm.user_id = auth.uid()
  )
);

-- ============================================
-- FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS (drop existing first to avoid errors)
-- ============================================
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_households_updated_at ON households;
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
  DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
  DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
  DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
  DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
  DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
  DROP TRIGGER IF EXISTS update_savings_updated_at ON savings;
  DROP TRIGGER IF EXISTS update_debts_updated_at ON debts;
  DROP TRIGGER IF EXISTS update_receivables_updated_at ON receivables;
  DROP TRIGGER IF EXISTS update_recurring_updated_at ON recurring_payments;
  DROP TRIGGER IF EXISTS trigger_update_account_balance ON transactions;
END $$;

CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_updated_at BEFORE UPDATE ON savings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receivables_updated_at BEFORE UPDATE ON receivables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_updated_at BEFORE UPDATE ON recurring_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update account balance on transaction changes
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  change_amount NUMERIC(15, 2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    change_amount = CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END;
    UPDATE accounts SET current_balance = current_balance + change_amount WHERE id = NEW.account_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    change_amount = CASE WHEN OLD.type = 'income' THEN -OLD.amount ELSE OLD.amount END;
    UPDATE accounts SET current_balance = current_balance + change_amount WHERE id = OLD.account_id;
    change_amount = CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END;
    UPDATE accounts SET current_balance = current_balance + change_amount WHERE id = NEW.account_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    change_amount = CASE WHEN OLD.type = 'income' THEN -OLD.amount ELSE OLD.amount END;
    UPDATE accounts SET current_balance = current_balance + change_amount WHERE id = OLD.account_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION get_user_household()
RETURNS UUID AS $$
DECLARE
  household_id UUID;
BEGIN
  SELECT hm.household_id INTO household_id
  FROM household_members hm
  WHERE hm.user_id = auth.uid()
  LIMIT 1;
  RETURN household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_household(p_household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE households IS 'Family/household groups for sharing financial data';
COMMENT ON TABLE household_members IS 'Membership linking users to households with roles';
COMMENT ON TABLE profiles IS 'User profiles with optional household association';
COMMENT ON TABLE accounts IS 'Shared financial accounts within a household';
COMMENT ON TABLE categories IS 'Shared expense/income categories within household (subcategories as JSONB)';
COMMENT ON TABLE transactions IS 'Financial transactions shared within household';
COMMENT ON TABLE budgets IS 'Monthly budgets per household category';
COMMENT ON TABLE assets IS 'Household assets and property';
COMMENT ON TABLE savings IS 'Shared savings goals';
COMMENT ON TABLE debts IS 'Shared liabilities and debts';
COMMENT ON TABLE receivables IS 'Money owed to the household';
COMMENT ON TABLE recurring_payments IS 'Scheduled recurring income/expenses for household';
