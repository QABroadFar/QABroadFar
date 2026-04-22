import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { supabaseSync } from '../lib/supabaseSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { defaultAccounts, defaultCategories, defaultRecurringPayments } from '../utils/defaults';
import { migrateIcon } from '../utils/iconMigration';
import { getMonthRange } from '../utils/helpers';

// Recalculate account balances from all transactions (ground truth)
function recalculateAccountBalances(transactions, accounts) {
  const balanceMap = {};
  accounts.forEach(acc => {
    balanceMap[acc.id] = 0;
  });

  transactions.forEach(tx => {
    if (tx.type === 'income' && tx.accountId) {
      balanceMap[tx.accountId] += tx.amount;
    } else if (tx.type === 'expense' && tx.accountId) {
      balanceMap[tx.accountId] -= tx.amount;
    } else if (tx.type === 'transfer') {
      if (tx.fromAccountId) balanceMap[tx.fromAccountId] -= tx.amount;
      if (tx.toAccountId) balanceMap[tx.toAccountId] += tx.amount;
    }
  });

  return accounts.map(acc => ({
    ...acc,
    balance: (Number(acc.initial_balance) || 0) + (balanceMap[acc.id] ?? 0)
  }));
}

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  // State
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [savings, setSavings] = useState([]);
  const [debts, setDebts] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [recurringPayments, setRecurringPayments] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSync: null });

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

  const setStateForKey = useCallback((key, updater) => {
    // Safety: handle both function updaters and direct values
    const safeUpdater = typeof updater === 'function' ? updater : () => updater;
    
    switch (key) {
      case 'accounts': setAccounts(safeUpdater); break;
      case 'categories': setCategories(safeUpdater); break;
      case 'transactions': setTransactions(safeUpdater); break;
      case 'budgets': setBudgets(safeUpdater); break;
      case 'assets': setAssets(safeUpdater); break;
      case 'savings': setSavings(safeUpdater); break;
      case 'debts': setDebts(safeUpdater); break;
      case 'receivables': setReceivables(safeUpdater); break;
      case 'recurringPayments': setRecurringPayments(safeUpdater); break;
      default: console.warn('Unknown state key:', key);
    }
  }, []);

  // Listen for remote data changes (Supabase broadcast / custom event)
  useEffect(() => {
    function handleRemoteChange(e) {
      const { table, data, event } = e.detail;
      console.log(`🔄 Remote change on ${table}, refreshing state...`);
      setIsInitialSyncComplete(true); // Ensure sync is marked complete on any data change

      const stateKey = KEY_MAP[table] || table;
      
      if (data) {
        console.log(`🔍 Remote data for ${table}:`, { type: typeof data, isArray: Array.isArray(data), length: data?.length });
        
        // Full dataset provided
        if (table === 'categories') {
          if (Array.isArray(data)) {
            const migrated = data.map(cat => {
              const newIcon = migrateIcon(cat.icon);
              const updatedCat = { ...cat, icon: newIcon };
              if (updatedCat.type === 'expense' && !updatedCat.categoryGroup) {
                updatedCat.categoryGroup = 'kebutuhan';
              }
              return updatedCat;
            });
            setCategories(migrated);
          } else {
            console.warn(`⚠️ Invalid categories data (not array):`, data);
            setCategories([]);
          }
        } else {
          setStateForKey(stateKey, () => data);
        }
      }
    }

    window.addEventListener('supabase-data-changed', handleRemoteChange);
    return () => window.removeEventListener('supabase-data-changed', handleRemoteChange);
  }, [setStateForKey]);

  // Supabase sync init
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabaseSync.init().then(() => {
        setSyncStatus({ syncing: false, lastSync: new Date() });
        setIsInitialSyncComplete(true);
      });
    } else {
      // No Supabase, mark as ready immediately
      setIsInitialSyncComplete(true);
    }
  }, []);



  // CRUD helpers with Supabase sync - SUPABASE FIRST
  const createRecord = useCallback(async (table, data) => {
    const idPrefix = table === 'recurring_payments' ? 'rec' : table.slice(0, 3);
    const newItem = { ...data, id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };

    console.log(`➕ Creating ${table} record:`, newItem.id);
    
    // Send to Supabase FIRST
    const inserted = await supabaseSync.insertRecord(table, newItem);
    
    // Only update state after successful server write
    const stateKey = KEY_MAP[table] || table;
    setStateForKey(stateKey, prev => [inserted, ...prev]);

    return inserted;
  }, []);

  const updateRecord = useCallback(async (table, id, data) => {
    console.log(`✏️ Updating ${table} record:`, id);
    
    // Send to Supabase FIRST
    const updated = await supabaseSync.updateRecord(table, { id, ...data });
    
    // Only update state after successful server write
    const stateKey = KEY_MAP[table] || table;
    setStateForKey(stateKey, prev => prev.map(item => item.id === id ? { ...item, ...updated } : item));
  }, []);

  const deleteRecord = useCallback(async (table, id) => {
    console.log(`🗑️ Deleting ${table} record:`, id);
    
    // Send to Supabase FIRST
    await supabaseSync.deleteRecord(table, id);
    
    // Only update state after successful server delete
    const stateKey = KEY_MAP[table] || table;
    setStateForKey(stateKey, prev => prev.filter(item => item.id !== id));
  }, []);

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
  const addTransaction = useCallback(async (data) => {
    const newTx = await createRecord('transactions', data);
    if (data.accountId && data.type !== 'transfer') {
      setAccounts(prev => {
        const acc = prev.find(a => a.id === data.accountId);
        if (acc) {
          const change = data.type === 'income' ? data.amount : -data.amount;
          const newBalance = (acc.balance || 0) + change;
          updateRecord('accounts', data.accountId, { balance: newBalance }).catch(console.error);
        }
        return prev.map(a => a.id === data.accountId ? { ...a, balance: (a.balance || 0) + (data.type === 'income' ? data.amount : -data.amount) } : a);
      });
    }
    return newTx;
  }, [createRecord, updateRecord]);

  const updateTransaction = useCallback(async (id, data) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    if (oldTx.type === 'transfer') {
      await updateRecord('transactions', id, data);
      return;
    }

    if (oldTx.accountId) {
      const oldAcc = accounts.find(a => a.id === oldTx.accountId);
      if (oldAcc) {
        const rollback = oldTx.type === "income" ? -oldTx.amount : oldTx.amount;
        await updateRecord('accounts', oldTx.accountId, { balance: (oldAcc.balance || 0) + rollback });
      }
    }

    const updatedTx = { ...oldTx, ...data };

    if (updatedTx.accountId && updatedTx.type !== 'transfer') {
      const newAcc = accounts.find(a => a.id === updatedTx.accountId);
      if (newAcc) {
        const change = updatedTx.type === "income" ? updatedTx.amount : -updatedTx.amount;
        await updateRecord('accounts', updatedTx.accountId, { balance: (newAcc.balance || 0) + change });
      }
    }

    setTransactions(prev => prev.map(item => item.id === id ? updatedTx : item));
  }, [accounts, transactions, updateRecord]);

  const deleteTransaction = useCallback(async (id) => {
    const tx = transactions.find(t => t.id === id);
    if (tx && tx.accountId) {
      const acc = accounts.find(a => a.id === tx.accountId);
      if (acc) {
        const change = tx.type === 'income' ? -tx.amount : tx.amount;
        const newBalance = (acc.balance || 0) + change;
        updateRecord('accounts', tx.accountId, { balance: newBalance }).catch(console.error);
      }
    }
    await deleteRecord('transactions', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [deleteRecord, accounts, updateRecord, transactions]);

  // Transfer antar akun
  const transferBetweenAccounts = useCallback(({ fromAccountId, toAccountId, amount, note, date }) => {
    if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
      throw new Error('Data transfer tidak valid');
    }

    if (fromAccountId === toAccountId) {
      throw new Error('Tidak bisa transfer ke akun yang sama');
    }

    // Use recalculated balances for accurate check
    const currentBalances = recalculateAccountBalances(transactions, accounts);
    const fromAccount = currentBalances.find(acc => acc.id === fromAccountId);
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

    // Update saldo kedua akun (optimistic)
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
  }, [accounts, transactions, createRecord]);

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
    // Ensure year and month are always present (fallback to selectedPeriod)
    const resolvedYear = data.year ?? selectedPeriod.year;
    const resolvedMonth = data.month ?? selectedPeriod.month;
    const newBudget = { ...data, year: resolvedYear, month: resolvedMonth, id: `bud-${Date.now()}` };
    setBudgets(prev => {
      const exists = prev.find(b => b.categoryId === data.categoryId && b.year === resolvedYear && b.month === resolvedMonth);
      if (exists) return prev.map(b => b.id === exists.id ? newBudget : b);
      return [...prev, newBudget];
    });
    if (isSupabaseConfigured()) supabaseSync.queueOperation('budgets', 'insert', newBudget);
  }, [selectedPeriod]);

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

  // Account CRUD
  const addAccount = useCallback((data) => createRecord('accounts', data), [createRecord]);
  const updateAccount = useCallback((id, data) => updateRecord('accounts', id, data), [updateRecord]);
  const deleteAccount = useCallback((id) => deleteRecord('accounts', id), [deleteRecord]);

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

  // Derived accounts with accurate balances from all transactions
  const accountsWithBalances = useMemo(() => 
    recalculateAccountBalances(transactions, accounts),
  [transactions, accounts]);

  const value = {
    accounts: accountsWithBalances, categories, transactions, budgets, assets, savings, debts, receivables, recurringPayments,
    selectedPeriod, setSelectedPeriod, isInitialized, setIsInitialized, isInitialSyncComplete, syncStatus,
    periodTransactions, expenses, incomes, totalIncome, totalExpense, netCashFlow,
    addTransaction, updateTransaction, deleteTransaction, transferBetweenAccounts,
    addCategory, updateCategory, deleteCategory,
    addBudget, updateBudget, deleteBudget,
    addAsset, updateAsset, deleteAsset,
    addSaving, updateSaving, deleteSaving,
    addDebt, updateDebt, deleteDebt, markDebtPaid,
    addReceivable, updateReceivable, deleteReceivable, markReceivablePaid,
    addRecurringPayment, updateRecurringPayment, deleteRecurringPayment, resetRecurringPayments, 
    addAccount, updateAccount, deleteAccount,
    resetAllData,
    refreshAllData: () => supabaseSync.fetchAllData()
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
