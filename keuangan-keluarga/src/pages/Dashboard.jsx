import { useState, useMemo, useEffect, Fragment } from 'react';
import { useApp } from '../context/AppContext';
import TransactionDetailModal from '../components/TransactionDetailModal';
import TransactionForm from '../components/TransactionForm';
import { formatCurrency, getPreviousMonth, getMonthRange } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, ReferenceLine, Area, AreaChart,
} from 'recharts';
import {
  AlertTriangle, Filter, Wallet, Building, Smartphone,
  TrendingUp, TrendingDown, Minus, FileSpreadsheet, FileText, File,
  ArrowUpRight, ArrowDownRight, Activity, ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { EmojiDisplay } from '../components/IconPicker';
import Button from '../components/Button';
import './Dashboard.css';

/* ─── Category Group Config ──────────────────────────────── */
const GROUP_CONFIG = {
  kebutuhan: { label: 'Kebutuhan', emoji: '🏠', color: '#2563eb' },
  keinginan: { label: 'Keinginan', emoji: '✨', color: '#7c3aed' },
  tabungan:  { label: 'Tabungan',  emoji: '🐖', color: '#059669' },
};

/* ─── fmt compact ─────────────────────────────────────────── */
const fmt = (v) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
};

/* ─── Custom Tooltip ──────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="chart-tooltip-val">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Zone Header ─────────────────────────────────────────── */
const ZoneHeader = ({ num, title, desc }) => (
  <div className={`zone-header zone-header--${num}`}>
    <span className="zone-num">{num}</span>
    <span className="zone-title">{title}</span>
    {desc && <span className="zone-desc">{desc}</span>}
  </div>
);

/* ─── Health Circle with conic-gradient ──────────────────── */
const HealthCircle = ({ score, scoreClass }) => {
  const deg = Math.round((score / 100) * 360);
  return (
    <div
      className={`health-circle ${scoreClass}`}
      style={{ '--score-deg': `${deg}deg` }}
    >
      <span className="health-circle-inner">{score}</span>
    </div>
  );
};

