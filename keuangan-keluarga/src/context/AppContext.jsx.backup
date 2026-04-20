import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { supabaseSync } from '../lib/supabaseSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { defaultAccounts, defaultCategories, defaultRecurringPayments } from '../utils/defaults';
import { migrateIcon } from '../utils/iconMigration';
import { getMonthRange } from '../utils/helpers';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// Map queue key to state key
const KEY_MAP = {
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

export const AppProvider = ({ children }) => {
  // State
  const [accounts, setAccounts] = useState(() => storage.get('accounts', defaultAccounts));
  const [categories, setCategories] = useState(() => {
    const stored = storage.get('categories', defaultCategories);
    let needsMigration = false;
    const migrated = stored.map(cat => {
      const newIcon = migrateIcon(cat.icon);
      if (newIcon !== cat.icon) needsMigration = true;
      return { ...cat, icon: newIcon };
    });
    if (needsMigration) storage.set('categories', migrated);
    return migrated;
  });
  const [transactions, setTransactions] = useState(() => storage.get('transactions', []));
  const [budgets, setBudgets] = useState(() => storage.get('budgets', []));
  const [assets, setAssets] = useState(() => storage.get('assets', []));
  const [savings, setSavings] = useState(() => storage.get('savings', []));
  const [debts, setDebts] = useState(() => storage.get('debts', []));
  const [receivables, setReceivables] = useState(() => storage.get('receivables', []));
  const [recurringPayments, setRecurringPayments] = useState(() => storage.get('recurringPayments', defaultRecurringPayments));
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSync: null });

  // Supabase sync init
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabaseSync.init().then(() => {
        setSyncStatus({ syncing: false, lastSync: new Date() });
      });
    }
  }, []);

  // Listen for remote data changes (Supabase broadcast / custom event)
  useEffect(() => {
    function handleRemoteChange(e) {
      const { table } = e.detail;
      console.log(`🔄 Remote change on ${table}, refreshing state...`);

      const storageKey = KEY_MAP[table] || table;
      if (table === 'recurring_payments') setRecurringPayments(storage.get('recurringPayments', defaultRecurringPayments));
      if (table === 'transactions') setTransactions(storage.get('transactions', []));
      if (table === 'accounts') setAccounts(storage.get('accounts', defaultAccounts));
      if (table === 'categories') {
        const stored = storage.get('categories', defaultCategories);
        let needsMigration = false;
        const migrated = stored.map(cat => {
          const newIcon = migrateIcon(cat.icon);
          if (newIcon !== cat.icon) needsMigration = true;
          return { ...cat, icon: newIcon };
        });
        if (needsMigration) storage.set('categories', migrated);
        setCategories(migrated);
      }
      if (table === 'budgets') setBudgets(storage.get('budgets', []));
      if (table === 'assets') setAssets(storage.get('assets', []));
      if (table === 'savings') setSavings(storage.get('savings', []));
      if (table === 'debts') setDebts(storage.get('debts', []));
      if (table === 'receivables') setReceivables(storage.get('receivables', []));
    }

    window.addEventListener('supabase-data-changed', handleRemoteChange);
    return () => window.removeEventListener('supabase-data-changed', handleRemoteChange);
  }, []);

  // Persist to localStorage
  useEffect(() => { storage.set('accounts', accounts); }, [accounts]);
  useEffect(() => { storage.set('categories', categories); }, [categories]);
  useEffect(() => { storage.set('transactions', transactions); }, [transactions]);
  useEffect(() => { storage.set('budgets', budgets); }, [budgets]);
  useEffect(() => { storage.set('assets', assets); }, [assets]);
  useEffect(() => { storage.set('savings', savings); }, [savings]);
  useEffect(() => { storage.set('debts', debts); }, [debts]);
  useEffect(() => { storage.set('receivables', receivables); }, [receivables]);
  useEffect(() => { storage.set('recurringPayments', recurringPayments); }, [recurringPayments]);

  // CRUD helpers with Supabase sync
  const createRecord = useCallback((table, data) => {
    const stateKey = KEY_MAP[table] || table;
    const idPrefix = table === 'recurring_payments' ? 'rec' : table.slice(0, 3);
    const newItem = { ...data, id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };

    console.log(`➕ Creating ${table} record:`, newItem.id);

    setStateForKey(stateKey, prev => [newItem, ...prev]);

    if (isSupabaseConfigured()) {
      supabaseSync.queueOperation(table, 'insert', newItem);
    }

    return newItem;
  }, []);

  const updateRecord = useCallback((table, id, data) => {
    const stateKey = KEY_MAP[table] || table;
    console.log(`✏️ Updating ${table} record:`, id);
    setStateForKey(stateKey, prev => prev.map(item => item.id === id ? { ...item, ...data } : item));

    if (isSupabaseConfigured()) {
      supabaseSync.queueOperation(table, 'update', { id, ...data });
    }
  }, []);

  const deleteRecord = useCallback((table, id) => {
    const stateKey = KEY_MAP[table] || table;
    console.log(`🗑️ Deleting ${table} record:`, id);
    setStateForKey(stateKey, prev => prev.filter(item => item.id !== id));

    if (isSupabaseConfigured()) {
      supabaseSync.queueOperation(table, 'delete', { id });
    }
  }, []);

  const setStateForKey = (key, updater) => {
    switch (key) {
      case 'accounts': setAccounts(updater); break;
      case 'categories': setCategories(updater); break;
      case 'transactions': setTransactions(updater); break;
      case 'budgets': setBudgets(updater); break;
      case 'assets': setAssets(updater); break;
      case 'savings': setSavings(updater); break;
      case 'debts': setDebts(updater); break;
      case 'receivables': setReceivables(updater); break;
      case 'recurringPayments': setRecurringPayments(updater); break;
      default: console.warn('Unknown state key:', key);
    }
  };

  const resetAllData = useCallback(() => {
    setTransactions([]);
    setBudgets([]);
    setRecurringPayments(defaultRecurringPayments);
    setDebts([]);
    setReceivables([]);
    setAssets([]);
    setSavings([]);
    setAccounts(prev => prev.map(a => ({ ...a, balance: 0 })));
    if (isSupabaseConfigured()) {
      supabaseSync.clearQueue();
    }
  }, []);
  // Transaction CRUD
  const addTransaction = useCallback((data) => {
    const newTx = createRecord('transactions', data);
    if (data.accountId && data.type !== 'transfer') {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === data.accountId) {
          const change = data.type === 'income' ? data.amount : -data.amount;
          return { ...acc, balance: (acc.balance || 0) + change };
        }
        return acc;
      }));
    }
    return newTx;
  }, [createRecord]);

  const updateTransaction = useCallback((id, data) => {
    setTransactions(prev => {
      const oldTx = prev.find(t => t.id === id);
      if (!oldTx) return prev;

      if (oldTx.type === 'transfer') return prev;

      // Rollback saldo akun lama
      if (oldTx.accountId) {
        setAccounts(accs => accs.map(acc => {
          if (acc.id === oldTx.accountId) {
            const rollback = oldTx.type === "income" ? -oldTx.amount : oldTx.amount;
            return { ...acc, balance: (acc.balance || 0) + rollback };
          }
          return acc;
        }));
      }

      const updatedTx = { ...oldTx, ...data };

      // Apply new saldo akun
      if (updatedTx.accountId && updatedTx.type !== 'transfer') {
        setAccounts(accs => accs.map(acc => {
          if (acc.id === updatedTx.accountId) {
            const change = updatedTx.type === "income" ? updatedTx.amount : -updatedTx.amount;
            return { ...acc, balance: (acc.balance || 0) + change };
          }
          return acc;
        }));
      }

      if (isSupabaseConfigured()) {
        supabaseSync.queueOperation("transactions", "update", updatedTx);
      }

      return prev.map(item => item.id === id ? updatedTx : item);
    });
  }, []);

  const deleteTransaction = useCallback((id) => {
    deleteRecord('transactions', id);
    setTransactions(prev => {
      const tx = prev.find(t => t.id === id);
      if (tx) {
        if (tx.type === 'transfer') {
          // Rollback transfer
          setAccounts(accs => accs.map(acc => {
            if (acc.id === tx.fromAccountId) {
              return { ...acc, balance: (acc.balance || 0) + tx.amount };
            }
            if (acc.id === tx.toAccountId) {
              return { ...acc, balance: (acc.balance || 0) - tx.amount };
            }
            return acc;
          }));
        } else if (tx.accountId) {
          setAccounts(accs => accs.map(acc => {
            if (acc.id === tx.accountId) {
              const change = tx.type === 'income' ? -tx.amount : tx.amount;
              return { ...acc, balance: (acc.balance || 0) + change };
            }
            return acc;
          }));
        }
      }
      return prev.filter(t => t.id !== id);
    });
  }, [deleteRecord]);

  // Transfer antar akun
  const transferBetweenAccounts = useCallback(({ fromAccountId, toAccountId, amount, note, date }) => {
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      throw new Error('Data transfer tidak valid');
    }

    if (fromAccountId === toAccountId) {
      throw new Error('Tidak bisa transfer ke akun yang sama');
    }

    const fromAccount = accounts.find(acc => acc.id === fromAccountId);
    if (!fromAccount || (fromAccount.balance || 0) < amount) {
      throw new Error('Saldo akun asal tidak cukup');
    }

    // Buat transaksi transfer
    const transferTx = createRecord('transactions', {
      type: 'transfer',
      amount: amount,
      fromAccountId,
      toAccountId,
      note: note || '',
      date: date || new Date().toISOString().split('T')[0]
    });

    // Update saldo kedua akun
    setAccounts(prev => prev.map(acc => {
      if (acc.id === fromAccountId) {
        return { ...acc, balance: (acc.balance || 0) - amount };
      }
      if (acc.id === toAccountId) {
        return { ...acc, balance: (acc.balance || 0) + amount };
      }
      return acc;
    }));

    return transferTx;
  }, [accounts, createRecord]);

  // Category CRUD
  const addCategory = useCallback((data) => {
    return createRecord('categories', { ...data, subcategories: data.subcategories || [] });
  }, [createRecord]);

  const updateCategory = useCallback((id, data) => {
    updateRecord('categories', id, data);
  }, [updateRecord]);

  const deleteCategory = useCallback((id) => {
    deleteRecord('categories', id);
  }, [deleteRecord]);

  // Budget CRUD
  const addBudget = useCallback((data) => {
    const newBudget = { ...data, id: `bud-${Date.now()}` };
    setBudgets(prev => {
      const exists = prev.find(b => b.categoryId === data.categoryId && b.year === data.year && b.month === data.month);
      if (exists) return prev.map(b => b.id === exists.id ? newBudget : b);
      return [...prev, newBudget];
    });
    if (isSupabaseConfigured()) supabaseSync.queueOperation('budgets', 'insert', newBudget);
  }, []);

  const updateBudget = useCallback((id, data) => {
    updateRecord('budgets', id, data);
  }, [updateRecord]);

  const deleteBudget = useCallback((id) => {
    deleteRecord('budgets', id);
  }, [deleteRecord]);

  // Asset CRUD
  const addAsset = useCallback((data) => createRecord('assets', { ...data, type: data.type || 'other' }), [createRecord]);
  const updateAsset = useCallback((id, data) => updateRecord('assets', id, data), [updateRecord]);
  const deleteAsset = useCallback((id) => deleteRecord('assets', id), [deleteRecord]);

  // Savings CRUD
  const addSaving = useCallback((data) => createRecord('savings', { ...data, currentAmount: data.currentAmount || 0, targetAmount: data.targetAmount || 0 }), [createRecord]);
  const updateSaving = useCallback((id, data) => updateRecord('savings', id, data), [updateRecord]);
  const deleteSaving = useCallback((id) => deleteRecord('savings', id), [deleteRecord]);
  const addToSaving = useCallback((id, amount) => {
    setSavings(prev => prev.map(s => s.id === id ? { ...s, currentAmount: (s.currentAmount || 0) + amount } : s));
    if (isSupabaseConfigured()) supabaseSync.queueOperation('savings', 'update', { id, currentAmount: (parseFloat(data.currentAmount || 0) + amount) });
  }, []);

  // Debt CRUD
  const addDebt = useCallback((data) => createRecord('debts', { ...data, isPaid: false }), [createRecord]);
  const updateDebt = useCallback((id, data) => updateRecord('debts', id, data), [updateRecord]);
  const deleteDebt = useCallback((id) => deleteRecord('debts', id), [deleteRecord]);
  const markDebtPaid = useCallback((id) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, isPaid: true } : d));
    if (isSupabaseConfigured()) supabaseSync.queueOperation('debts', 'update', { id, isPaid: true });
  }, []);

  // Receivable CRUD
  const addReceivable = useCallback((data) => createRecord('receivables', { ...data, isPaid: false }), [createRecord]);
  const updateReceivable = useCallback((id, data) => updateRecord('receivables', id, data), [updateRecord]);
  const deleteReceivable = useCallback((id) => deleteRecord('receivables', id), [deleteRecord]);
  const markReceivablePaid = useCallback((id) => {
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, isPaid: true } : r));
    if (isSupabaseConfigured()) supabaseSync.queueOperation('receivables', 'update', { id, isPaid: true });
  }, []);

  // Recurring Payments CRUD
  const addRecurringPayment = useCallback((data) => {
    return createRecord('recurring_payments', {
      ...data,
      type: data.type || 'expense',
      frequency: data.frequency || 'monthly',
      startDate: data.startDate || new Date().toISOString().split('T')[0]
    });
  }, [createRecord]);

  const updateRecurringPayment = useCallback((id, data) => {
    updateRecord('recurring_payments', id, data);
  }, [updateRecord]);

  const deleteRecurringPayment = useCallback((id) => {
    deleteRecord('recurring_payments', id);
  }, [deleteRecord]);

  const resetRecurringPayments = useCallback(() => {
    setRecurringPayments(defaultRecurringPayments);
    if (isSupabaseConfigured()) supabaseSync.queueOperation('recurring_payments', 'reset', defaultRecurringPayments);
  }, []);

  // Computed values
  const getPeriodTransactions = useCallback(() => {
    const { year, month } = selectedPeriod;
    const { start, end } = getMonthRange(year, month);
    return transactions.filter(tx => tx.date >= start && tx.date <= end);
  }, [transactions, selectedPeriod]);

  const periodTransactions = getPeriodTransactions();
  const expenses = periodTransactions.filter(tx => tx.type === 'expense');
  const incomes = periodTransactions.filter(tx => tx.type === 'income');
  const totalIncome = incomes.reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = expenses.reduce((s, tx) => s + tx.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  const value = {
    accounts, categories, transactions, budgets, assets, savings, debts, receivables, recurringPayments,
    selectedPeriod, setSelectedPeriod, isInitialized, setIsInitialized, syncStatus,
    periodTransactions, expenses, incomes, totalIncome, totalExpense, netCashFlow,
    addTransaction, updateTransaction, deleteTransaction, transferBetweenAccounts,
    addCategory, updateCategory, deleteCategory,
    addBudget, updateBudget, deleteBudget,
    addAsset, updateAsset, deleteAsset,
    addSaving, updateSaving, deleteSaving, addToSaving,
    addDebt, updateDebt, deleteDebt, markDebtPaid,
    addReceivable, updateReceivable, deleteReceivable, markReceivablePaid,
    addRecurringPayment, updateRecurringPayment, deleteRecurringPayment, resetRecurringPayments, resetAllData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
