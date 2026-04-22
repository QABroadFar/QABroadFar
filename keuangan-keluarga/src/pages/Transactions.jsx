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

const SectionHeader = ({ num, title, desc }) => (
  <div className={`section-header section-header--${num}`}>
    <span className="section-num">{num}</span>
    <span className="section-title">{title}</span>
    <span className="section-desc">{desc}</span>
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
  const [searchExpanded, setSearchExpanded] = useState(false);

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
    const applyDatePreset = () => {
      const today = now.toISOString().split('T')[0];
      
      if (dateMode === 'today') {
        setFilters(prev => ({ ...prev, dateFrom: today, dateTo: today }));
      } else if (dateMode === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        setFilters(prev => ({ 
          ...prev, 
          dateFrom: startOfWeek.toISOString().split('T')[0],
          dateTo: endOfWeek.toISOString().split('T')[0]
        }));
      } else if (dateMode === 'month') {
        const [year, month] = selectedMonth.split('-').map(Number);
        const first = `${selectedMonth}-01`;
        const last = `${selectedMonth}-${new Date(year, month, 0).getDate()}`;
        setFilters(prev => ({ ...prev, dateFrom: first, dateTo: last }));
      }
    };
    
    if (dateMode !== 'custom') {
      applyDatePreset();
    }
  }, [dateMode, selectedMonth]);

  const getCategoryInfo = (categoryId) =>
    categories.find(c => c.id === categoryId) || {};

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
    return s;
  }, 0);

  const typeOptions = [
    { value: '', label: 'Semua' },
    { value: 'income', label: '↑ Masuk' },
    { value: 'expense', label: '↓ Keluar' },
    { value: 'transfer', label: '↔ Transfer' }
  ];

  const dateOptions = [
    { value: 'today', label: 'Hari ini' },
    { value: 'week', label: 'Minggu ini' },
    { value: 'month', label: 'Bulan ini' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className="transactions-page">

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

      <Card>
        <CardHeader>
          <CardTitle><Filter size={16} /> Filter Transaksi</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="filter-section">

            {/* Search - Collapsible */}
            <div className={`search-bar-collapsible${searchExpanded ? ' expanded' : ''}`}>
              <button 
                className="search-toggle"
                onClick={() => setSearchExpanded(!searchExpanded)}
                aria-label="Toggle search"
              >
                <Search size={16} />
              </button>
              {searchExpanded && (
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Cari kategori atau catatan…"
                    value={filters.search}
                    onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Date Preset Pills */}
            <div className="filter-row">
              <span className="filter-label">Periode</span>
              <div className="filter-pills">
                {dateOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`filter-pill${dateMode === value ? ' active' : ''}`}
                    onClick={() => setDateMode(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Inputs - shown when custom */}
            {dateMode === 'custom' && (
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
            )}

            {/* Type Filter Pills */}
            <div className="filter-row">
              <span className="filter-label">Tipe</span>
              <div className="filter-pills">
                {typeOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    className={`filter-pill${filters.type === value ? ' active' : ''}`}
                    onClick={() => setFilters(p => ({ ...p, type: value }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="filter-row">
              <span className="filter-label">Kategori</span>
              <div className="filter-pills">
                <button
                  className={`filter-pill${filters.categoryId === '' ? ' active' : ''}`}
                  onClick={() => setFilters(p => ({ ...p, categoryId: '' }))}
                >
                  Semua
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    className={`filter-pill${filters.categoryId === c.id ? ' active' : ''}`}
                    onClick={() => setFilters(p => ({ ...p, categoryId: c.id }))}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Filter Pills */}
            <div className="filter-row">
              <span className="filter-label">Akun</span>
              <div className="filter-pills">
                <button
                  className={`filter-pill${filters.accountId === '' ? ' active' : ''}`}
                  onClick={() => setFilters(p => ({ ...p, accountId: '' }))}
                >
                  Semua
                </button>
                {accounts.map(a => (
                  <button
                    key={a.id}
                    className={`filter-pill${filters.accountId === a.id ? ' active' : ''}`}
                    onClick={() => setFilters(p => ({ ...p, accountId: a.id }))}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeader
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
        <CardBody style={{ padding: 'var(--sp-12)' }}>
          {filteredTransactions.length === 0 ? (
            <div className="tx-empty">
              <div className="tx-empty-icon">🔍</div>
              <div className="tx-empty-text">Tidak ada transaksi ditemukan.</div>
            </div>
          ) : (
            <div className="tx-list">
              {filteredTransactions.map(tx => {
                const cat = getCategoryInfo(tx.categoryId);
                const fromAcc = accounts.find(a => a.id === tx.fromAccountId);
                const toAcc = accounts.find(a => a.id === tx.toAccountId);
                const acc = accounts.find(a => a.id === tx.accountId);
                const sub = cat?.subcategories?.find(s => s.id === tx.subcategoryId);

                return (
                  <div key={tx.id} className="tx-card">
                    <div className="tx-card-top">
                      <div className="tx-left">
                        <span className="cat-icon" style={{ 
                          background: tx.type === 'transfer' 
                            ? 'var(--tx-surface2)' 
                            : cat?.color ? `${cat.color}22` : 'var(--tx-surface2)' 
                        }}>
                          {tx.type === 'transfer' 
                            ? '↔️' 
                            : <EmojiDisplay emoji={cat.icon} size={13} />
                          }
                        </span>
                        <div className="tx-info">
                          <div className="tx-category">
                            {tx.type === 'transfer' ? 'Transfer' : cat.name || '—'}
                            {sub && <span className="tx-subcat"> → {sub.name}</span>}
                          </div>
                          <div className="tx-account">
                            {tx.type === 'transfer' 
                              ? `${fromAcc?.name} → ${toAcc?.name}`
                              : acc?.name || '—'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="tx-right">
                        <div className={`tx-amount ${tx.type}`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}{formatCurrency(tx.amount)}
                        </div>
                        <div className="tx-date">{formatDate(tx.date)}</div>
                      </div>
                    </div>
                    
                    {tx.note && <div className="tx-note">{tx.note}</div>}
                    
                    <div className="tx-actions">
                      {tx.type !== 'transfer' && (
                        <>
                          <button
                            className="tx-action-btn"
                            onClick={() => { setEditTx(tx); setShowForm(true); }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            className="tx-action-btn danger"
                            onClick={() => deleteTransaction(tx.id)}
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

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