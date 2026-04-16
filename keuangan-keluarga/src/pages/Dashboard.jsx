import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle, StatCard } from '../components/Card';
import Button from '../components/Button';
import TransactionDetailModal from '../components/TransactionDetailModal';
import TransactionForm from '../components/TransactionForm';
import { formatCurrency, getPreviousMonth, getMonthRange, getCurrentMonth } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import {
  ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank, AlertTriangle,
  CheckCircle, Edit, Download, FileSpreadsheet, FileText, File, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Dashboard.css';

export default function Dashboard() {
  const {
    selectedPeriod, setSelectedPeriod, expenses, incomes, totalIncome, totalExpense, netCashFlow,
    accounts, budgets, categories, transactions, recurringPayments, savings, debts,
    updateTransaction, deleteTransaction,
  } = useApp();

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [detailModal, setDetailModal] = useState({ open: false, title: '', txs: [] });
  const [recentTxCount, setRecentTxCount] = useState(5);

  // Reports date filter
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const firstDay = `${currentMonth}-01`;
  const lastDay = `${currentMonth}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  const [dateMode, setDateMode] = useState('month'); // 'month' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reportDateRange, setReportDateRange] = useState({
    from: firstDay,
    to: lastDay,
  });

  // Auto update date range when month changes
  useEffect(() => {
    if (dateMode === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const first = `${selectedMonth}-01`;
      const last = `${selectedMonth}-${new Date(year, month, 0).getDate()}`;
      setReportDateRange({ from: first, to: last });
    }
  }, [selectedMonth, dateMode]);

  const reportTxs = useMemo(() => {
    return transactions.filter(tx => tx.date >= reportDateRange.from && tx.date <= reportDateRange.to);
  }, [transactions, reportDateRange]);

  const reportIncome = reportTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const reportExpense = reportTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

  // ====== YEARLY BAR CHART (12 months income vs expense) ======
  const yearlyData = useMemo(() => {
    const year = new Date(reportDateRange.from).getFullYear();
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const { start, end } = getMonthRange(year, m);
      const monthTxs = transactions.filter(tx => tx.date >= start && tx.date <= end);
      const inc = monthTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
      const exp = monthTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
      const shortMonth = format(new Date(year, m - 1, 1), 'MMM', { locale: localeId });
      months.push({ name: shortMonth, Pemasukan: inc, Pengeluaran: exp, Saldo: inc - exp });
    }
    return months;
  }, [transactions, reportDateRange]);

  // Previous month data
  const currentSelectedDate = new Date(reportDateRange.from);
  const prevMonth = getPreviousMonth(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth() + 1);
  const prevMonthRange = getMonthRange(prevMonth.year, prevMonth.month);
  const prevMonthTxs = transactions.filter(tx => tx.date >= prevMonthRange.start && tx.date <= prevMonthRange.end);
  const prevIncome = prevMonthTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const prevExpense = prevMonthTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

  // Budget summary
  const budgetMonth = new Date(reportDateRange.from).getMonth() + 1;
  const budgetYear = new Date(reportDateRange.from).getFullYear();
  const totalBudget = budgets
    .filter(b => b.year === budgetYear && b.month === budgetMonth)
    .reduce((s, b) => s + b.amount, 0);
  const remainingBudget = totalBudget - totalExpense;
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  // Top 5 expense categories
  const topExpenseCategories = useMemo(() => {
    const catMap = {};
    reportTxs.filter(tx => tx.type === 'expense').forEach(tx => {
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
  }, [reportTxs, categories]);

  // Category comparison (this month vs last month)
  const categoryComparison = useMemo(() => {
    const thisCatMap = {};
    const prevCatMap = {};
    reportTxs.filter(tx => tx.type === 'expense').forEach(tx => {
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
  }, [reportTxs, prevMonthTxs, categories]);

  // Health ratio calculation
  const healthRatio = useMemo(() => {
    const liquidAssets = accounts.filter(a => a.type !== 'investment').reduce((s, a) => s + Math.max(0, a.balance || 0), 0);
    const monthlyExpense = prevExpense || totalExpense || 1;
    const emergencyRatio = (liquidAssets / monthlyExpense) * 100;
    const monthlyDebtPayment = debts.filter(d => !d.isPaid).reduce((s, d) => s + (d.monthlyPayment || 0), 0);
    const debtToIncome = totalIncome > 0 ? (monthlyDebtPayment / totalIncome) * 100 : 0;
    const savingsThisMonth = transactions
      .filter(tx => tx.type === 'expense' && tx.categoryId === 'cat-8')
      .reduce((s, tx) => s + tx.amount, 0);
    const savingsRatio = totalIncome > 0 ? (savingsThisMonth / totalIncome) * 100 : 0;
    let score = 50;
    score += Math.min(20, (emergencyRatio / 600) * 20);
    score -= Math.min(20, (debtToIncome / 30) * 20);
    score += Math.min(20, (savingsRatio / 20) * 20);
    if (netCashFlow > 0) score += 10;
    score = Math.max(0, Math.min(100, Math.round(score)));
    let recommendation = '';
    if (score >= 80) recommendation = 'Keuangan Anda sangat sehat!';
    else if (score >= 60) recommendation = 'Keuangan cukup baik, tingkatkan tabungan.';
    else if (score >= 40) recommendation = 'Perlu perbaikan: kurangi utang, tambah tabungan.';
    else recommendation = 'Perhatian! Dana darurat dan utang perlu dikelola.';
    return { score, emergencyRatio: emergencyRatio.toFixed(1), debtToIncome: debtToIncome.toFixed(1), savingsRatio: savingsRatio.toFixed(1), recommendation };
  }, [accounts, debts, transactions, totalIncome, totalExpense, netCashFlow, prevExpense]);

  // Cash flow projection
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
  const paidRecurring = recurringPayments.filter(r => r.isPaid);

  // Reports: category breakdown
  const expenseByCategory = useMemo(() => {
    const map = {};
    reportTxs.filter(tx => tx.type === 'expense').forEach(tx => {
      if (!map[tx.categoryId]) map[tx.categoryId] = { categoryId: tx.categoryId, total: 0, count: 0 };
      map[tx.categoryId].total += tx.amount;
      map[tx.categoryId].count += 1;
    });
    return Object.values(map).map(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      return { ...item, name: cat?.name || 'Unknown', color: cat?.color || '#666' };
    }).sort((a, b) => b.total - a.total);
  }, [reportTxs, categories]);

  const incomeByCategory = useMemo(() => {
    const map = {};
    reportTxs.filter(tx => tx.type === 'income').forEach(tx => {
      if (!map[tx.categoryId]) map[tx.categoryId] = { categoryId: tx.categoryId, total: 0 };
      map[tx.categoryId].total += tx.amount;
    });
    return Object.values(map).map(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      return { ...item, name: cat?.name || 'Unknown', color: cat?.color || '#666' };
    }).sort((a, b) => b.total - a.total);
  }, [reportTxs, categories]);

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

  // Export functions
  const exportCSV = () => {
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Subkategori', 'Nominal', 'Akun', 'Catatan'];
    const rows = reportTxs.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const sub = cat?.subcategories?.find(s => s.id === tx.subcategoryId);
      const acc = accounts.find(a => a.id === tx.accountId);
      return [tx.date, tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran', cat?.name || '-', sub?.name || '-', tx.amount, acc?.name || '-', tx.note || ''];
    });
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_${reportDateRange.from}_${reportDateRange.to}.csv`;
    link.click();
  };

  const exportExcel = () => {
    const data = reportTxs.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const sub = cat?.subcategories?.find(s => s.id === tx.subcategoryId);
      const acc = accounts.find(a => a.id === tx.accountId);
      return { Tanggal: tx.date, Tipe: tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran', Kategori: cat?.name || '-', Subkategori: sub?.name || '-', Nominal: tx.amount, Akun: acc?.name || '-', Catatan: tx.note || '' };
    });
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Laporan');
    writeFile(wb, `laporan_${reportDateRange.from}_${reportDateRange.to}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Laporan Keuangan Keluarga', 14, 20);
    doc.setFontSize(10);
    doc.text(`Periode: ${reportDateRange.from} s/d ${reportDateRange.to}`, 14, 28);
    doc.text(`Total Pemasukan: ${formatCurrency(reportIncome)}`, 14, 35);
    doc.text(`Total Pengeluaran: ${formatCurrency(reportExpense)}`, 14, 42);
    doc.text(`Saldo: ${formatCurrency(reportIncome - reportExpense)}`, 14, 49);
    const tableData = reportTxs.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      return [tx.date, cat?.name || '-', tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran', formatCurrency(tx.amount)];
    });
    doc.autoTable({ startY: 55, head: [['Tanggal', 'Kategori', 'Tipe', 'Nominal']], body: tableData });
    doc.save(`laporan_${reportDateRange.from}_${reportDateRange.to}.pdf`);
  };

  return (
    <div className="dashboard">
      {/* Modern Date Filter Bar */}
      <div className="date-filter-bar">
        <div className="filter-left">
          <span className="filter-label"><Filter size={16} /> Periode Laporan</span>
        </div>
        <div className="filter-controls">
          <select
            value={dateMode}
            onChange={e => setDateMode(e.target.value)}
            className="modern-select"
          >
            <option value="month">📅 Bulanan</option>
            <option value="custom">📆 Custom Tanggal</option>
          </select>

          {dateMode === 'month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="modern-input"
            />
          )}

          {dateMode === 'custom' && (
            <>
              <input type="date" value={reportDateRange.from} onChange={e => setReportDateRange(prev => ({ ...prev, from: e.target.value }))} className="modern-input" />
              <span className="filter-separator">sampai</span>
              <input type="date" value={reportDateRange.to} onChange={e => setReportDateRange(prev => ({ ...prev, to: e.target.value }))} className="modern-input" />
            </>
          )}
        </div>
      </div>

      {/* ====== STAT CARDS ====== */}
      <div className="dashboard-stats">
        <StatCard title="Arus Kas Bersih" value={formatCurrency(netCashFlow)} icon={netCashFlow >= 0 ? ArrowUpRight : ArrowDownLeft} color={netCashFlow >= 0 ? 'var(--success)' : 'var(--danger)'} />
        <StatCard title="Total Saldo" value={formatCurrency(totalBalance)} icon={Wallet} color="var(--primary)" />
        <StatCard title="Pemasukan Bulan Ini" value={formatCurrency(totalIncome)} subtitle={prevIncome > 0 ? `${((totalIncome - prevIncome) / prevIncome * 100).toFixed(1)}% dari bulan lalu` : ''} icon={ArrowUpRight} color="var(--success)" />
        <StatCard title="Sisa Anggaran" value={formatCurrency(remainingBudget)} subtitle={totalBudget > 0 ? `dari ${formatCurrency(totalBudget)}` : 'Belum ada budget'} icon={PiggyBank} color={remainingBudget >= 0 ? 'var(--success)' : 'var(--danger)'} />
      </div>

      {/* ====== YEARLY BAR CHART ====== */}
      <Card className="yearly-chart-card">
        <CardHeader>
          <CardTitle>Grafik Pemasukan & Pengeluaran {selectedPeriod.year}</CardTitle>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={yearlyData} barGap={2} barSize={28}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value, name) => {
                  if (name === 'Arus Kas') return [formatCurrency(value), name];
                  return [formatCurrency(value), name === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran'];
                }}
                cursor={{ fill: 'var(--hover-bg)' }}
              />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Bar dataKey="Pemasukan" fill="url(#colorIncome)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pengeluaran" fill="url(#colorExpense)" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }} name="Arus Kas" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* ====== COMPARISON + TOP CATEGORIES ====== */}
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
                  <Bar dataKey="Bulan Ini" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Bulan Lalu" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
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

      {/* ====== HEALTH SCORE + PROJECTION ====== */}
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

      {/* ====== ANOMALIES ====== */}
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

      {/* ====== RECENT TX + RECURRING ====== */}
      <div className="dashboard-bottom">
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
            <div className="toggle-group">
              <button className={`toggle-btn ${recentTxCount === 5 ? 'active' : ''}`} onClick={() => setRecentTxCount(5)}>5</button>
              <button className={`toggle-btn ${recentTxCount === 10 ? 'active' : ''}`} onClick={() => setRecentTxCount(10)}>10</button>
            </div>
          </CardHeader>
          <CardBody>
            {recentTransactions.length === 0 ? (
              <p className="empty-state">Belum ada transaksi.</p>
            ) : (
              <div className="recent-tx-list">
                {recentTransactions.map(tx => {
                  const cat = categories.find(c => c.id === tx.categoryId);
                  return (
                    <div key={tx.id} className="recent-tx-item" onClick={() => handleEditTransaction(tx)}>
                      <div className="recent-tx-info">
                        <span className="recent-tx-date">{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                        <span className="recent-tx-cat" style={{ borderLeftColor: cat?.color || '#666' }}>{cat?.name || '-'}</span>
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
            <span className="recurring-status">{paidRecurring.length}/{recurringPayments.length} lunas</span>
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

      {/* ====== REPORT SECTION (merged from Reports page) ====== */}
      <section className="report-section">
        <div className="report-header">
          <h2>Laporan Keuangan</h2>
          <div className="export-buttons">
            <Button variant="outline" size="sm" onClick={exportCSV} icon={FileText}>CSV</Button>
            <Button variant="outline" size="sm" onClick={exportExcel} icon={FileSpreadsheet}>Excel</Button>
            <Button variant="outline" size="sm" onClick={exportPDF} icon={File}>PDF</Button>
          </div>
        </div>


        <Card>
          <CardBody className="summary-card">
            <div className="summary-item">
              <span className="summary-label">Total Pemasukan</span>
              <span className="summary-value income">{formatCurrency(reportIncome)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Pengeluaran</span>
              <span className="summary-value expense">{formatCurrency(reportExpense)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Saldo</span>
              <span className={`summary-value ${reportIncome - reportExpense >= 0 ? 'income' : 'expense'}`}>
                {formatCurrency(reportIncome - reportExpense)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Jumlah Transaksi</span>
              <span className="summary-value">{reportTxs.length}</span>
            </div>
          </CardBody>
        </Card>

        <div className="report-tables">
          <Card>
            <CardHeader>
              <CardTitle>Pengeluaran per Kategori</CardTitle>
            </CardHeader>
            <CardBody>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Jumlah</th>
                    <th className="text-right">% dari Total</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseByCategory.map(item => (
                    <tr key={item.categoryId} onClick={() => {
                      const txs = reportTxs.filter(tx => tx.categoryId === item.categoryId);
                      setDetailModal({ open: true, title: `Detail: ${item.name}`, txs });
                    }}>
                      <td><span className="cat-dot" style={{ background: item.color }}></span>{item.name}</td>
                      <td className="text-right">{formatCurrency(item.total)}</td>
                      <td className="text-right">{item.count}</td>
                      <td className="text-right">{reportExpense > 0 ? (item.total / reportExpense * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pemasukan per Kategori</CardTitle>
            </CardHeader>
            <CardBody>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">% dari Total</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeByCategory.map(item => (
                    <tr key={item.categoryId} onClick={() => {
                      const txs = reportTxs.filter(tx => tx.categoryId === item.categoryId);
                      setDetailModal({ open: true, title: `Detail: ${item.name}`, txs });
                    }}>
                      <td><span className="cat-dot" style={{ background: item.color }}></span>{item.name}</td>
                      <td className="text-right">{formatCurrency(item.total)}</td>
                      <td className="text-right">{reportIncome > 0 ? (item.total / reportIncome * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ====== MODALS ====== */}
      <TransactionDetailModal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, title: '', txs: [] })}
        transactions={detailModal.txs}
        title={detailModal.title}
        onEdit={handleEditTransaction}
      />
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => { setShowTransactionForm(false); setEditTx(null); }}
        editTransaction={editTx}
      />
    </div>
  );
}
