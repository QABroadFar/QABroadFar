import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle } from '../components/Card';
import Button from '../components/Button';
import TransactionForm from '../components/TransactionForm';
import TransferForm from '../components/TransferForm';
import BulkTransactionForm from '../components/BulkTransactionForm';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  Plus, Edit, Trash2, Search, Filter, Layers, ArrowRightLeft,
} from 'lucide-react';
import { EmojiDisplay } from '../components/IconPicker';
import './Transactions.css';

/* ─── ZoneHeader ─────────────────────────────────────────── */
const ZoneHeader = ({ num, title, desc }) => (
  <div className={`zone-header zone-header--${num}`}>
    <span className="zone-num">ZONA {num}</span>
    <span className="zone-title">{title}</span>
    <span className="zone-desc">{desc}</span>
  </div>
);

export default function Transactions() {
  const {
    transactions,
    accounts,
    categories,
    deleteTransaction,
    addTransaction,
    updateTransaction,
  } = useApp();

  const [showForm, setShowForm]           = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showBulkForm, setShowBulkForm]   = useState(false);
  const [editTx, setEditTx]               = useState(null);

  /* ── Date setup ─────────────────────────────────────────── */
  const now          = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const firstDay     = `${currentMonth}-01`;
  const lastDay      = `${currentMonth}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;

  const [dateMode, setDateMode]           = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [filters, setFilters]             = useState({
    search:     '',
    type:       '',
    categoryId: '',
    accountId:  '',
    dateFrom:   firstDay,
    dateTo:     lastDay,
  });

  useEffect(() => {
    if (dateMode === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const first = `${selectedMonth}-01`;
      const last  = `${selectedMonth}-${new Date(year, month, 0).getDate()}`;
      setFilters(prev => ({ ...prev, dateFrom: first, dateTo: last }));
    }
  }, [selectedMonth, dateMode]);

  /* ── Helpers ─────────────────────────────────────────────── */
  const getCategoryInfo = (categoryId) =>
    categories.find(c => c.id === categoryId) || {};

  /* ── Filtered transactions (logic unchanged) ─────────────── */
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        if (filters.type       && tx.type       !== filters.type)       return false;
        if (filters.categoryId && tx.categoryId !== filters.categoryId) return false;
        if (filters.accountId  && tx.accountId  !== filters.accountId)  return false;
        if (filters.dateFrom   && tx.date < filters.dateFrom)           return false;
        if (filters.dateTo     && tx.date > filters.dateTo)             return false;
        if (filters.search) {
          const cat         = getCategoryInfo(tx.categoryId);
          const searchLower = filters.search.toLowerCase();
          const matches     =
            cat?.name?.toLowerCase().includes(searchLower) ||
            tx.note?.toLowerCase().includes(searchLower) ||
            (tx.type === 'transfer' && 'transfer'.includes(searchLower));
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filters, transactions, categories]);

  const totalFiltered = filteredTransactions.reduce((s, tx) => {
    if (tx.type === 'income') return s + tx.amount;
    if (tx.type === 'expense') return s - tx.amount;
    return s; // Transfer tidak mempengaruhi total
  }, 0);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="transactions-page">

      {/* ── Page header ── */}
      <div className="page-header">
        <h1>Riwayat Transaksi</h1>
        <div className="header-buttons">
          <Button variant="secondary" onClick={() => setShowBulkForm(true)} icon={Layers}>
            Import Bulk
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowTransferForm(true)} 
            icon={ArrowRightLeft}
          >
            Transfer
          </Button>
          <Button
            variant="primary"
            onClick={() => { setEditTx(null); setShowForm(true); }}
            icon={Plus}
          >
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* ── Filter card ── */}
      <Card>
        <CardHeader>
          <CardTitle><Filter size={16} /> Filter Transaksi</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="filter-grid">

            {/* Search — spans full width on 2-col layout */}
            <div className="filter-item filter-item--search">
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Cari kategori atau catatan…"
                  value={filters.search}
                  onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                />
              </div>
            </div>

            {/* Type */}
            <div className="filter-item">
              <select
                className="form-control"
                value={filters.type}
                onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
              >
                <option value="">Semua Tipe</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            {/* Category */}
            <div className="filter-item">
              <select
                className="form-control"
                value={filters.categoryId}
                onChange={e => setFilters(p => ({ ...p, categoryId: e.target.value }))}
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Account */}
            <div className="filter-item">
              <select
                className="form-control"
                value={filters.accountId}
                onChange={e => setFilters(p => ({ ...p, accountId: e.target.value }))}
              >
                <option value="">Semua Akun</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>

            {/* Date range — grouped together */}
            <div className="filter-item filter-item--dates">
              <input
                type="date"
                className="form-control"
                value={filters.dateFrom}
                onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))}
              />
              <span className="filter-date-sep" aria-hidden="true">–</span>
              <input
                type="date"
                className="form-control"
                value={filters.dateTo}
                onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))}
              />
            </div>

          </div>
        </CardBody>
      </Card>

      {/* ── Transaction table card ── */}
      <Card>
        <CardHeader>
          <ZoneHeader
            num={1}
            title={`Total Transaksi (${filteredTransactions.length})`}
            desc={`Periode ${formatDate(filters.dateFrom)} – ${formatDate(filters.dateTo)}`}
          />
          {filteredTransactions.length > 0 && (
            <span className={`total-filtered ${totalFiltered >= 0 ? 'positive' : 'negative'}`}>
              {totalFiltered >= 0 ? '+' : ''}{formatCurrency(totalFiltered)}
            </span>
          )}
        </CardHeader>
        <CardBody style={{ padding: 0 }}>
          {filteredTransactions.length === 0 ? (
            <div className="tx-empty">
              <div className="tx-empty-icon">🔍</div>
              <div className="tx-empty-text">Tidak ada transaksi ditemukan.</div>
            </div>
          ) : (
            <div className="tx-table-wrapper">
              <table className="tx-table">
                <thead>
                  <tr>
                    <th className="bsum-th bsum-th--date">Tanggal</th>
                    <th className="bsum-th bsum-th--category">Kategori</th>
                    <th className="bsum-th bsum-th--account">Akun</th>
                    <th className="bsum-th bsum-th--note">Catatan</th>
                    <th className="bsum-th bsum-th--amount text-right">Jumlah</th>
                    <th className="bsum-th bsum-th--actions text-center">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tx => {
                    const cat = getCategoryInfo(tx.categoryId);
                    const fromAcc = accounts.find(a => a.id === tx.fromAccountId);
                    const toAcc = accounts.find(a => a.id === tx.toAccountId);
                    const acc = accounts.find(a => a.id === tx.accountId);
                    const sub = cat?.subcategories?.find(s => s.id === tx.subcategoryId);

                    return (
                      <tr key={tx.id}>
                        <td data-label="Tanggal">
                          {formatDate(tx.date)}
                        </td>

                        <td data-label="Kategori">
                          {tx.type === 'transfer' ? (
                            <span className="cat-badge">
                              <span
                                className="cat-icon"
                                style={{ background: 'var(--tx-surface2)' }}
                              >
                                ↔️
                              </span>
                              Transfer
                            </span>
                          ) : (
                            <span className="cat-badge">
                              <span
                                className="cat-icon"
                                style={{ background: cat?.color ? `${cat.color}22` : 'var(--tx-surface2)' }}
                              >
                                <EmojiDisplay emoji={cat.icon} size={13} />
                              </span>
                              {cat.name || '—'}
                              {sub && (
                                <span style={{ color: 'var(--tx-text3)', fontSize: 11 }}>
                                  {' '}→ {sub.name}
                                </span>
                              )}
                            </span>
                          )}
                        </td>

                        <td data-label="Akun">
                          {tx.type === 'transfer' ? (
                            <span>
                              {fromAcc?.name} → {toAcc?.name}
                            </span>
                          ) : (
                            acc?.name || '—'
                          )}
                        </td>

                        <td data-label="Catatan" className="note-cell">
                          {tx.note || '—'}
                        </td>

                        <td
                          data-label="Jumlah"
                          className={`text-right amount ${tx.type === 'income' ? 'income' : tx.type === 'expense' ? 'expense' : ''}`}
                          style={tx.type === 'transfer' ? { color: 'var(--tx-text2)' } : {}}
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}{formatCurrency(tx.amount)}
                        </td>

                        <td className="actions-cell text-center">
                          {tx.type !== 'transfer' && (
                            <>
                              <button
                                className="icon-btn"
                                onClick={() => { setEditTx(tx); setShowForm(true); }}
                                title="Edit transaksi"
                                aria-label="Edit transaksi"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="icon-btn danger"
                                onClick={() => deleteTransaction(tx.id)}
                                title="Hapus transaksi"
                                aria-label="Hapus transaksi"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          {tx.type === 'transfer' && (
                            <span style={{ fontSize: '11px', color: 'var(--tx-text3)' }}>Transfer</span>
                          )}
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

      {/* ── Modals ── */}
      {showForm && (
        <TransactionForm
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditTx(null); }}
          editTransaction={editTx}
          prefill={filters}
        />
      )}
      {showTransferForm && (
        <TransferForm
          isOpen={showTransferForm}
          onClose={() => setShowTransferForm(false)}
        />
      )}
      {showBulkForm && (
        <BulkTransactionForm
          isOpen={showBulkForm}
          onClose={() => setShowBulkForm(false)}
          onTransactionsAdded={newTxs => {
            newTxs.forEach(addTransaction);
            setShowBulkForm(false);
          }}
        />
      )}
    </div>
  );
}
