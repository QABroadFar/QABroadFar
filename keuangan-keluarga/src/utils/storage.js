/**
 * Storage Utility with Supabase Sync
 * Offline-first: localStorage for instant reads, Supabase for sync
 */

const STORAGE_KEYS = {
  transactions: 'kk_transactions',
  categories: 'kk_categories',
  budgets: 'kk_budgets',
  assets: 'kk_assets',
  savings: 'kk_savings',
  debts: 'kk_debts',
  receivables: 'kk_receivables',
  recurringPayments: 'kk_recurring_payments',
  accounts: 'kk_accounts',
  settings: 'kk_settings',
  // Metadata keys
  _meta: 'kk_meta', // stores household_id, last_sync, etc.
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

  remove(key, itemId) {
    try {
      const current = this.get(key, []);
      const filtered = current.filter(item => item.id !== itemId);
      localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to remove from storage:', e);
    }
  },

  clear() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  // Household metadata
  getMeta() {
    return this.get('_meta', { householdId: null, lastSync: null });
  },

  setMeta(meta) {
    this.set('_meta', { ...this.getMeta(), ...meta });
  },

  queueOperation(key, operation, data) {
    try {
      const queue = this.get('_sync_queue', []);
      queue.push({ key, operation, data, timestamp: Date.now() });
      this.set('_sync_queue', queue);
    } catch (e) {
      console.error('Failed to queue operation:', e);
    }
  },

  async syncFromRemote() {
    // Implemented by supabaseSync directly
    console.log('Manual sync triggered');
  },

  getSyncStatus() {
    const meta = this.getMeta();
    const queue = this.get('_sync_queue', []);
    return {
      householdId: meta.householdId,
      lastSync: meta.lastSync,
      queueLength: queue.length,
      isOnline: navigator.onLine
    };
  }
};

export { STORAGE_KEYS };
