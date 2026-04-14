import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import TransactionDetailModal from '../components/TransactionDetailModal';
import TransactionForm from '../components/TransactionForm';
import { formatCurrency, formatDate, getMonthRange } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { format } from 'date-fns';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Reports.css';

export default function Reports() {
  const { transactions, categories, members, accounts, selectedPeriod, getPeriodTransactions } = useApp();
  const [dateRange, setDateRange] = useState({
    from: getMonthRange(selectedPeriod.year, selectedPeriod.month).start,
    to: getMonthRange(selectedPeriod.year, selectedPeriod.month).end,
  });
  const [detailModal, setDetailModal] = useState({ open: false, title: '', txs: [] });
  const [editTx, setEditTx] = useState(null);
  const [showTxForm, setShowTxForm] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => tx.date >= dateRange.from && tx.date <= dateRange.to);
  }, [transactions, dateRange]);

  const totalIncome = filteredTransactions.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = filteredTransactions.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

  // Category breakdown
  const expenseByCategory = useMemo(() => {
    const map = {};
    filteredTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
      if (!map[tx.categoryId]) map[tx.categoryId] = { categoryId: tx.categoryId, total: 0, count: 0 };
      map[tx.categoryId].total += tx.amount;
      map[tx.categoryId].count += 1;
    });
    return Object.values(map).map(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      return { ...item, name: cat?.name || 'Unknown', color: cat?.color || '#666' };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories]);

  const incomeByCategory = useMemo(() => {
    const map = {};
    filteredTransactions.filter(tx => tx.type === 'income').forEach(tx => {
      if (!map[tx.categoryId]) map[tx.categoryId] = { categoryId: tx.categoryId, total: 0 };
      map[tx.categoryId].total += tx.amount;
    });
    return Object.values(map).map(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      return { ...item, name: cat?.name || 'Unknown', color: cat?.color || '#666' };
    }).sort((a, b) => b.total - a.total);
  }, [filteredTransactions, categories]);

  // By member
  const byMember = useMemo(() => {
    const map = {};
    filteredTransactions.forEach(tx => {
      if (!map[tx.memberId]) map[tx.memberId] = { memberId: tx.memberId, income: 0, expense: 0 };
      if (tx.type === 'income') map[tx.memberId].income += tx.amount;
      else map[tx.memberId].expense += tx.amount;
    });
    return Object.values(map).map(item => {
      const member = members.find(m => m.id === item.memberId);
      return { ...item, name: member?.name || 'Unknown' };
    });
  }, [filteredTransactions, members]);

  // By account
  const byAccount = useMemo(() => {
    const map = {};
    filteredTransactions.forEach(tx => {
      if (!map[tx.accountId]) map[tx.accountId] = { accountId: tx.accountId, total: 0 };
      map[tx.accountId].total += tx.type === 'income' ? tx.amount : -tx.amount;
    });
    return Object.values(map).map(item => {
      const acc = accounts.find(a => a.id === item.accountId);
      return { ...item, name: acc?.name || 'Unknown' };
    });
  }, [filteredTransactions, accounts]);

  const handleCategoryClick = (categoryId, type) => {
    const cat = categories.find(c => c.id === categoryId);
    const txs = filteredTransactions.filter(tx => tx.categoryId === categoryId);
    setDetailModal({ open: true, title: `Detail: ${cat?.name}`, txs });
  };

  // Export functions
  const exportCSV = () => {
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Subkategori', 'Nominal', 'Akun', 'Anggota', 'Catatan'];
    const rows = filteredTransactions.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const sub = cat?.subcategories?.find(s => s.id === tx.subcategoryId);
      const acc = accounts.find(a => a.id === tx.accountId);
      const member = members.find(m => m.id === tx.memberId);
      return [
        tx.date,
        tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        cat?.name || '-',
        sub?.name || '-',
        tx.amount,
        acc?.name || '-',
        member?.name || '-',
        tx.note || '',
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_${dateRange.from}_${dateRange.to}.csv`;
    link.click();
  };

  const exportExcel = () => {
    const data = filteredTransactions.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      const sub = cat?.subcategories?.find(s => s.id === tx.subcategoryId);
      const acc = accounts.find(a => a.id === tx.accountId);
      const member = members.find(m => m.id === tx.memberId);
      return {
        Tanggal: tx.date,
        Tipe: tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        Kategori: cat?.name || '-',
        Subkategori: sub?.name || '-',
        Nominal: tx.amount,
        Akun: acc?.name || '-',
        Anggota: member?.name || '-',
        Catatan: tx.note || '',
      };
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Laporan');
    writeFile(wb, `laporan_${dateRange.from}_${dateRange.to}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Laporan Keuangan Keluarga', 14, 20);
    doc.setFontSize(10);
    doc.text(`Periode: ${dateRange.from} s/d ${dateRange.to}`, 14, 28);
    doc.text(`Total Pemasukan: ${formatCurrency(totalIncome)}`, 14, 35);
    doc.text(`Total Pengeluaran: ${formatCurrency(totalExpense)}`, 14, 42);
    doc.text(`Saldo: ${formatCurrency(totalIncome - totalExpense)}`, 14, 49);

    const tableData = filteredTransactions.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId);
      return [tx.date, cat?.name || '-', tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran', formatCurrency(tx.amount)];
    });

    doc.autoTable({
      startY: 55,
      head: [['Tanggal', 'Kategori', 'Tipe', 'Nominal']],
      body: tableData,
    });

    doc.save(`laporan_${dateRange.from}_${dateRange.to}.pdf`);
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Laporan Keuangan</h1>
        <div className="export-buttons">
          <Button variant="outline" size="sm" onClick={exportCSV} icon={FileText}>CSV</Button>
          <Button variant="outline" size="sm" onClick={exportExcel} icon={FileSpreadsheet}>Excel</Button>
          <Button variant="outline" size="sm" onClick={exportPDF} icon={File}>PDF</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="date-filter">
            <input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="filter-select"
            />
            <span>sampai</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="filter-select"
            />
          </div>
        </CardBody>
      </Card>

      <div className="report-summary">
        <Card>
          <CardBody className="summary-card">
            <div className="summary-item">
              <span className="summary-label">Total Pemasukan</span>
              <span className="summary-value income">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Pengeluaran</span>
              <span className="summary-value expense">{formatCurrency(totalExpense)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Saldo</span>
              <span className={`summary-value ${totalIncome - totalExpense >= 0 ? 'income' : 'expense'}`}>
                {formatCurrency(totalIncome - totalExpense)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Jumlah Transaksi</span>
              <span className="summary-value">{filteredTransactions.length}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="report-charts">
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardBody>
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expenseByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Bar dataKey="total" fill="var(--danger)" onClick={(data) => {
                    const cat = categories.find(c => c.name === data.name);
                    if (cat) handleCategoryClick(cat.id, 'expense');
                  }} style={{ cursor: 'pointer' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-chart">Tidak ada data.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Pengeluaran</CardTitle>
          </CardHeader>
          <CardBody>
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="total"
                    onClick={(data) => handleCategoryClick(data.categoryId, 'expense')}
                    style={{ cursor: 'pointer' }}
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty-chart">Tidak ada data.</p>
            )}
          </CardBody>
        </Card>
      </div>

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
                  <tr key={item.categoryId} onClick={() => handleCategoryClick(item.categoryId, 'expense')}>
                    <td>
                      <span className="cat-dot" style={{ background: item.color }}></span>
                      {item.name}
                    </td>
                    <td className="text-right">{formatCurrency(item.total)}</td>
                    <td className="text-right">{item.count}</td>
                    <td className="text-right">{totalExpense > 0 ? (item.total / totalExpense * 100).toFixed(1) : 0}%</td>
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
                  <tr key={item.categoryId} onClick={() => handleCategoryClick(item.categoryId, 'income')}>
                    <td>
                      <span className="cat-dot" style={{ background: item.color }}></span>
                      {item.name}
                    </td>
                    <td className="text-right">{formatCurrency(item.total)}</td>
                    <td className="text-right">{totalIncome > 0 ? (item.total / totalIncome * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {byMember.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan per Anggota</CardTitle>
            </CardHeader>
            <CardBody>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Anggota</th>
                    <th className="text-right">Pemasukan</th>
                    <th className="text-right">Pengeluaran</th>
                  </tr>
                </thead>
                <tbody>
                  {byMember.map(item => (
                    <tr key={item.memberId}>
                      <td>{item.name}</td>
                      <td className="text-right income">{formatCurrency(item.income)}</td>
                      <td className="text-right expense">{formatCurrency(item.expense)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}

        {byAccount.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan per Akun</CardTitle>
            </CardHeader>
            <CardBody>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Akun</th>
                    <th className="text-right">Arus Kas</th>
                  </tr>
                </thead>
                <tbody>
                  {byAccount.map(item => (
                    <tr key={item.accountId}>
                      <td>{item.name}</td>
                      <td className={`text-right ${item.total >= 0 ? 'income' : 'expense'}`}>
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}
      </div>

      <TransactionDetailModal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, title: '', txs: [] })}
        transactions={detailModal.txs}
        title={detailModal.title}
        onEdit={(tx) => {
          setEditTx(tx);
          setShowTxForm(true);
          setDetailModal({ open: false, title: '', txs: [] });
        }}
      />

      <TransactionForm
        isOpen={showTxForm}
        onClose={() => { setShowTxForm(false); setEditTx(null); }}
        editTransaction={editTx}
      />
    </div>
  );
}
