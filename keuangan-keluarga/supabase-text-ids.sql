-- Drop existing tables and recreate with TEXT IDs
-- Run this in Supabase SQL Editor

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop tables
DROP TABLE IF EXISTS recurring_payments CASCADE;
DROP TABLE IF EXISTS receivables CASCADE;
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS savings CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS household_members CASCADE;
DROP TABLE IF EXISTS households CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate tables with TEXT IDs
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS household_members (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, user_id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6b7280',
  parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'digital_wallet', 'investment', 'other')),
  balance DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category_id TEXT REFERENCES categories(id),
  account_id TEXT REFERENCES accounts(id),
  to_account_id TEXT REFERENCES accounts(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id),
  amount DECIMAL(15,2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  rollover BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own households" ON households FOR ALL USING (auth.uid() = created_by);

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own memberships" ON household_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert themselves" ON household_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can manage members" ON household_members FOR ALL USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_members.household_id AND h.created_by = auth.uid())
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = categories.household_id AND hm.user_id = auth.uid())
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD accounts" ON accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = accounts.household_id AND hm.user_id = auth.uid())
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD transactions" ON transactions FOR ALL USING (
  EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = transactions.household_id AND hm.user_id = auth.uid())
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Household members can CRUD budgets" ON budgets FOR ALL USING (
  EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = budgets.household_id AND hm.user_id = auth.uid())
);

-- Trigger for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Tables recreated with TEXT IDs!' as status;
