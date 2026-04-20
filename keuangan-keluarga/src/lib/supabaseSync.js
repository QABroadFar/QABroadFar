/**
 * Supabase Sync Service - Fixed for recurring payments
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { defaultAccounts, defaultCategories, defaultRecurringPayments } from '../utils/defaults';

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}


const TABLE_FIELDS = {
  categories: ['id', 'name', 'type', 'icon', 'color', 'parent_id', 'created_at', 'updated_at'],
  accounts: ['id', 'name', 'type', 'balance', 'currency', 'is_active', 'created_at', 'updated_at'],
  transactions: ['id', 'date', 'type', 'category_id', 'account_id', 'amount', 'note', 'metadata', 'from_account_id', 'to_account_id', 'created_at', 'updated_at'],
  budgets: ['id', 'category_id', 'amount', 'period', 'created_at', 'updated_at'],
  assets: ['id', 'name', 'type', 'value', 'notes', 'created_at', 'updated_at'],
  savings: ['id', 'name', 'target_amount', 'current_amount', 'due_date', 'created_at', 'updated_at'],
  debts: ['id', 'name', 'original_amount', 'remaining_amount', 'interest_rate', 'created_at', 'updated_at'],
  receivables: ['id', 'name', 'amount','contact', 'due_date', 'created_at', 'updated_at'],
  recurring_payments: ['id', 'name', 'amount', 'frequency', 'next_due_date', 'is_active', 'category_id', 'account_id', 'created_at', 'updated_at']
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
    'transactions': 'transactions',
    'categories': 'categories',
    'accounts': 'accounts',
    'budgets': 'budgets',
    'assets': 'assets',
    'savings': 'savings',
    'debts': 'debts',
    'receivables': 'receivables',
    'recurring_payments': 'recurringPayments'
  };
  return keyMap[table] || table;
}

class SupabaseSync {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.subscriptions = new Map();
    this.isLocalChange = false;
    this.synced = false;
    
    window.addEventListener('online', () => { 
      this.isOnline = true; 
      this.processQueue(); 
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
      await this.seedDefaultsIfNeeded();
      await this.fetchAllData();
      this.setupRealtimeSubscriptions();
      await this.processQueue();
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
        const storageKey = getStorageKey(table);
        localStorage.setItem(`kk_${table}`, JSON.stringify(cleanData));
        localStorage.setItem(storageKey, JSON.stringify(cleanData));
        
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
      try {
        const channel = supabase
          .channel(`public:${table}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: table },
            (payload) => this.handleRealtimeChange(table, payload))
          .subscribe();

        this.subscriptions.set(table, channel);
      } catch (error) {
        console.error(`❌ Failed to setup realtime for ${table}:`, error);
      }
    });
  }

  async handleRealtimeChange(table, payload) {
    if (this.isLocalChange) return;

    try {
      const storageKey = getStorageKey(table);
      const currentData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const { event, new: newRecord, old: oldRecord } = payload;
      
      switch (event) {
        case 'INSERT':
          localStorage.setItem(storageKey, JSON.stringify([mapToCamelCase(newRecord), ...currentData]));
          break;
        case 'UPDATE':
          const updated = currentData.map(item => item.id === newRecord.id ? mapToCamelCase(newRecord) : item);
          localStorage.setItem(storageKey, JSON.stringify(updated));
          break;
        case 'DELETE':
          const filtered = currentData.filter(item => item.id !== oldRecord.id);
          localStorage.setItem(storageKey, JSON.stringify(filtered));
          break;
      }

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
    const filteredData = filterValidFields(table, data);
    const mappedData = mapToSnakeCase(filteredData);
    console.log(`⬆️ Insert into ${table}:`, mappedData.id, mappedData);
    
    const { data: result, error } = await supabase
      .from(table)
      .insert([mappedData])
      .select();
    
    if (error) {
      console.error(`❌ Insert error for ${table}:`, error.message);
      throw error;
    }
    return result?.[0];
  }

  async updateRecord(table, data) {
    const { id, ...updateData } = data;
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
