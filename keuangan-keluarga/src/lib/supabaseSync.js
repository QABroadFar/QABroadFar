/**
 * Supabase Sync Service - Fixed for recurring payments
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { defaultAccounts, defaultCategories, defaultRecurringPayments } from '../utils/defaults';

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}


const TABLE_FIELDS = {
  categories: ['id', 'name', 'type', 'icon', 'color', 'parent_id', 'category_group', 'created_at', 'updated_at'],
  accounts: ['id', 'name', 'type', 'balance', 'currency', 'is_active', 'created_at', 'updated_at'],
  transactions: ['id', 'date', 'type', 'category_id', 'account_id', 'amount', 'note', 'metadata', 'from_account_id', 'to_account_id', 'created_at', 'updated_at'],
  budgets: ['id', 'category_id', 'amount', 'year', 'month', 'rollover', 'created_at', 'updated_at'],
  assets: ['id', 'name', 'type', 'value', 'notes', 'created_at', 'updated_at'],
  savings: ['id', 'name', 'target_amount', 'current_amount', 'due_date', 'created_at', 'updated_at'],
  debts: ['id', 'name', 'original_amount', 'remaining_amount', 'interest_rate', 'created_at', 'updated_at'],
  receivables: ['id', 'name', 'amount','contact', 'due_date', 'created_at', 'updated_at'],
  recurring_payments: ['id', 'name', 'type', 'amount', 'frequency', 'start_date', 'is_active', 'category_id', 'account_id', 'created_at', 'updated_at']
};

function filterValidFields(table, data) {
  const validFields = TABLE_FIELDS[table] || [];
  const filtered = {};
  for (const key of validFields) {
    if (data[key] !== undefined) filtered[key] = data[key];
  }
  return filtered;
}

function mapToSnakeCase(data) {
  if (!data || typeof data !== 'object') return data;
  const mapped = {};
  for (const key in data) {
    const value = data[key];
    if (value !== undefined && value !== null) {
      mapped[toSnakeCase(key)] = value;
    }
  }
  return mapped;
}

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

function mapToCamelCase(data) {
  if (!data || typeof data !== 'object') return data;
  const mapped = {};
  for (const key in data) {
    mapped[toCamelCase(key)] = data[key];
  }
  return mapped;
}

function getStorageKey(table) {
  const keyMap = {
    transactions: 'transactions',
    categories: 'categories',
    accounts: 'accounts',
    budgets: 'budgets',
    assets: 'assets',
    savings: 'savings',
    debts: 'debts',
    receivables: 'receivables',
    recurring_payments: 'recurringPayments'
  };
  return keyMap[table] || table;
}

function writeCache(table, data) {
  const storageKey = getStorageKey(table);
  const serialized = JSON.stringify(data || []);
  localStorage.setItem(storageKey, serialized);
  localStorage.setItem(`kk_${storageKey}`, serialized);
}

class SupabaseSync {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.subscriptions = new Map();
    this.isLocalChange = false;
    this.synced = false;
    this.cacheVersion = 'v2';
    this.realtimeEnabled = true;
    this.realtimeRetryCount = 0;
    
    window.addEventListener('online', () => { 
      this.isOnline = true; 
      this.processQueue(); 
      this.fetchAllData();
      this.setupRealtimeSubscriptions(); // Retry realtime on reconnect
    });
    window.addEventListener('offline', () => { this.isOnline = false });
  }

  async init() {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, using localStorage only');
      return false;
    }

    try {
      console.log('🔄 Initializing Supabase sync...');
      this.ensureCacheVersion();
      await this.seedDefaultsIfNeeded();
      await this.fetchAllData();
      this.setupRealtimeSubscriptions();
      await this.processQueue();
      this.startPeriodicRefresh();
      this.synced = true;
      console.log('✅ Supabase sync initialized');
      return true;
    } catch (error) {
      console.error('❌ Supabase sync init failed:', error);
      return false;
    }
  }

  async seedDefaultsIfNeeded() {
    const { count } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Accounts in Supabase: ${count || 0}`);
    
    if (count === 0) {
      console.log('📦 Seeding default data to Supabase...');
      
      for (const acc of defaultAccounts) {
        try {
          await supabase.from('accounts').insert(mapToSnakeCase(acc));
          console.log(`✅ Seeded account: ${acc.name}`);
        } catch (e) {
          console.error(`❌ Failed to seed account:`, e.message);
        }
      }
      
      for (const cat of defaultCategories) {
        try {
          await supabase.from('categories').insert(mapToSnakeCase(cat));
          console.log(`✅ Seeded category: ${cat.name}`);
        } catch (e) {
          console.error(`❌ Failed to seed category:`, e.message);
        }
      }
      
      // Also seed recurring payments
      for (const rp of defaultRecurringPayments) {
        try {
          await supabase.from('recurring_payments').insert(mapToSnakeCase(rp));
          console.log(`✅ Seeded recurring payment: ${rp.name}`);
        } catch (e) {
          console.error(`❌ Failed to seed recurring payment:`, e.message);
        }
      }
      
      console.log('📦 Default data seeded!');
    }
  }

  ensureCacheVersion() {
    const current = localStorage.getItem('kk_cache_version');
    if (current !== this.cacheVersion) {
      const keysToClear = [
        'transactions', 'categories', 'accounts', 'budgets', 'assets',
        'savings', 'debts', 'receivables', 'recurringPayments',
        'kk_transactions', 'kk_categories', 'kk_accounts', 'kk_budgets',
        'kk_assets', 'kk_savings', 'kk_debts', 'kk_receivables', 'kk_recurringPayments'
      ];
      keysToClear.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('kk_cache_version', this.cacheVersion);
      localStorage.setItem('kk_last_refresh', String(Date.now()));
    }
  }

  startPeriodicRefresh() {
    if (this.refreshInterval) return;
    this.refreshInterval = setInterval(() => {
      if (this.isOnline && isSupabaseConfigured()) {
        this.fetchAllData();
      }
    }, 60000);
  }

  async fetchAllData() {
    const tables = ['transactions','categories','accounts','budgets','assets','savings','debts','receivables','recurring_payments'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const cleanData = (data || []).map(item => mapToCamelCase(item));
        writeCache(table, cleanData);
        localStorage.setItem('kk_last_refresh', String(Date.now()));
        console.log(`📥 Fetched ${table}: ${cleanData.length} records`);
      } catch (error) {
        console.error(`❌ Failed to fetch ${table}:`, error.message);
      }
    }
  }

  setupRealtimeSubscriptions() {
    this.subscriptions.forEach(ch => {
      try { ch.unsubscribe(); } catch (e) { console.warn("Error unsubscribing:", e); }
    });
    this.subscriptions.clear();

    const tables = ['transactions','categories','accounts','budgets','assets','savings','debts','receivables','recurring_payments'];
    
    tables.forEach(table => {
      this._setupChannel(table, 0);
    });
  }

  _setupChannel(table, retryCount) {
    if (retryCount >= 3) {
      console.warn(`⚠️ Realtime for ${table} failed after 3 retries. Will retry on next online event.`);
      this.realtimeEnabled = false;
      return;
    }

    try {
      const channel = supabase
        .channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: table },
          (payload) => this.handleRealtimeChange(table, payload))
        .subscribe();

      this.subscriptions.set(table, channel);

      channel
        .on('connected', () => {
          console.log(`✅ Realtime connected: ${table}`);
          this.realtimeEnabled = true;
          this.realtimeRetryCount = 0;
        })
        .on('error', (err) => {
          console.error(`❌ Realtime error [${table}]:`, err);
          // Retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
          setTimeout(() => this._setupChannel(table, retryCount + 1), delay);
        })
        .on('disconnected', (reason) => {
          console.warn(`⚠️ Realtime disconnected [${table}]:`, reason);
          setTimeout(() => this._setupChannel(table, retryCount + 1), 3000);
        });

    } catch (error) {
      console.error(`❌ Failed to setup realtime for ${table}:`, error);
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      setTimeout(() => this._setupChannel(table, retryCount + 1), delay);
    }
  }

  async handleRealtimeChange(table, payload) {
    if (this.isLocalChange) return;

    try {
      const storageKey = getStorageKey(table);
      const currentData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const { event, new: newRecord, old: oldRecord } = payload;
      
      switch (event) {
        case 'INSERT': {
          writeCache(table, [mapToCamelCase(newRecord), ...currentData]);
          break;
        }
        case 'UPDATE': {
          const updated = currentData.map(item => item.id === newRecord.id ? mapToCamelCase(newRecord) : item);
          writeCache(table, updated);
          break;
        }
        case 'DELETE': {
          const filtered = currentData.filter(item => item.id !== oldRecord.id);
          writeCache(table, filtered);
          break;
        }
      }
      localStorage.setItem('kk_last_refresh', String(Date.now()));

      window.dispatchEvent(new CustomEvent('supabase-data-changed', { detail: { table, event, record: mapToCamelCase(newRecord || oldRecord) } }));
    } catch (error) {
      console.error('Error handling realtime change:', error);
    }
  }

  queueOperation(table, opType, data) {
    console.log(`📤 Queueing ${opType} on ${table}:`, data.id);
    const queueOp = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      table,
      operation: opType,
      data,
      timestamp: Date.now()
    };
    
    this.syncQueue.push(queueOp);
    
    if (this.isOnline) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log(`🔄 Processing ${this.syncQueue.length} queue operations`);

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    for (const op of operations) {
      try {
        this.isLocalChange = true;
        
        switch (op.operation) {
          case 'insert':
            await this.insertRecord(op.table, op.data);
            break;
          case 'update':
            await this.updateRecord(op.table, op.data);
            break;
          case 'delete':
            await this.deleteRecord(op.table, op.data.id);
            break;
        }
        
        console.log(`✅ ${op.operation} ${op.table} success`);
        this.isLocalChange = false;
      } catch (error) {
        console.error(`❌ Sync ${op.operation} failed for ${op.table}:`, error.message);
        this.syncQueue.unshift(op);
      }
    }
    
    this.isProcessing = false;
  }

  async insertRecord(table, data) {
    const mappedData = mapToSnakeCase(data);
    const filteredData = filterValidFields(table, mappedData);

    // Failsafe for budgets: ensure required fields are always present
    if (table === 'budgets') {
      if (filteredData.year == null) {
        filteredData.year = data.year ?? new Date().getFullYear();
      }
      if (filteredData.month == null) {
        filteredData.month = data.month ?? (new Date().getMonth() + 1);
      }
      if (filteredData.rollover == null) {
        filteredData.rollover = data.rollover ?? false;
      }
    }
    
    // 🔍 DEBUG LOGGING for budget sync issue
    console.log(`📤 SYNC DEBUG ${table.toUpperCase()}:`);
    console.log(`   Original:`, data);
    console.log(`   Mapped:  `, mappedData); 
    console.log(`   Filtered:`, filteredData);
    
    const { data: result, error } = await supabase
      .from(table)
      .insert(filteredData)
      .select();
    
    if (error) {
      console.error(`❌ INSERT ERROR ${table.toUpperCase()}:`, error);
      console.error(`   Tried to insert:`, filteredData);
      throw error;
    }
    
    console.log(`✅ Inserted ${table}:`, result?.[0]?.id);
    return result?.[0];
  }

  async updateRecord(table, data) {
    const mappedData = mapToSnakeCase(data);
    const { id, ...updateData } = mappedData;
    const { data: result, error } = await supabase
      .from(table)
      .update(mapToSnakeCase(updateData))
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return result?.[0];
  }

  async deleteRecord(table, id) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  getSyncStatus() {
    return {
      available: true,
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length
    };
  }
}

export const supabaseSync = new SupabaseSync();
export const initializeSync = () => supabaseSync.init();
