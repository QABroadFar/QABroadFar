/**
 * Storage Utility - ONLY for non-sensitive UI preferences and auth
 * ALL application data is now stored exclusively in Supabase
 */

const STORAGE_KEYS = {
  settings: 'kk_settings',
  auth_token: 'kk_auth_token',
  last_viewed: 'kk_last_viewed'
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
    try {
      localStorage.removeItem(STORAGE_KEYS[key]);
    } catch (e) {
      console.error('Failed to remove from storage:', e);
    }
  },

  clearAllAppData() {
    // Clear ALL localStorage data on logout
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    
    // Clear any old legacy keys that might still exist
    const legacyKeys = [
      'transactions', 'categories', 'budgets', 'assets', 'savings',
      'debts', 'receivables', 'recurringPayments', 'accounts',
      'kk_transactions', 'kk_categories', 'kk_budgets', 'kk_assets',
      'kk_savings', 'kk_debts', 'kk_receivables', 'kk_recurring_payments',
      'kk_accounts', 'kk_meta', 'kk_cache_version', 'kk_last_refresh',
      '_sync_queue', 'kk_sync_queue'
    ];
    
    legacyKeys.forEach(key => {
      try { localStorage.removeItem(key); } catch (e) {}
    });
  }
};

export { STORAGE_KEYS };
