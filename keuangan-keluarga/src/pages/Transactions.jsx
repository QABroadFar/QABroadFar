import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle } from '../components/Card';
import Button from '../components/Button';
import TransactionForm from '../components/TransactionForm';
import BulkTransactionForm from '../components/BulkTransactionForm';
import { formatCurrency, formatDate } from '../utils/helpers';
import { 
  Plus, Edit, Trash2, Search, Filter, Layers,
  Utensils, Car, FileText, Heart, BookOpen, Gamepad2,
  ShoppingBag, PiggyBank, Briefcase, Store, MoreHorizontal
} from 'lucide-react';
import './Transactions.css';

export default function Transactions() {
  const { transactions, categories, accounts, deleteTransaction } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editTx, setEditTx] = useState(null);
  // Get current month dates
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const firstDay = `${currentMonth}-01`;
  const lastDay = `${currentMonth}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  const [dateMode, setDateMode] = useState('month'); // 'month' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    categoryId: '',
    accountId: '',
    dateFrom: firstDay,
    dateTo: lastDay,
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filters.type && tx.type !== filters.type) return false;
      if (filters.categoryId && tx.categoryId !== filters.categoryId) return false;
      if (filters.accountId && tx.accountId !== filters.accountId) return false;
      if (filters.dateFrom && tx.date < filters.dateFrom) return false;
      if (filters.dateTo && tx.date > filters.dateTo) return false;
      if (filters.search) {
        const cat = categories.find(c => c.id === tx.categoryId);
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          cat?.name.toLowerCase().includes(searchLower) ||
          tx.note?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filters, categories]);

  const handleEdit = (tx) => {
    setEditTx(tx);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus transaksi ini?')) {
      deleteTransaction(id);
    }
  };

  const getCategoryInfo = (id) => categories.find(c => c.id === id) || {};
  const getAccountInfo = (id) => accounts.find(a => a.id === id) || {};

  // Auto update date range when month changes
  useEffect(() => {
    if (dateMode === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const first = `${selectedMonth}-01`;
      const last = `${selectedMonth}-${new Date(year, month, 0).getDate()}`;
      setFilters(prev => ({ ...prev, dateFrom: first, dateTo: last }));
    }
  }, [selectedMonth, dateMode]);

  const totalFiltered = filteredTransactions.reduce((s, tx) => {
    return tx.type === 'income' ? s + tx.amount : s - tx.amount;
  }, 0);

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Riwayat Transaksi</h1>
        <div className="header-buttons">
          <Button variant="secondary" onClick={() => setShowBulkForm(true)} icon={Layers}>
            Import Bulk
          </Button>
          <Button variant="primary" onClick={() => { setEditTx(null); setShowForm(true); }} icon={Plus}>
            Tambah Transaksi
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle><Filter size={18} /> Filter</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="filter-grid">
            <div className="filter-item">
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            <select
              value={filters.type}
              onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="filter-select"
            >
              <option value="">Semua Tipe</option>
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
            <select
              value={filters.categoryId}
              onChange={e => setFilters(prev => ({ ...prev, categoryId: e.target.value }))}
              className="filter-select"
            >
              <option value="">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
             <select
              value={filters.accountId}
              onChange={e => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
              className="filter-select"
            >
              <option value="">Semua Akun</option>
              {accounts.filter(a => a.isActive).map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            
            <select
              value={dateMode}
              onChange={e => setDateMode(e.target.value)}
              className="filter-select"
            >
              <option value="month">Bulanan</option>
              <option value="custom">Custom Tanggal</option>
            </select>

            {dateMode === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="filter-select"
              />
            )}

            {dateMode === 'custom' && (
              <>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="filter-select"
                  placeholder="Dari tanggal"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="filter-select"
                  placeholder="Sampai tanggal"
                />
              </>
            )}
            <button
              className="clear-filters-btn"
              onClick={() => setFilters({
                search: '',
                type: '',
                categoryId: '',
                accountId: '',
                dateFrom: '',
                dateTo: '',
              })}
            >
              Reset
            </button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{filteredTransactions.length} Transaksi</CardTitle>
          <span className={`total-filtered ${totalFiltered >= 0 ? 'positive' : 'negative'}`}>
            Net: {formatCurrency(totalFiltered)}
          </span>
        </CardHeader>
        <CardBody>
          {filteredTransactions.length === 0 ? (
            <p className="empty-state">Tidak ada transaksi ditemukan.</p>
          ) : (
            <div className="tx-table-wrapper">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Kategori</th>
                    <th>Akun</th>
                    <th>Catatan</th>
                    <th className="text-right">Nominal</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                 <tbody>
                   {filteredTransactions.map(tx => {
                     const cat = getCategoryInfo(tx.categoryId);
                     const acc = getAccountInfo(tx.accountId);
                     // Icon mapping
                     const iconMap = {
                       'utensils': Utensils,
                       'car': Car,
                       'file-text': FileText,
                       'heart': Heart,
                       'book-open': BookOpen,
                       'gamepad-2': Gamepad2,
                       'shopping-bag': ShoppingBag,
                       'piggy-bank': PiggyBank,
                       'briefcase': Briefcase,
                       'store': Store,
                       'more-horizontal': MoreHorizontal
                     };
                     const IconComponent = cat.icon ? iconMap[cat.icon] : null;
                     return (
                       <tr key={tx.id}>
                         <td>{formatDate(tx.date)}</td>
                         <td>
                           <span className="cat-badge">
                             <span className="cat-icon" style={{ background: cat.color || '#666' }}>
                               {IconComponent && <IconComponent size={14} color="white" />}
                             </span>
                             {cat.name || '-'}
                           </span>
                         </td>
                        <td>{acc.name || '-'}</td>
                        <td className="note-cell">{tx.note || '-'}</td>
                        <td className={`text-right ${tx.type === 'income' ? 'income' : 'expense'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="text-center actions-cell">
                          <button className="icon-btn" onClick={() => handleEdit(tx)} title="Edit">
                            <Edit size={14} />
                          </button>
                          <button className="icon-btn danger" onClick={() => handleDelete(tx.id)} title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <TransactionForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditTx(null); }}
        editTransaction={editTx}
      />

      <BulkTransactionForm
        isOpen={showBulkForm}
        onClose={() => setShowBulkForm(false)}
      />
    </div>
  );
}
