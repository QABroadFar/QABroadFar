import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle, StatCard } from '../components/Card';
import Button from '../components/Button';
import TransactionDetailModal from '../components/TransactionDetailModal';
import TransactionForm from '../components/TransactionForm';
import { formatCurrency, getPreviousMonth, getMonthRange } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { ArrowDownLeft, ArrowUpRight, Wallet, TrendingDown, AlertTriangle, PiggyBank, Clock, CheckCircle, Edit } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
  const {
    selectedPeriod, expenses, incomes, totalIncome, totalExpense, netCashFlow,
    accounts, budgets, categories, transactions, recurringPayments, savings, debts,
    updateTransaction, deleteTransaction,
  } = useApp();

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [detailModal, setDetailModal] = useState({ open: false, title: '', txs: [] });
  const [recentTxCount, setRecentTxCount] = useState(5);

  // Previous month data for comparison
  const prevMonth = getPreviousMonth(selectedPeriod.year, selectedPeriod.month);
  const prevMonthRange = getMonthRange(prevMonth.year, prevMonth.month);
  const prevMonthTxs = transactions.filter(tx => tx.date >= prevMonthRange.start && tx.date <= prevMonthRange.end);
  const prevIncome = prevMonthTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const prevExpense = prevMonthTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

  // Budget summary
  const totalBudget = budgets
    .filter(b => b.year === selectedPeriod.year && b.month === selectedPeriod.month)
    .reduce((s, b) => s + b.amount, 0);
  const remainingBudget = totalBudget - totalExpense;

  // Total balance
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  // Top 5 expense categories
  const topExpenseCategories = useMemo(() => {
    const catMap = {};
    expenses.forEach(tx => {
      if (!catMap[tx.categoryId]) catMap[tx.categoryId] = { categoryId: tx.categoryId, total: 0 };
      catMap[tx.categoryId].total += tx.amount;
    });
    return Object.values(catMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(item => {
        const cat = categories.find(c => c.id === item.categoryId);
        return { name: cat?.name || 'Unknown', total: item.total, color: cat?.color || '#666' };
      });
  }, [expenses, categories]);

  // Category comparison (this month vs last month)
  const categoryComparison = useMemo(() => {
    const thisCatMap = {};
    const prevCatMap = {};

    expenses.forEach(tx => {
      if (!thisCatMap[tx.categoryId]) thisCatMap[tx.categoryId] = 0;
      thisCatMap[tx.categoryId] += tx.amount;
    });

    prevMonthTxs.filter(tx => tx.type === 'expense').forEach(tx => {
      if (!prevCatMap[tx.categoryId]) prevCatMap[tx.categoryId] = 0;
      prevCatMap[tx.categoryId] += tx.amount;
    });

    const allCatIds = new Set([...Object.keys(thisCatMap), ...Object.keys(prevCatMap)]);
    return Array.from(allCatIds).map(catId => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name?.split(' ')[0] || 'Unknown',
        'Bulan Ini': thisCatMap[catId] || 0,
        'Bulan Lalu': prevCatMap[catId] || 0,
      };
    }).filter(d => d['Bulan Ini'] > 0 || d['Bulan Lalu'] > 0);
  }, [expenses, prevMonthTxs, categories]);

  // Income source breakdown (pie chart)
  const incomeSources = useMemo(() => {
    const srcMap = {};
    incomes.forEach(tx => {
      const key = `${tx.categoryId}-${tx.memberId}`;
      if (!srcMap[key]) {
        const cat = categories.find(c => c.id === tx.categoryId);
        const member = members.find(m => m.id === tx.memberId);
        srcMap[key] = { name: `${cat?.name || ''}`, value: 0, color: cat?.color || '#666' };
      }
      srcMap[key].value += tx.amount;
    });
    return Object.values(srcMap).filter(s => s.value > 0);
  }, [incomes, categories, members]);

  // Health ratio calculation
  const healthRatio = useMemo(() => {
    // Emergency fund ratio
    const liquidAssets = accounts.filter(a => a.type !== 'investment').reduce((s, a) => s + Math.max(0, a.balance || 0), 0);
    const monthlyExpense = prevExpense || totalExpense || 1;
    const emergencyRatio = (liquidAssets / monthlyExpense) * 100;

    // Debt ratio - calculate from debts
    const monthlyDebtPayment = debts.filter(d => !d.isPaid).reduce((s, d) => s + (d.monthlyPayment || 0), 0);
    const debtToIncome = totalIncome > 0 ? (monthlyDebtPayment / totalIncome) * 100 : 0;

    // Savings ratio
    const savingsThisMonth = transactions
      .filter(tx => tx.type === 'expense' && tx.categoryId === 'cat-8')
      .reduce((s, tx) => s + tx.amount, 0);
    const savingsRatio = totalIncome > 0 ? (savingsThisMonth / totalIncome) * 100 : 0;

    // Score (0-100)
    let score = 50;
    // Emergency fund: ideal is 6 months
    score += Math.min(20, (emergencyRatio / 600) * 20);
    // Debt ratio: lower is better
    score -= Math.min(20, (debtToIncome / 30) * 20);
    // Savings ratio: higher is better (ideal 20%)
    score += Math.min(20, (savingsRatio / 20) * 20);
    // Cash flow positive
    if (netCashFlow > 0) score += 10;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let recommendation = '';
    if (score >= 80) recommendation = 'Keuangan Anda sangat sehat! 🎉';
    else if (score >= 60) recommendation = 'Keuangan cukup baik, tingkatkan tabungan.';
    else if (score >= 40) recommendation = 'Perlu perbaikan: kurangi utang, tambah tabungan.';
    else recommendation = 'Perhatian! Dana darurat dan utang perlu dikelola.';

    return {
      score,
      emergencyRatio: emergencyRatio.toFixed(1),
      debtToIncome: debtToIncome.toFixed(1),
      savingsRatio: savingsRatio.toFixed(1),
      recommendation,
    };
  }, [accounts, debts, transactions, totalIncome, totalExpense, netCashFlow, prevExpense]);

  // Cash flow projection (3 months)
  const cashFlowProjection = useMemo(() => {
    const avgMonthlyFlow = totalIncome - totalExpense;
    const months = ['Sekarang', '+1 Bulan', '+2 Bulan', '+3 Bulan'];
    let currentBalance = totalBalance;
    return months.map((label, i) => {
      const projected = currentBalance + (avgMonthlyFlow * i);
      currentBalance = projected;
      return { month: label, saldo: Math.round(projected) };
    });
  }, [totalBalance, totalIncome, totalExpense]);

  // Anomaly detection
  const anomalies = useMemo(() => {
    const catTotals = {};
    expenses.forEach(tx => {
      if (!catTotals[tx.categoryId]) catTotals[tx.categoryId] = 0;
      catTotals[tx.categoryId] += tx.amount;
    });

    const values = Object.values(catTotals);
    if (values.length < 2) return [];

    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);

    if (stdDev === 0) return [];

    return Object.entries(catTotals)
      .filter(([_, val]) => val > mean + 2 * stdDev)
      .map(([catId, val]) => {
        const cat = categories.find(c => c.id === catId);
        return { name: cat?.name || 'Unknown', amount: val, threshold: Math.round(mean + 2 * stdDev) };
      });
  }, [expenses, categories]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, recentTxCount);
  }, [transactions, recentTxCount]);

  // Recurring payments status
  const unpaidRecurring = recurringPayments.filter(r => !r.isPaid);
  const paidRecurring = recurringPayments.filter(r => r.isPaid);

  const handleEditTransaction = (tx) => {
    setEditTx(tx);
    setShowTransactionForm(true);
    setDetailModal({ open: false, title: '', txs: [] });
  };

  const handleCategoryClick = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    const txs = expenses.filter(tx => tx.categoryId === categoryId);
    setDetailModal({ open: true, title: `Detail: ${cat?.name}`, txs });
  };

  return (
    <div className="dashboard">
      {/* Stat Cards Row */}
      <div className="dashboard-stats">
        <StatCard
          title="Arus Kas Bersih"
          value={formatCurrency(netCashFlow)}
          icon={netCashFlow >= 0 ? ArrowUpRight : ArrowDownLeft}
          color={netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)'}
        />
        <StatCard
          title="Total Saldo"
          value={formatCurrency(totalBalance)}
          icon={Wallet}
          color="var(--primary)"
        />
        <StatCard
          title="Pemasukan Bulan Ini"
          value={formatCurrency(totalIncome)}
          subtitle={prevIncome > 0 ? `${((totalIncome - prevIncome) / prevIncome * 100).toFixed(1)}% dari bulan lalu` : ''}
          icon={TrendingDown}
          color="var(--success)"
        />
        <StatCard
          title="Sisa Anggaran"
          value={formatCurrency(remainingBudget)}
          subtitle={totalBudget > 0 ? `dari ${formatCurrency(totalBudget)}` : 'Belum ada budget'}
          icon={PiggyBank}
          color={remainingBudget >= 0 ? 'var(--success)' : 'var(--danger)'}
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts">
        <Card>
          <CardHeader>
            <CardTitle>Perbandingan Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardBody>
            {categoryComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="Bulan Ini" fill="var(--primary)" />
                  <Bar dataKey="Bulan Lalu" fill="var(--secondary)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-chart">Belum ada data pengeluaran.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5 Kategori Tertinggi</CardTitle>
          </CardHeader>
          <CardBody>
            {topExpenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topExpenseCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Bar dataKey="total" fill="var(--danger)" radius={[0, 4, 4, 0]} onClick={(data) => {
                    const cat = categories.find(c => c.name === data.name);
                    if (cat) handleCategoryClick(cat.id);
                  }} style={{ cursor: 'pointer' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-chart">Belum ada data.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Health Score & Projection Row */}
      <div className="dashboard-charts">
        <Card>
          <CardHeader>
            <CardTitle>Rasio Kesehatan Keuangan</CardTitle>
            <div className={`health-score ${healthRatio.score >= 60 ? 'good' : 'warning'}`}>
              {healthRatio.score}
            </div>
          </CardHeader>
          <CardBody>
            <div className="health-details">
              <div className="health-item">
                <span>Dana Darurat</span>
                <strong>{healthRatio.emergencyRatio}% dari pengeluaran bulanan</strong>
              </div>
              <div className="health-item">
                <span>Rasio Utang</span>
                <strong>{healthRatio.debtToIncome}% dari pendapatan</strong>
              </div>
              <div className="health-item">
                <span>Rasio Tabungan</span>
                <strong>{healthRatio.savingsRatio}% dari pendapatan</strong>
              </div>
            </div>
            <p className="health-recommendation">{healthRatio.recommendation}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proyeksi Arus Kas 3 Bulan</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cashFlowProjection}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Line type="monotone" dataKey="saldo" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Anomalies Row */}
      {anomalies.length > 0 && (
        <Card className="anomaly-card">
          <CardHeader>
            <CardTitle><AlertTriangle size={18} /> Deteksi Anomali Pengeluaran</CardTitle>
          </CardHeader>
          <CardBody>
            {anomalies.map((a, i) => (
              <div key={i} className="anomaly-item">
                <span className="anomaly-name">{a.name}</span>
                <span className="anomaly-value">{formatCurrency(a.amount)}</span>
                <span className="anomaly-threshold">Melebihi threshold: {formatCurrency(a.threshold)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Recent Transactions & Recurring Payments Row */}
      <div className="dashboard-bottom">
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${recentTxCount === 5 ? 'active' : ''}`}
                onClick={() => setRecentTxCount(5)}
              >5</button>
              <button
                className={`toggle-btn ${recentTxCount === 10 ? 'active' : ''}`}
                onClick={() => setRecentTxCount(10)}
              >10</button>
            </div>
          </CardHeader>
          <CardBody>
            {recentTransactions.length === 0 ? (
              <p className="empty-state">Belum ada transaksi.</p>
            ) : (
              <div className="recent-tx-list">
                {recentTransactions.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  const member = members.find(m => m.id === tx.memberId);
                  return (
                    <div
                      key={tx.id}
                      className="recent-tx-item"
                      onClick={() => handleEditTransaction(tx)}
                    >
                      <div className="recent-tx-info">
                        <span className="recent-tx-date">{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                        <span className="recent-tx-cat" style={{ borderLeftColor: cat?.color || '#666' }}>
                          {cat?.name || '-'}
                        </span>
                      </div>
                      <span className={`recent-tx-amount ${tx.type === 'income' ? 'income' : 'expense'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Pembayaran Rutin</CardTitle>
            <span className="recurring-status">
              {paidRecurring.length}/{recurringPayments.length} lunas
            </span>
          </CardHeader>
          <CardBody>
            {recurringPayments.length === 0 ? (
              <p className="empty-state">Belum ada tagihan rutin.</p>
            ) : (
              <div className="recurring-list">
                {recurringPayments.map(rp => (
                  <div key={rp.id} className={`recurring-item ${rp.isPaid ? 'paid' : 'unpaid'}`}>
                    <CheckCircle size={18} className={rp.isPaid ? 'paid-icon' : 'unpaid-icon'} />
                    <div className="recurring-info">
                      <span className="recurring-name">{rp.name}</span>
                      <span className="recurring-due">Jatuh tempo: tgl {rp.dueDate}</span>
                    </div>
                    <span className="recurring-amount">{formatCurrency(rp.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => { setShowTransactionForm(false); setEditTx(null); }}
        editTransaction={editTx}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, title: '', txs: [] })}
        transactions={detailModal.txs}
        title={detailModal.title}
        onEdit={handleEditTransaction}
      />
    </div>
  );
}
