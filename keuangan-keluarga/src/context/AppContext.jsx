import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { defaultAccounts, defaultCategories, defaultRecurringPayments } from '../utils/defaults';
import { getCurrentMonth, getMonthRange } from '../utils/helpers';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
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

  // Persist data to localStorage
  useEffect(() => { storage.set('accounts', accounts); }, [accounts]);
  useEffect(() => { storage.set('categories', categories); }, [categories]);
  useEffect(() => { storage.set('transactions', transactions); }, [transactions]);
  useEffect(() => { storage.set('budgets', budgets); }, [budgets]);
  useEffect(() => { storage.set('assets', assets); }, [assets]);
  useEffect(() => { storage.set('savings', savings); }, [savings]);
  useEffect(() => { storage.set('debts', debts); }, [debts]);
  useEffect(() => { storage.set('receivables', receivables); }, [receivables]);
  useEffect(() => { storage.set('recurringPayments', recurringPayments); }, [recurringPayments]);

  // Transaction CRUD
  const addTransaction = useCallback((data) => {
    const newTx = { ...data, id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    setTransactions(prev => [newTx, ...prev]);
    // Update account balance
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
  }, []);

  const updateTransaction = useCallback((id, data) => {
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...data } : tx));
  }, []);

  const deleteTransaction = useCallback((id) => {
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
  }, []);

  // Category CRUD
  const addCategory = useCallback((data) => {
    const newCat = { ...data, id: `cat-${Date.now()}`, subcategories: data.subcategories || [] };
    setCategories(prev => [...prev, newCat]);
  }, []);

  const updateCategory = useCallback((id, data) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...data } : cat));
  }, []);

  const deleteCategory = useCallback((id) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  }, []);

  // Budget CRUD
  const addBudget = useCallback((data) => {
    const exists = budgets.find(b => b.categoryId === data.categoryId && b.year === data.year && b.month === data.month);
    if (exists) {
      setBudgets(prev => prev.map(b => b.id === exists.id ? { ...b, ...data } : b));
    } else {
      const newBudget = { ...data, id: `bud-${Date.now()}` };
      setBudgets(prev => [...prev, newBudget]);
    }
  }, [budgets]);

  const updateBudget = useCallback((id, data) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  }, []);

  const deleteBudget = useCallback((id) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  // Asset CRUD
  const addAsset = useCallback((data) => {
    const newAsset = { ...data, id: `asset-${Date.now()}` };
    setAssets(prev => [...prev, newAsset]);
  }, []);

  const updateAsset = useCallback((id, data) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAsset = useCallback((id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  }, []);

  // Savings CRUD
  const addSaving = useCallback((data) => {
    const newSaving = { ...data, id: `sav-${Date.now()}`, currentAmount: data.currentAmount || 0 };
    setSavings(prev => [...prev, newSaving]);
  }, []);

  const updateSaving = useCallback((id, data) => {
    setSavings(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }, []);

  const addToSaving = useCallback((id, amount) => {
    setSavings(prev => prev.map(s => s.id === id ? { ...s, currentAmount: (s.currentAmount || 0) + amount } : s));
  }, []);

  const deleteSaving = useCallback((id) => {
    setSavings(prev => prev.filter(s => s.id !== id));
  }, []);

  // Debt CRUD
  const addDebt = useCallback((data) => {
    const newDebt = { ...data, id: `debt-${Date.now()}`, isPaid: false };
    setDebts(prev => [...prev, newDebt]);
  }, []);

  const updateDebt = useCallback((id, data) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  }, []);

  const markDebtPaid = useCallback((id) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, isPaid: true } : d));
  }, []);

  const deleteDebt = useCallback((id) => {
    setDebts(prev => prev.filter(d => d.id !== id));
  }, []);

  // Receivable CRUD
  const addReceivable = useCallback((data) => {
    const newRec = { ...data, id: `rec-${Date.now()}`, isPaid: false };
    setReceivables(prev => [...prev, newRec]);
  }, []);

  const updateReceivable = useCallback((id, data) => {
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  }, []);

  const markReceivablePaid = useCallback((id) => {
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, isPaid: true } : r));
  }, []);

  const deleteReceivable = useCallback((id) => {
    setReceivables(prev => prev.filter(r => r.id !== id));
  }, []);

  // Recurring Payments
  const addRecurringPayment = useCallback((data) => {
    const newRec = { ...data, id: `rp-${Date.now()}`, isPaid: false };
    setRecurringPayments(prev => [...prev, newRec]);
  }, []);

  const updateRecurringPayment = useCallback((id, data) => {
    setRecurringPayments(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  }, []);

  const markRecurringPaid = useCallback((id) => {
    setRecurringPayments(prev => prev.map(r => r.id === id ? { ...r, isPaid: true } : r));
  }, []);

  const deleteRecurringPayment = useCallback((id) => {
    setRecurringPayments(prev => prev.filter(r => r.id !== id));
  }, []);

  const resetRecurringPayments = useCallback(() => {
    setRecurringPayments(prev => prev.map(r => ({ ...r, isPaid: false })));
  }, []);

  // Account CRUD
  const addAccount = useCallback((data) => {
    const newAcc = { ...data, id: `acc-${Date.now()}`, isActive: true };
    setAccounts(prev => [...prev, newAcc]);
  }, []);

  const updateAccount = useCallback((id, data) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAccount = useCallback((id) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Get transactions for selected period
  const getPeriodTransactions = useCallback(() => {
    const { start, end } = getMonthRange(selectedPeriod.year, selectedPeriod.month);
    return transactions.filter(tx => tx.date >= start && tx.date <= end);
  }, [transactions, selectedPeriod]);

  // Get expenses for selected period
  const periodTransactions = getPeriodTransactions();
  const expenses = periodTransactions.filter(tx => tx.type === 'expense');
  const incomes = periodTransactions.filter(tx => tx.type === 'income');
  const totalIncome = incomes.reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  const value = {
    // Data
    accounts, categories, transactions, budgets, assets, savings, debts, receivables, recurringPayments,
    selectedPeriod, setSelectedPeriod, isInitialized, setIsInitialized,
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