/* ─── Budget Summary ──────────────────────────────────────── */
function BudgetSummary({ budgets, categories, expenses, reportDateRange, onCategoryClick }) {
  const curDate     = new Date(reportDateRange.from);
  const budgetYear  = curDate.getFullYear();
  const budgetMonth = curDate.getMonth() + 1;

  const currentBudgets = budgets.filter(
    b => b.year === budgetYear && b.month === budgetMonth
  );

  const rows = currentBudgets.map(bud => {
    const cat    = categories.find(c => c.id === bud.categoryId);
    const spent  = expenses
      .filter(t => t.categoryId === bud.categoryId &&
        t.date >= reportDateRange.from && t.date <= reportDateRange.to)
      .reduce((s, t) => s + t.amount, 0);
    const remaining = bud.amount - spent;
    const pct    = bud.amount > 0 ? Math.min(100, (spent / bud.amount) * 100) : 0;
    const isOver = pct >= 100;
    const isWarn = pct >= 80 && !isOver;
    return { bud, cat, spent, remaining, pct, isOver, isWarn };
  });

  const totalBudgeted = rows.reduce((s, r) => s + r.bud.amount, 0);
  const totalSpent    = rows.reduce((s, r) => s + r.spent, 0);
  const totalRemain   = totalBudgeted - totalSpent;
  const overCount     = rows.filter(r => r.isOver).length;
  const warnCount     = rows.filter(r => r.isWarn).length;
  const totalPct      = totalBudgeted > 0 ? Math.min(100, (totalSpent / totalBudgeted) * 100) : 0;

  const accentColor = totalPct >= 100
    ? 'var(--c-red-vivid)'
    : totalPct >= 80
    ? 'var(--c-amber-mid)'
    : 'var(--c-green-vivid)';

  if (currentBudgets.length === 0) {
    return (
      <div className="dash-card">
        <p className="empty-state">Belum ada anggaran bulan ini. Atur budget di menu Anggaran.</p>
      </div>
    );
  }

  return (
    <div className="budget-summary-wrap">

      {/* Dark overview card */}
      <div className="bsum-overview">
        <div className="bsum-stat-row">
          <div className="bsum-stat">
            <span className="bsum-stat-label">Total Anggaran</span>
            <span className="bsum-stat-val">{formatCurrency(totalBudgeted)}</span>
          </div>
          <div className="bsum-stat bsum-stat--mid">
            <span className="bsum-stat-label">Terpakai</span>
            <span className="bsum-stat-val" style={{ color: accentColor }}>
              {formatCurrency(totalSpent)}
            </span>
            <span className="bsum-stat-pct" style={{ background: accentColor }}>
              {totalPct.toFixed(0)}%
            </span>
          </div>
          <div className="bsum-stat bsum-stat--right">
            <span className="bsum-stat-label">Sisa</span>
            <span className="bsum-stat-val" style={{
              color: totalRemain < 0 ? 'var(--c-red-vivid)' : 'var(--c-green-vivid)'
            }}>
              {totalRemain < 0 ? '−' : '+'}{formatCurrency(Math.abs(totalRemain))}
            </span>
          </div>
        </div>

        <div className="bsum-master-bar-wrap">
          <div className="bsum-master-bar">
            <div className="bsum-master-fill" style={{ width: `${totalPct}%`, background: accentColor }} />
          </div>
          <div className="bsum-master-legend">
            {overCount > 0 && <span className="bsum-badge over">⚠ {overCount} melebihi batas</span>}
            {warnCount > 0 && <span className="bsum-badge warn">! {warnCount} mendekati batas</span>}
            {overCount === 0 && warnCount === 0 && <span className="bsum-badge ok">✓ Semua dalam batas</span>}
            <span className="bsum-badge-count">{rows.length} kategori</span>
          </div>
        </div>
      </div>

      {/* Detail table */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Detail per Kategori</div>
            <div className="dash-card-sub">Diurutkan dari persentase tertinggi · klik untuk lihat transaksi</div>
          </div>
        </div>

        <div className="bsum-table-head">
          <span className="bsum-th">Kategori</span>
          <span className="bsum-th">Progress</span>
          <span className="bsum-th bsum-th--num">Terpakai</span>
          <span className="bsum-th bsum-th--num">Anggaran</span>
          <span className="bsum-th bsum-th--num">Sisa</span>
        </div>

        <div className="bsum-rows">
          {rows.sort((a, b) => b.pct - a.pct).map(({ bud, cat, spent, remaining, pct, isOver, isWarn }) => {
            const rowAccent = isOver
              ? 'var(--c-red-vivid)'
              : isWarn
              ? 'var(--c-amber-mid)'
              : cat?.color || 'var(--c-green-vivid)';

            return (
              <div
                key={bud.id}
                className={`bsum-row ${isOver ? 'bsum-over' : isWarn ? 'bsum-warn' : ''}`}
                onClick={() => onCategoryClick(bud.categoryId)}
              >
                <div className="bsum-col-cat">
                  <span className="bsum-dot" style={{ background: cat?.color || '#888' }} />
                  <span className="bsum-cat-name">
                    {cat?.icon && <EmojiDisplay emoji={cat.icon} size={14} />}
                    {cat?.name || 'Unknown'}
                  </span>
                  {isOver && <span className="bsum-chip over">Melebihi</span>}
                  {isWarn && <span className="bsum-chip warn">Hampir</span>}
                  {bud.rollover && <span className="bsum-chip rollover">Rollover</span>}
                </div>

                <div className="bsum-col-bar">
                  <div className="bsum-bar-track">
                    <div className="bsum-bar-fill" style={{ width: `${pct}%`, background: rowAccent }} />
                  </div>
                  <span className="bsum-pct" style={{ color: rowAccent }}>{pct.toFixed(0)}%</span>
                </div>

                <div className="bsum-col-nums">
                  <div className="bsum-num-cell">
                    <span className="bsum-num-label">Terpakai</span>
                    <span className="bsum-num-val" style={{ color: 'var(--c-red)' }}>{formatCurrency(spent)}</span>
                  </div>
                  <div className="bsum-num-cell">
                    <span className="bsum-num-label">Anggaran</span>
                    <span className="bsum-num-val">{formatCurrency(bud.amount)}</span>
                  </div>
                  <div className="bsum-num-cell">
                    <span className="bsum-num-label">Sisa</span>
                    <span className="bsum-num-val" style={{
                      color: remaining < 0 ? 'var(--c-red)' : 'var(--c-green)'
                    }}>
                      {remaining < 0 ? '−' : ''}{formatCurrency(Math.abs(remaining))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const {
    selectedPeriod, setSelectedPeriod,
    expenses, incomes, totalIncome, totalExpense, netCashFlow,
    accounts, budgets, categories, transactions, recurringPayments, savings, debts,
    updateTransaction, deleteTransaction,
  } = useApp();

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editTx, setEditTx]   = useState(null);
  const [detailModal, setDetailModal] = useState({ open: false, title: '', txs: [] });

  /* ── Period ─────────────────────────────────────────── */
  const now          = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const firstDay     = `${currentMonth}-01`;
  const lastDay      = `${currentMonth}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  const [dateMode,      setDateMode]      = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reportDateRange, setReportDateRange] = useState({ from: firstDay, to: lastDay });

  useEffect(() => {
    if (dateMode === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const first = `${selectedMonth}-01`;
      const last  = `${selectedMonth}-${new Date(year, month, 0).getDate()}`;
      setReportDateRange({ from: first, to: last });
    }
  }, [selectedMonth, dateMode]);

  /* ── Report txs ─────────────────────────────────────── */
  const reportTxs = useMemo(
    () => transactions.filter(tx => tx.date >= reportDateRange.from && tx.date <= reportDateRange.to),
    [transactions, reportDateRange]
  );

  const reportIncome  = reportTxs.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
  const reportExpense = reportTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  /* ── Yearly chart data ──────────────────────────────── */
  const yearlyData = useMemo(() => {
    const year = new Date(reportDateRange.from).getFullYear();
    const result = [];
    for (let i = 0; i < 12; i++) {
      const { start, end } = getMonthRange(year, i + 1);
      const mTxs = transactions.filter(t => t.date >= start && t.date <= end);
      const inc  = mTxs.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
      const exp  = mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      if (inc > 0 || exp > 0) {
        result.push({
          name: format(new Date(year, i, 1), 'MMM', { locale: localeId }),
          Pemasukan: inc,
          Pengeluaran: exp,
          'Arus Kas': inc - exp,
        });
      }
    }
    return result;
  }, [transactions, reportDateRange]);

  /* ── Previous month ─────────────────────────────────── */
  const curDate  = new Date(reportDateRange.from);
  const prevMonth = getPreviousMonth(curDate.getFullYear(), curDate.getMonth() + 1);
  const prevRange = getMonthRange(prevMonth.year, prevMonth.month);
  const prevMonthTxs = transactions.filter(t => t.date >= prevRange.start && t.date <= prevRange.end);
  const prevIncome   = prevMonthTxs.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
  const prevExpense  = prevMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  /* ── Budget & balance ───────────────────────────────── */
  const budgetMonth   = curDate.getMonth() + 1;
  const budgetYear    = curDate.getFullYear();
  const totalBudget   = budgets
    .filter(b => b.year === budgetYear && b.month === budgetMonth)
    .reduce((s, b) => s + b.amount, 0);
  const remainingBudget = totalBudget - totalExpense;
  const totalBalance    = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  /* ── Income trend badge ─────────────────────────────── */
  const incomeDelta = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0;
  const expenseDelta = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;

  /* ── Category comparison ────────────────────────────── */
  const categoryComparison = useMemo(() => {
    const thisMap = {}, prevMap = {};
    reportTxs.filter(t => t.type === 'expense').forEach(t => {
      thisMap[t.categoryId] = (thisMap[t.categoryId] || 0) + t.amount;
    });
    prevMonthTxs.filter(t => t.type === 'expense').forEach(t => {
      prevMap[t.categoryId] = (prevMap[t.categoryId] || 0) + t.amount;
    });
    const allIds = new Set([...Object.keys(thisMap), ...Object.keys(prevMap)]);
    return Array.from(allIds)
      .map(id => {
        const cat   = categories.find(c => c.id === id);
        const curr  = thisMap[id] || 0;
        const prev  = prevMap[id] || 0;
        const delta = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
        return { id, name: cat?.name || 'Unknown', color: cat?.color || '#888', icon: cat?.icon || '📂', curr, prev, delta };
      })
      .filter(d => d.curr > 0 || d.prev > 0)
      .sort((a, b) => b.curr - a.curr)
      .slice(0, 6);
  }, [reportTxs, prevMonthTxs, categories]);

  /* ── Health score ───────────────────────────────────── */
  const healthRatio = useMemo(() => {
    const liquid         = accounts.filter(a => a.type !== 'investment').reduce((s, a) => s + Math.max(0, a.balance || 0), 0);
    const monthlyExp     = prevExpense || totalExpense || 1;
    const emergencyRatio = (liquid / monthlyExp) * 100;
    const monthlyDebt    = debts.filter(d => !d.isPaid).reduce((s, d) => s + (d.monthlyPayment || 0), 0);
    const debtToIncome   = totalIncome > 0 ? (monthlyDebt / totalIncome) * 100 : 0;
    const savingsAmt     = transactions
      .filter(t => t.type === 'expense' && t.categoryId === 'cat-8')
      .reduce((s, t) => s + t.amount, 0);
    const savingsRatio   = totalIncome > 0 ? (savingsAmt / totalIncome) * 100 : 0;

    let score = 50;
    score += Math.min(20, (emergencyRatio / 600) * 20);
    score -= Math.min(20, (debtToIncome / 30) * 20);
    score += Math.min(20, (savingsRatio / 20) * 20);
    if (netCashFlow > 0) score += 10;
    score = Math.max(0, Math.min(100, Math.round(score)));

    let recommendation = '';
    if (score >= 80)      recommendation = 'Keuangan Anda sangat sehat! Pertahankan.';
    else if (score >= 60) recommendation = 'Cukup baik — tingkatkan tabungan Anda.';
    else if (score >= 40) recommendation = 'Perlu perbaikan: kurangi utang & tambah tabungan.';
    else                  recommendation = 'Perhatian! Dana darurat & utang perlu dikelola.';

    const scoreClass = score >= 60 ? 'good' : score >= 40 ? 'warn' : 'danger';
    return {
      score, scoreClass, recommendation,
      emergencyRatio: emergencyRatio.toFixed(1),
      debtToIncome:   debtToIncome.toFixed(1),
      savingsRatio:   savingsRatio.toFixed(1),
    };
  }, [accounts, debts, transactions, totalIncome, totalExpense, netCashFlow, prevExpense]);

  /* ── Cash flow projection ───────────────────────────── */
  const cashFlowProjection = useMemo(() => {
    const avg    = totalIncome - totalExpense;
    const labels = ['Sekarang', '+1 Bulan', '+2 Bulan', '+3 Bulan'];
    let cur      = totalBalance;
    return labels.map((label, i) => {
      const val = Math.round(cur + avg * i);
      cur = val;
      return { month: label, saldo: val };
    });
  }, [totalBalance, totalIncome, totalExpense]);

  /* ── Anomaly detection ──────────────────────────────── */
  const anomalies = useMemo(() => {
    const catTotals = {};
    expenses.forEach(t => { catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + t.amount; });
    const vals = Object.values(catTotals);
    if (vals.length < 2) return [];
    const mean   = vals.reduce((s, v) => s + v, 0) / vals.length;
    const stdDev = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
    if (stdDev === 0) return [];
    return Object.entries(catTotals)
      .filter(([, val]) => val > mean + 2 * stdDev)
      .map(([catId, val]) => {
        const cat = categories.find(c => c.id === catId);
        return { name: cat?.name || 'Unknown', amount: val, threshold: Math.round(mean + 2 * stdDev) };
      });
  }, [expenses, categories]);

  /* ── Recurring ──────────────────────────────────────── */
  const paidCount = recurringPayments.filter(r => r.isPaid).length;

  /* ── Report breakdown ───────────────────────────────── */
  const expenseByCategory = useMemo(() => {
    const map = {};
    reportTxs.filter(t => t.type === 'expense').forEach(tx => {
      if (!map[tx.categoryId]) map[tx.categoryId] = { categoryId: tx.categoryId, total: 0, count: 0 };
      map[tx.categoryId].total += tx.amount;
      map[tx.categoryId].count += 1;
    });
    return Object.values(map).map(item => {
      const cat   = categories.find(c => c.id === item.categoryId);
      const group = cat?.categoryGroup || 'kebutuhan';
      return {
        ...item,
        name: cat?.name || 'Unknown',
        color: cat?.color || '#888',
        icon:  cat?.icon || '📂',
        group,
        groupLabel: GROUP_CONFIG[group]?.label || group,
        groupColor: GROUP_CONFIG[group]?.color || '#2563eb',
        groupEmoji: GROUP_CONFIG[group]?.emoji || '📂',
      };
    });
  }, [reportTxs, categories]);

  const expenseGroupHeader = useMemo(() => {
    const groups = {};
    expenseByCategory.forEach(item => {
      const g = item.group;
      if (!groups[g]) groups[g] = { label: item.groupLabel, emoji: item.groupEmoji, color: item.groupColor, total: 0 };
      groups[g].total += item.total;
    });
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [expenseByCategory]);

  const incomeByCategory = useMemo(() => {
    const map = {};
    reportTxs.filter(t => t.type === 'income').forEach(t => {
      if (!map[t.categoryId]) map[t.categoryId] = { categoryId: t.categoryId, total: 0 };
      map[t.categoryId].total += t.amount;
    });
    return Object.values(map).map(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      return { ...item, name: cat?.name || 'Unknown', color: cat?.color || '#888', icon: cat?.icon || '📂' };
    }).sort((a, b) => b.total - a.total);
  }, [reportTxs, categories]);

  /* ── Handlers ───────────────────────────────────────── */
  const handleEditTransaction = (tx) => {
    setEditTx(tx);
    setShowTransactionForm(true);
    setDetailModal({ open: false, title: '', txs: [] });
  };

  /* ── Exports ────────────────────────────────────────── */
  const exportCSV = () => {
    const headers = ['Tanggal','Tipe','Kategori','Subkategori','Nominal','Akun','Catatan'];
    const rows = reportTxs.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const sub = cat?.subcategories?.find(s => s.id === tx.subcategoryId);
      const acc = accounts.find(a => a.id === tx.accountId);
      return [tx.date, tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        cat?.name || '-', sub?.name || '-', tx.amount, acc?.name || '-', tx.note || ''];
    });
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(blob);
    link.download = `laporan_${reportDateRange.from}_${reportDateRange.to}.csv`;
    link.click();
  };

  const exportExcel = () => {
    const data = reportTxs.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const sub = cat?.subcategories?.find(s => s.id === tx.subcategoryId);
      const acc = accounts.find(a => a.id === tx.accountId);
      return {
        Tanggal: tx.date, Tipe: tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        Kategori: cat?.name || '-', Subkategori: sub?.name || '-',
        Nominal: tx.amount, Akun: acc?.name || '-', Catatan: tx.note || '',
      };
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
    doc.text(`Saldo Bersih: ${formatCurrency(reportIncome - reportExpense)}`, 14, 49);
    const tableData = reportTxs.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      return [tx.date, cat?.name || '-', tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran', formatCurrency(tx.amount)];
    });
    doc.autoTable({ startY: 55, head: [['Tanggal','Kategori','Tipe','Nominal']], body: tableData });
    doc.save(`laporan_${reportDateRange.from}_${reportDateRange.to}.pdf`);
  };

  /* ══════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════ */
  return (
    <div className="dashboard">

      {/* ══ ZONA 1: KONDISI SEKARANG ══════════════════════ */}
      <ZoneHeader num={1} title="Kondisi Sekarang" desc="Posisi keuangan keluarga periode ini" />

      {/* Filter Bar */}
      <div className="filter-bar">
        <span className="filter-bar-icon"><Filter size={14} /></span>
        <div className="filter-mode-group">
          <button className={`filter-mode-btn${dateMode === 'month' ? ' active' : ''}`} onClick={() => setDateMode('month')}>Bulanan</button>
          <button className={`filter-mode-btn${dateMode === 'custom' ? ' active' : ''}`} onClick={() => setDateMode('custom')}>Custom</button>
        </div>

        <div className="filter-divider" />

        {dateMode === 'month' ? (
          <>
            <span className="filter-date-label">
              {format(new Date(reportDateRange.from), 'MMMM yyyy', { locale: localeId })}
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="filter-input"
            />
          </>
        ) : (
          <>
            <input type="date" value={reportDateRange.from} onChange={e => setReportDateRange(p => ({ ...p, from: e.target.value }))} className="filter-input" />
            <span className="filter-separator">–</span>
            <input type="date" value={reportDateRange.to}   onChange={e => setReportDateRange(p => ({ ...p, to: e.target.value }))}   className="filter-input" />
          </>
        )}

        <span className="filter-date-sub hide-mobile">{reportDateRange.from} · {reportDateRange.to}</span>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">

        {/* PRIMARY — Net Cash Flow */}
        <div className="stat-card stat-card-primary">
          <div className="stat-label">Arus Kas Bersih</div>
          <div className="stat-value stat-value-lg" style={{
            color: netCashFlow >= 0 ? 'var(--c-green-vivid)' : 'var(--c-red-vivid)'
          }}>
            {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
          </div>
          <div className="stat-sub">
            {netCashFlow >= 0
              ? '✓ Surplus — pengeluaran di bawah pemasukan'
              : '⚠ Defisit — pengeluaran melebihi pemasukan'}
          </div>
        </div>

        {/* Total Saldo */}
        <div className="stat-card stat-card-balance">
          <div className="stat-label">Total Saldo</div>
          <div className="stat-value">{formatCurrency(totalBalance)}</div>
          <div className="stat-sub">Gabungan {accounts.length} akun aktif</div>
        </div>

        {/* Pemasukan */}
        <div className="stat-card stat-card-income">
          {prevIncome > 0 && (
            <span className={`stat-trend-badge ${incomeDelta >= 0 ? 'up' : 'down'}`}>
              {incomeDelta >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(incomeDelta).toFixed(1)}%
            </span>
          )}
          <div className="stat-label">Pemasukan</div>
          <div className="stat-value income">{formatCurrency(totalIncome)}</div>
          <div className={`stat-sub ${prevIncome > 0 ? (totalIncome >= prevIncome ? 'up' : 'down') : ''}`}>
            {prevIncome > 0
              ? `${totalIncome >= prevIncome ? '↑' : '↓'} vs ${format(new Date(prevRange.start), 'MMM', { locale: localeId })}`
              : 'Periode ini'}
          </div>
        </div>

        {/* Sisa Anggaran */}
        <div className="stat-card stat-card-budget">
          <div className="stat-label">Sisa Anggaran</div>
          <div className={`stat-value ${remainingBudget >= 0 ? 'income' : 'expense'}`}>
            {formatCurrency(remainingBudget)}
          </div>
          <div className="stat-sub">
            {totalBudget > 0 ? `dari ${formatCurrency(totalBudget)}` : 'Belum ada budget'}
          </div>
        </div>
      </div>

      {/* Account List */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">Saldo per Akun</div>
            <div className="dash-card-sub">Rincian saldo di setiap akun aktif</div>
          </div>
        </div>
        <div className="account-list">
          {accounts.filter(a => a.isActive).map(acc => {
            const getIcon = (type) => {
              if (type === 'cash') return <Wallet size={15} />;
              if (type === 'bank') return <Building size={15} />;
              return <Smartphone size={15} />;
            };
            return (
              <div key={acc.id} className="account-row">
                <div className="account-row-icon">{getIcon(acc.type)}</div>
                <div className="account-row-name">{acc.name}</div>
                <div className="account-row-balance" style={{
                  color: (acc.balance || 0) >= 0 ? 'var(--c-green)' : 'var(--c-red)'
                }}>
                  {(acc.balance || 0) >= 0 ? '' : '−'}{formatCurrency(Math.abs(acc.balance || 0))}
                </div>
              </div>
            );
          })}
          <div className="account-row account-row-total">
            <div className="account-row-icon">∑</div>
            <div className="account-row-name">Total Saldo</div>
            <div className="account-row-balance" style={{
              color: totalBalance >= 0 ? 'var(--c-green-vivid)' : 'var(--c-red-vivid)'
            }}>
              {totalBalance >= 0 ? '' : '−'}{formatCurrency(Math.abs(totalBalance))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ ZONA 2: TREN & PERBANDINGAN ═══════════════════ */}
      <ZoneHeader num={2} title="Tren & Perbandingan" desc="Pola keuangan dari waktu ke waktu" />

      {/* Yearly Chart */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title">
              Grafik Tahunan — {new Date(reportDateRange.from).getFullYear()}
            </div>
            <div className="dash-card-sub">
              Hijau = pemasukan · Merah = pengeluaran · Garis ungu = arus kas bersih
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, flexShrink: 0 }} className="hide-mobile">
            {[
              { color: '#00c17b', label: 'Pemasukan' },
              { color: '#ff4757', label: 'Pengeluaran' },
              { color: '#4c6ef5', label: 'Arus Kas', line: true },
            ].map(({ color, label, line }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                {line
                  ? <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth="2.5" strokeLinecap="round" /></svg>
                  : <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: color }} />
                }
                <span style={{ color: 'var(--c-ink-3)', fontWeight: 500, fontFamily: 'var(--ff-mono)', fontSize: 10 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="dash-card-body">
          <div className="chart-area-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyData} barGap={4} barSize={18}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#00c17b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0a7c4e" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#ff4757" stopOpacity={1} />
                    <stop offset="100%" stopColor="#c0392b" stopOpacity={0.9} />
                  </linearGradient>
                  <filter id="lineGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.04)" />
                <XAxis
                  dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: '#9a9890', fontFamily: 'DM Mono', fontWeight: 500 }} dy={6}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#9a9890', fontFamily: 'DM Mono' }}
                  tickFormatter={fmt} width={44}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(76,110,245,0.05)', radius: 6 }} />
                <ReferenceLine y={0} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />
                <Bar dataKey="Pemasukan"   fill="url(#gInc)" radius={[6,6,2,2]} />
                <Bar dataKey="Pengeluaran" fill="url(#gExp)" radius={[6,6,2,2]} />
                <Line
                  type="monotoneX" dataKey="Arus Kas"
                  stroke="#4c6ef5" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#fff', stroke: '#4c6ef5', strokeWidth: 2.5 }}
                  activeDot={{ r: 7, fill: '#4c6ef5', stroke: '#fff', strokeWidth: 2 }}
                  filter="url(#lineGlow)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparison + Projection */}
      <div className="grid-2">

        {/* Category comparison */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Perbandingan Kategori</div>
              <div className="dash-card-sub">Bulan ini vs bulan lalu · ↑ = lebih boros</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              {[{ color: 'var(--c-ink)', label: 'Ini' }, { color: 'var(--c-ink-4)', label: 'Lalu' }].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--c-ink-3)' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="dash-card-body">
            {categoryComparison.length > 0 ? (
              <div className="cat-compare-list">
                {categoryComparison.map(item => {
                  const maxVal  = Math.max(item.curr, item.prev, 1);
                  const currPct = (item.curr / maxVal) * 100;
                  const prevPct = (item.prev / maxVal) * 100;
                  const up      = item.delta > 5;
                  const down    = item.delta < -5;
                  return (
                    <div key={item.id}>
                      <div className="cat-compare-header">
                        <div className="cat-compare-name">
                          <span className="cat-dot" style={{ background: item.color }} />
                          {item.name}
                        </div>
                        {item.prev > 0 && (
                          <span className={`cat-compare-delta ${up ? 'up' : down ? 'down' : ''}`}>
                            {up ? '↑' : down ? '↓' : '='} {Math.abs(item.delta).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="cat-bar-row">
                        <span className="cat-bar-label">Ini</span>
                        <div className="cat-bar-track">
                          <div className="cat-bar-fill" style={{ width: `${currPct}%`, background: 'var(--c-ink)' }} />
                        </div>
                        <span className="cat-bar-val">{fmt(item.curr)}</span>
                      </div>
                      <div className="cat-bar-row">
                        <span className="cat-bar-label">Lalu</span>
                        <div className="cat-bar-track">
                          <div className="cat-bar-fill" style={{ width: `${prevPct}%`, background: 'var(--c-ink-4)' }} />
                        </div>
                        <span className="cat-bar-val">{fmt(item.prev)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state">Belum ada data pengeluaran.</p>
            )}
          </div>
        </div>

        {/* Cash flow projection */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Proyeksi Arus Kas 3 Bulan</div>
              <div className="dash-card-sub">Estimasi berdasarkan rata-rata bulan ini</div>
            </div>
          </div>
          <div className="dash-card-body">
            <div className="projection-nodes">
              {cashFlowProjection.map((p, i) => (
                <Fragment key={p.month}>
                  <div className="projection-node">
                    <span className="projection-month">{p.month}</span>
                    <span className="projection-val">{fmt(Math.abs(p.saldo))}</span>
                  </div>
                  {i < cashFlowProjection.length - 1 && (
                    <span className="projection-arrow">→</span>
                  )}
                </Fragment>
              ))}
            </div>
            <div className="chart-area-wrap">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={cashFlowProjection} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gProjArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4c6ef5" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#4c6ef5" stopOpacity={0} />
                    </linearGradient>
                    <filter id="projGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: '#9a9890', fontFamily: 'DM Mono', fontWeight: 500 }} dy={4} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: '#9a9890', fontFamily: 'DM Mono' }}
                    tickFormatter={fmt} width={44} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(76,110,245,0.2)', strokeWidth: 1 }} />
                  <Area
                    type="monotoneX"
                    dataKey="saldo"
                    stroke="#4c6ef5"
                    strokeWidth={2.5}
                    fill="url(#gProjArea)"
                    dot={{ r: 5, fill: '#fff', stroke: '#4c6ef5', strokeWidth: 2.5 }}
                    activeDot={{ r: 8, fill: '#4c6ef5', stroke: '#fff', strokeWidth: 2.5 }}
                    name="Proyeksi Saldo"
                    filter="url(#projGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ZONA 3: LAPORAN BUDGET ════════════════════════ */}
      <ZoneHeader num={3} title="Laporan Budget" desc="Realisasi anggaran vs pengeluaran aktual" />

      <BudgetSummary
        budgets={budgets}
        categories={categories}
        expenses={expenses}
        reportDateRange={reportDateRange}
        onCategoryClick={(categoryId) => {
          const cat = categories.find(c => c.id === categoryId);
          const txs = expenses.filter(t => t.categoryId === categoryId &&
            t.date >= reportDateRange.from && t.date <= reportDateRange.to);
          setDetailModal({ open: true, title: `Detail: ${cat?.name}`, txs });
        }}
      />

      {/* ══ ZONA 4: PERINGATAN & AKSI ════════════════════ */}
      <ZoneHeader num={4} title="Peringatan & Aksi" desc="Hal yang perlu perhatian segera" />

      {anomalies.length > 0 && (
        <div className="anomaly-wrap">
          <div className="anomaly-head">
            <AlertTriangle size={14} />
            <span className="anomaly-head-title">Deteksi Anomali Pengeluaran</span>
          </div>
          <div className="anomaly-body">
            {anomalies.map((a, i) => (
              <div key={i} className="anomaly-item">
                <span className="anomaly-name">{a.name}</span>
                <span className="anomaly-amount">{formatCurrency(a.amount)}</span>
                <span className="anomaly-threshold">Batas normal: {formatCurrency(a.threshold)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">

        {/* Recurring payments */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Status Tagihan Rutin</div>
              <div className="dash-card-sub">Tagihan berulang — pastikan semua lunas sebelum jatuh tempo</div>
            </div>
            <span className="recurring-count">{paidCount}/{recurringPayments.length} lunas</span>
          </div>
          {recurringPayments.length === 0
            ? <p className="empty-state">Belum ada tagihan rutin.</p>
            : (
              <div className="recurring-list">
                {recurringPayments.map(rp => (
                  <div key={rp.id} className="recurring-item">
                    <div className={`recurring-dot ${rp.isPaid ? 'paid' : 'unpaid'}`} />
                    <div className="recurring-info">
                      <div className="recurring-name">{rp.name}</div>
                      <div className="recurring-due">Jatuh tempo: tgl {rp.dueDate}</div>
                    </div>
                    <span className={`recurring-badge ${rp.isPaid ? 'paid' : 'unpaid'}`}>
                      {rp.isPaid ? 'Lunas' : 'Belum'}
                    </span>
                    <span className="recurring-amount">{formatCurrency(rp.amount)}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Health Score */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Skor Kesehatan Keuangan</div>
              <div className="dash-card-sub">Dana darurat · beban utang · kebiasaan menabung · ideal ≥ 80</div>
            </div>
          </div>
          <div className="dash-card-body">
            <div className="health-score-row">
              <HealthCircle score={healthRatio.score} scoreClass={healthRatio.scoreClass} />
              <div>
                <div className="health-title">
                  {healthRatio.score >= 80 ? 'Sangat Sehat' : healthRatio.score >= 60 ? 'Cukup Baik' : healthRatio.score >= 40 ? 'Perlu Perhatian' : 'Kritis'}
                </div>
                <div className="health-rec">{healthRatio.recommendation}</div>
              </div>
            </div>

            {[
              { name: 'Dana Darurat',   val: `${healthRatio.emergencyRatio}% dari pengeluaran`, pct: Math.min(100, parseFloat(healthRatio.emergencyRatio) / 6),   color: 'var(--c-green-mid)', hint: 'Ideal ≥ 600%' },
              { name: 'Rasio Utang',    val: `${healthRatio.debtToIncome}% dari pendapatan`,    pct: Math.min(100, parseFloat(healthRatio.debtToIncome) / 0.5),   color: 'var(--c-amber-mid)', hint: 'Ideal < 30%' },
              { name: 'Rasio Tabungan', val: `${healthRatio.savingsRatio}% dari pendapatan`,    pct: Math.min(100, parseFloat(healthRatio.savingsRatio) / 0.2),   color: 'var(--c-blue-vivid)', hint: 'Ideal ≥ 20%' },
            ].map(m => (
              <div key={m.name} className="health-metric-row">
                <div className="health-metric-name">
                  {m.name}
                  <span className="health-metric-hint">{m.hint}</span>
                </div>
                <div className="health-metric-bar">
                  <div className="health-metric-bar-fill" style={{ width: `${m.pct}%`, background: m.color }} />
                </div>
                <div className="health-metric-val">{m.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ ZONA 5: LAPORAN & EKSPOR ══════════════════════ */}
      <ZoneHeader num={5} title="Laporan & Ekspor" desc="Cetak atau unduh laporan keuangan" />

      <section className="report-zone">
        <div className="report-top">
          <div>
            <div className="report-title">Laporan Keuangan Periode Ini</div>
            <div className="report-period">
              {reportDateRange.from} – {reportDateRange.to} · {reportTxs.length} transaksi
            </div>
          </div>
          <div className="export-btn-group">
            <Button variant="outline" size="sm" onClick={exportCSV}   icon={FileText}>CSV</Button>
            <Button variant="outline" size="sm" onClick={exportExcel} icon={FileSpreadsheet}>Excel</Button>
            <Button variant="outline" size="sm" onClick={exportPDF}   icon={File}>PDF</Button>
          </div>
        </div>

        {/* Summary tiles */}
        <div className="summary-row">
          <div className="summary-item">
            <div className="summary-label">Total Pemasukan</div>
            <div className="summary-value income">{formatCurrency(reportIncome)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Total Pengeluaran</div>
            <div className="summary-value expense">{formatCurrency(reportExpense)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Saldo Bersih</div>
            <div className={`summary-value ${reportIncome - reportExpense >= 0 ? 'income' : 'expense'}`}>
              {formatCurrency(reportIncome - reportExpense)}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Jumlah Transaksi</div>
            <div className="summary-value">{reportTxs.length}</div>
          </div>
        </div>

        {/* Tables */}
        <div className="grid-2">

          {/* Expense by category */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Pengeluaran per Kategori</div>
                <div className="dash-card-sub">Dikelompokkan: Kebutuhan · Keinginan · Tabungan</div>
              </div>
            </div>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th className="r">Total</th>
                    <th className="r hide-mobile">Tx</th>
                    <th className="r">Porsi</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseGroupHeader.map(grp => (
                    <Fragment key={grp.label}>
                      <tr className="group-header">
                        <td colSpan={4}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 15 }}>{grp.emoji}</span>
                            <span style={{ fontWeight: 700, color: grp.color, fontFamily: 'var(--ff-display)', fontSize: 12 }}>{grp.label}</span>
                            <span style={{ color: 'var(--c-ink-3)', fontSize: 11, fontFamily: 'var(--ff-mono)' }}>({formatCurrency(grp.total)})</span>
                          </div>
                        </td>
                      </tr>
                      {expenseByCategory
                        .filter(cat => cat.groupLabel === grp.label)
                        .sort((a, b) => b.total - a.total)
                        .map(item => (
                          <tr key={item.categoryId} onClick={() => {
                            const txs = reportTxs.filter(t => t.categoryId === item.categoryId);
                            setDetailModal({ open: true, title: `Detail: ${item.name}`, txs });
                          }}>
                            <td style={{ paddingLeft: 28 }}>
                              <span className="cat-dot-sm" style={{ background: item.color }} />
                              {item.name}
                            </td>
                            <td className="r td-mono">{formatCurrency(item.total)}</td>
                            <td className="r hide-mobile" style={{ color: 'var(--c-ink-3)', fontFamily: 'var(--ff-mono)' }}>{item.count}</td>
                            <td className="r">
                              <div className="pct-mini-wrap">
                                <div className="pct-mini-track">
                                  <div className="pct-mini-fill" style={{ width: `${reportExpense > 0 ? (item.total / reportExpense) * 100 : 0}%`, background: item.color }} />
                                </div>
                                <span className="pct-text">
                                  {reportExpense > 0 ? ((item.total / reportExpense) * 100).toFixed(1) : 0}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Income by category */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Pemasukan per Kategori</div>
                <div className="dash-card-sub">Sumber pendapatan dan porsinya</div>
              </div>
            </div>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th className="r">Total</th>
                    <th className="r">Porsi</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeByCategory.map(item => (
                    <tr key={item.categoryId} onClick={() => {
                      const txs = reportTxs.filter(t => t.categoryId === item.categoryId);
                      setDetailModal({ open: true, title: `Detail: ${item.name}`, txs });
                    }}>
                      <td>
                        <span className="cat-dot-sm" style={{ background: item.color }} />
                        {item.name}
                      </td>
                      <td className="r td-mono">{formatCurrency(item.total)}</td>
                      <td className="r">
                        <div className="pct-mini-wrap">
                          <div className="pct-mini-track">
                            <div className="pct-mini-fill" style={{ width: `${reportIncome > 0 ? (item.total / reportIncome) * 100 : 0}%`, background: item.color }} />
                          </div>
                          <span className="pct-text">
                            {reportIncome > 0 ? ((item.total / reportIncome) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
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