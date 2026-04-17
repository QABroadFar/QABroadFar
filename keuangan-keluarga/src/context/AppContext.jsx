import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { supabaseSync } from '../lib/supabaseSync';
import { useAuth } from './AuthContext';
import { defaultAccounts, defaultCategories, defaultRecurringPayments } from '../utils/defaults';
import { getCurrentMonth, getMonthRange } from '../utils/helpers';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  const { userId, isAuthenticated } = useAuth();
  
  // State
  const [accounts, setAccounts] = useState(() => storage.get('accounts', defaultAccounts));
  const [categories, setCategories] = useState(() => storage.get('categories', defaultCategories));
  const [transactions, setTransactions] = useState(() => storage.get('transactions', []));
  const [budgets, setBudgets] = useState(() => storage.get('budgets', []));
  const [assets, setAssets] = useState(() => storage.get('assets', []));
  const [savings, setSavings] = useState(() => storage.get('savings', []));
  const [debts, setDebts] = useState(() => storage.get('debts', []));
  const [receivables, setReceivables] = useState(() => storage.get('receivables', []));
  const [recurringPayments, setRecurringPayments] = useState(() => storage.get('recurringPayments', defaultRecurringPayments));
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentMonth);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSync: null });

  // Initialize Supabase sync when user authenticates
  useEffect(() => {
    if (isAuthenticated && userId) {
      supabaseSync.init().then(() => {
        setSyncStatus({ syncing: false, lastSync: new Date() });
      });
    }
  }, [isAuthenticated, userId]);

  // Listen for remote data changes
  useEffect(() => {
    const handleRemoteChange = (e) => {
      const { table, event } = e.detail;
      // Refresh local state from storage (which was updated by supabaseSync)
      // This trigger component re-render with new data
      console.log(`Remote ${event} on ${table}, refreshing state...`);
    };

    window.addEventListener('supabase-data-changed', handleRemoteChange);
    return () => window.removeEventListener('supabase-data-changed', handleRemoteChange);
  }, []);

  // Persist to localStorage (unchanged)
  useEffect(() => { storage.set('accounts', accounts); }, [accounts]);
  useEffect(() => { storage.set('categories', categories); }, [categories]);
  useEffect(() => { storage.set('transactions', transactions); }, [transactions]);
  useEffect(() => { storage.set('budgets', budgets); }, [budgets]);
  useEffect(() => { storage.set('assets', assets); }, [assets]);
  useEffect(() => { storage.set('savings', savings); }, [savings]);
  useEffect(() => { storage.set('debts', debts); }, [debts]);
  useEffect(() => { storage.set('receivables', receivables); }, [receivables]);
  useEffect(() => { storage.set('recurringPayments', recurringPayments); }, [recurringPayments]);

  // Generic CRUD helpers with Supabase sync
  const createRecord = useCallback((key, data) => {
    const newItem = { ...data, id: `${key.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    
    setStateForKey(key, prev => [newItem, ...prev]);
    
    // Queue for Supabase sync if authenticated
    if (isAuthenticated) {
      storage.queueOperation(key, 'insert', newItem);
    }
    
    return newItem;
  }, [isAuthenticated]);

  const updateRecord = useCallback((key, id, data) => {
    setStateForKey(key, prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
    
    if (isAuthenticated) {
      storage.queueOperation(key, 'update', { id, ...data });
    }
  }, [isAuthenticated]);

  const deleteRecord = useCallback((key, id) => {
    setStateForKey(key, prev => prev.filter(item => item.id !== id));
    
    if (isAuthenticated) {
      storage.queueOperation(key, 'delete', { id });
    }
  }, [isAuthenticated]);

  // Helper to set state based on key
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

  // Transaction CRUD with account balance updates
  const addTransaction = useCallback((data) => {
    const newTx = createRecord('transactions', data);
    // Update account balance locally
    if (data.accountId) {
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
    const oldTx = transactions.find(t => t.id === id);
    updateRecord('transactions', id, data);
    // Handle account balance adjustment if account changed
    if (oldTx && oldTx.accountId !== data.accountId) {
      // Reverse old account
      if (oldTx.accountId) {
        setAccounts(prev => prev.map(acc => {
          if (acc.id === oldTx.accountId) {
            const change = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
            return { ...acc, balance: (acc.balance || 0) + change };
          }
          return acc;
        }));
      }
      // Apply new account
      if (data.accountId) {
        setAccounts(prev => prev.map(acc => {
          if (acc.id === data.accountId) {
            const change = data.type === 'income' ? data.amount : -data.amount;
            return { ...acc, balance: (acc.balance || 0) + change };
          }
          return acc;
        }));
      }
    }
  }, [transactions, updateRecord]);

  const deleteTransaction = useCallback((id) => {
    deleteRecord('transactions', id);
    // Reverse account balance
    setTransactions(prev => {
      const tx = prev.find(t => t.id === id);
      if (tx && tx.accountId) {
        setAccounts(accs => accs.map(acc => {
          if (acc.id === tx.accountId) {
            const change = tx.type === 'income' ? -tx.amount : tx.amount;
            return { ...acc, balance: (acc.balance || 0) + change };
          }
          return acc;
        }));
      }
      return prev.filter(t => t.id !== id);
    });
  }, [deleteRecord]);

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
      if (exists) {
        return prev.map(b => b.id === exists.id ? newBudget : b);
      }
      return [...prev, newBudget];
    });
    if (isAuthenticated) storage.queueOperation('budgets', 'insert', newBudget);
  }, [isAuthenticated]);

  const updateBudget = useCallback((id, data) => {
    updateRecord('budgets', id, data);
  }, [updateRecord]);

  const deleteBudget = useCallback((id) => {
    deleteRecord('budgets', id);
  }, [deleteRecord]);

  // Asset CRUD
  const addAsset = useCallback((data) => {
    return createRecord('assets', data);
  }, [createRecord]);

  const updateAsset = useCallback((id, data) => {
    updateRecord('assets', id, data);
  }, [updateRecord]);

  const deleteAsset = useCallback((id) => {
    deleteRecord('assets', id);
  }, [deleteRecord]);

  // Savings CRUD
  const addSaving = useCallback((data) => {
    return createRecord('savings', { ...data, currentAmount: data.currentAmount || 0 });
  }, [createRecord]);

  const updateSaving = useCallback((id, data) => {
    updateRecord('savings', id, data);
  }, [updateRecord]);

  const addToSaving = useCallback((id, amount) => {
    setSavings(prev => prev.map(s => s.id === id ? { ...s, currentAmount: (s.currentAmount || 0) + amount } : s));
    if (isAuthenticated) {
      // Update in Supabase
      supabaseSync.queueOperation('savings', 'update', { id, currentAmount: (savings.find(s => s.id === id)?.currentAmount || 0) + amount });
    }
  }, [isAuthenticated, savings]);

  const deleteSaving = useCallback((id) => {
    deleteRecord('savings', id);
  }, [deleteRecord]);

  // Debt CRUD
  const addDebt = useCallback((data) => {
    return createRecord('debts', { ...data, isPaid: false });
  }, [createRecord]);

  const updateDebt = useCallback((id, data) => {
    updateRecord('debts', id, data);
  }, [updateRecord]);

  const markDebtPaid = useCallback((id) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, isPaid: true } : d));
    if (isAuthenticated) {
      supabaseSync.queueOperation('debts', 'update', { id, isPaid: true });
    }
  }, [isAuthenticated]);

  const deleteDebt = useCallback((id) => {
    deleteRecord('debts', id);
  }, [deleteRecord]);

  // Receivable CRUD
  const addReceivable = useCallback((data) => {
    return createRecord('receivables', { ...data, isPaid: false });
  }, [createRecord]);

  const updateReceivable = useCallback((id, data) => {
    updateRecord('receivables', id, data);
  }, [updateRecord]);

  const markReceivablePaid = useCallback((id) => {
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, isPaid: true } : r));
    if (isAuthenticated) {
      supabaseSync.queueOperation('receivables', 'update', { id, isPaid: true });
    }
  }, [isAuthenticated]);

  const deleteReceivable = useCallback((id) => {
    deleteRecord('receivables', id);
  }, [deleteRecord]);

  // Recurring Payments
  const addRecurringPayment = useCallback((data) => {
    return createRecord('recurringPayments', { ...data, isActive: true });
  }, [createRecord]);

  const updateRecurringPayment = useCallback((id, data) => {
    updateRecord('recurringPayments', id, data);
  }, [updateRecord]);

  const markRecurringPaid = useCallback((id) => {
    setRecurringPayments(prev => prev.map(r => r.id === id ? { ...r, isPaid: true } : r));
    if (isAuthenticated) {
      supabaseSync.queueOperation('recurringPayments', 'update', { id, isPaid: true });
    }
  }, [isAuthenticated]);

  const deleteRecurringPayment = useCallback((id) => {
    deleteRecord('recurringPayments', id);
  }, [deleteRecord]);

  const resetRecurringPayments = useCallback(() => {
    setRecurringPayments(prev => prev.map(r => ({ ...r, isPaid: false })));
    // Batch update all in Supabase would be handled separately if needed
  }, []);

  // Account CRUD
  const addAccount = useCallback((data) => {
    return createRecord('accounts', { ...data, isActive: true, balance: data.initialBalance || 0 });
  }, [createRecord]);

  const updateAccount = useCallback((id, data) => {
    updateRecord('accounts', id, data);
  }, [updateRecord]);

  const deleteAccount = useCallback((id) => {
    deleteRecord('accounts', id);
  }, [deleteRecord]);

  // Get transactions for selected period
  const getPeriodTransactions = useCallback(() => {
    const { start, end } = getMonthRange(selectedPeriod.year, selectedPeriod.month);
    return transactions.filter(tx => tx.date >= start && tx.date <= end);
  }, [transactions, selectedPeriod]);

  // Computed values
  const periodTransactions = getPeriodTransactions();
  const expenses = periodTransactions.filter(tx => tx.type === 'expense');
  const incomes = periodTransactions.filter(tx => tx.type === 'income');
  const totalIncome = incomes.reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  const value = {
    // Data
    accounts, categories, transactions, budgets, assets, savings, debts, receivables, recurringPayments,
    selectedPeriod, setSelectedPeriod, isInitialized, setIsInitialized, syncStatus,
    // Computed
    periodTransactions, expenses, incomes, totalIncome, totalExpense, netCashFlow,
    // Transaction actions
    addTransaction, updateTransaction, deleteTransaction,
    // Category actions
    addCategory, updateCategory, deleteCategory,
    // Budget actions
    addBudget, updateBudget, deleteBudget,
    // Asset actions
    addAsset, updateAsset, deleteAsset,
    // Savings actions
    addSaving, updateSaving, addToSaving, deleteSaving,
    // Debt actions
    addDebt, updateDebt, markDebtPaid, deleteDebt,
    // Receivable actions
    addReceivable, updateReceivable, markReceivablePaid, deleteReceivable,
    // Recurring payment actions
    addRecurringPayment, updateRecurringPayment, markRecurringPaid, deleteRecurringPayment, resetRecurringPayments,
    // Account actions
    addAccount, updateAccount, deleteAccount,
    // Sync actions
    syncFromRemote: () => storage.syncFromRemote(),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
