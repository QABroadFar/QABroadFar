// localStorage-based storage utility with helper functions
const STORAGE_KEYS = {
  transactions: 'kk_transactions',
  categories: 'kk_categories',
  budgets: 'kk_budgets',
  assets: 'kk_assets',
  savings: 'kk_savings',
  debts: 'kk_debts',
  receivables: 'kk_receivables',
  recurringPayments: 'kk_recurring_payments',
  members: 'kk_members',
  accounts: 'kk_accounts',
  settings: 'kk_settings',
};

export const storage = {
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS[key]);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  },
  remove(key) {
    localStorage.removeItem(STORAGE_KEYS[key]);
  },
  clear() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};

export { STORAGE_KEYS };
