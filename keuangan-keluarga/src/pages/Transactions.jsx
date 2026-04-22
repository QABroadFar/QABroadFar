import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import TransactionForm from '../components/TransactionForm';
import TransferForm from '../components/TransferForm';
import BulkTransactionForm from '../components/BulkTransactionForm';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  Plus, Edit, Trash2, Search, ArrowRightLeft, X, ChevronDown,
} from 'lucide-react';
import { EmojiDisplay } from '../components/IconPicker';
import './Transactions.css';

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
  const [activeSheet, setActiveSheet]     = useState(null);
  const [expandedTxId, setExpandedTxId]   = useState(null);

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

  // Group transactions by date with daily totals
  const groupedTransactions = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach(tx => {
      if (!groups[tx.date]) groups[tx.date] = { txs: [], total: 0 };
      groups[tx.date].txs.push(tx);
      groups[tx.date].total += tx.type === 'income' ? tx.amount : -tx.amount;
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [filteredTransactions]);

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

  const formatDateGroup = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dateStr === today.toISOString().split('T')[0]) return 'Hari ini';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Kemarin';
    
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filter bottom sheet content
  const SheetContent = () => {
    if (!activeSheet) return null;

    const closeSheet = () => setActiveSheet(null);

    if (activeSheet === 'type') {
      return (
        <div className="sheet-content">
          <div className="sheet-header">
            <span className="sheet-title">Tipe Transaksi</span>
            <button onClick={closeSheet} className="sheet-close"><X size={18} /></button>
          </div>
          <div className="sheet-options">
            {typeOptions.map(opt => (
              <button
                key={opt.value}
                className={`sheet-option ${filters.type === opt.value ? 'active' : ''}`}
                onClick={() => { setFilters(p => ({ ...p, type: opt.value })); closeSheet(); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeSheet === 'category') {
      return (
        <div className="sheet-content">
          <div className="sheet-header">
            <span className="sheet-title">Kategori</span>
            <button onClick={closeSheet} className="sheet-close"><X size={18} /></button>
          </div>
          <div className="sheet-options">
            <button
              className={`sheet-option ${filters.categoryId === '' ? 'active' : ''}`}
              onClick={() => { setFilters(p => ({ ...p, categoryId: '' })); closeSheet(); }}
            >
              Semua Kategori
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`sheet-option ${filters.categoryId === c.id ? 'active' : ''}`}
                onClick={() => { setFilters(p => ({ ...p, categoryId: c.id })); closeSheet(); }}
              >
                <span className="sheet-option-emoji">{c.icon}</span> {c.name}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeSheet === 'account') {
      return (
        <div className="sheet-content">
          <div className="sheet-header">
            <span className="sheet-title">Akun</span>
            <button onClick={closeSheet} className="sheet-close"><X size={18} /></button>
          </div>
          <div className="sheet-options">
            <button
              className={`sheet-option ${filters.accountId === '' ? 'active' : ''}`}
              onClick={() => { setFilters(p => ({ ...p, accountId: '' })); closeSheet(); }}
            >
              Semua Akun
            </button>
            {accounts.map(a => (
              <button
                key={a.id}
                className={`sheet-option ${filters.accountId === a.id ? 'active' : ''}`}
                onClick={() => { setFilters(p => ({ ...p, accountId: a.id })); closeSheet(); }}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeSheet === 'date') {
      return (
        <div className="sheet-content">
          <div className="sheet-header">
            <span className="sheet-title">Periode</span>
            <button onClick={closeSheet} className="sheet-close"><X size={18} /></button>
          </div>
          <div className="sheet-options">
            {dateOptions.map(opt => (
              <button
                key={opt.value}
                className={`sheet-option ${dateMode === opt.value ? 'active' : ''}`}
                onClick={() => { setDateMode(opt.value); closeSheet(); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {dateMode === 'custom' && (
            <div className="sheet-custom-dates">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))}
              />
              <span>–</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))}
              />
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="transactions-page">

      <div className="page-header">
        <div className="header-top">
          <h1>Transaksi</h1>
          <div className="header-subtitle">Uangmu lari ke mana aja?</div>
        </div>
        <div className="header-buttons">
          <Button variant="secondary" onClick={() => setShowTransferForm(true)} icon={ArrowRightLeft} compact circle />
        </div>
      </div>

      {/* Permanent Search Bar */}
      <div className="search-bar-permanent">
        <Search size={20} />
        <input
          type="text"
          placeholder="Cari catatan..."
          value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
        />
      </div>

      {/* Modern Fixed Filter Pills Bar */}
      <div className="filter-bar-modern">
        <button className={`filter-chip ${filters.dateFrom !== firstDay || filters.dateTo !== lastDay || dateMode !== 'month' ? 'active' : ''}`} onClick={() => setActiveSheet('date')}>
          <span className="chip-icon">📅</span>
          {dateMode === 'today' ? 'Hari ini' : dateMode === 'week' ? 'Minggu ini' : dateMode === 'month' ? 'Semua Waktu' : 'Custom'}
          <ChevronDown size={16} />
        </button>
        
        <button className={`filter-chip ${filters.accountId ? 'active' : ''}`} onClick={() => setActiveSheet('account')}>
          <span className="chip-icon">👝</span>
          {filters.accountId ? accounts.find(a => a.id === filters.accountId)?.name || 'Semua Dompet' : 'Semua Dompet'}
          <ChevronDown size={16} />
        </button>
        
        <button className={`filter-chip ${filters.categoryId ? 'active' : ''}`} onClick={() => setActiveSheet('category')}>
          <span className="chip-icon">🏷️</span>
          Semua
        </button>
      </div>

      {/* Transaction Count Header */}
      <div className="tx-header">
        <span className="tx-count">{filteredTransactions.length} transaksi</span>
        {filteredTransactions.length > 0 && (
          <span className={`total-filtered ${totalFiltered >= 0 ? 'positive' : 'negative'}`}>
            {totalFiltered >= 0 ? '+' : ''}{formatCurrency(totalFiltered)}
          </span>
        )}
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="tx-empty">
          <div className="tx-empty-icon">🔍</div>
          <div className="tx-empty-text">Tidak ada transaksi ditemukan.</div>
        </div>
      ) : (
        <div className="tx-list-container">
          {groupedTransactions.map(([date, data]) => (
            <div key={date} className="tx-date-group">
              <div className="tx-date-header">
                <span>{formatDateGroup(date).toUpperCase()}</span>
                <span className={`tx-date-total ${data.total >= 0 ? 'positive' : ''}`}>
                  {data.total >= 0 ? '+' : ''}{formatCurrency(data.total)}
                </span>
              </div>
              
              <div className="tx-list">
                {data.txs.map(tx => {
                  const cat = getCategoryInfo(tx.categoryId);
                  const fromAcc = accounts.find(a => a.id === tx.fromAccountId);
                  const toAcc = accounts.find(a => a.id === tx.toAccountId);
                  const acc = accounts.find(a => a.id === tx.accountId);
                  const isExpanded = expandedTxId === tx.id;

                  return (
                    <div key={tx.id} className={`tx-card ${isExpanded ? 'expanded' : ''}`}>
                      <div 
                        className="tx-card-header" 
                        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                      >
                        <span className="cat-icon-modern" style={{ 
                          background: tx.type === 'transfer' 
                            ? '#f5f5f7' 
                            : cat?.color ? `${cat.color}15` : '#f5f5f7'
                        }}>
                          {tx.type === 'transfer' 
                            ? '↔️' 
                            : <EmojiDisplay emoji={cat.icon} size={18} />
                          }
                        </span>
                        
                        <div className="tx-main">
                          <div className="tx-note-line">{tx.note || (tx.type === 'transfer' ? 'Transfer' : cat.name || '—')}</div>
                          <div className="tx-category-badge">{tx.type === 'transfer' ? `${fromAcc?.name} → ${toAcc?.name}` : cat.name || '—'}</div>
                        </div>
                        
                        <div className={`tx-amount ${tx.type}`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}{formatCurrency(tx.amount)}
                        </div>
                      </div>
                      
                      <div className="tx-card-details">
                        <div className="tx-detail-row">
                          <span className="tx-detail-label">Tanggal</span>
                          <span>{formatDate(tx.date)}</span>
                        </div>
                        {acc && tx.type !== 'transfer' && (
                          <div className="tx-detail-row">
                            <span className="tx-detail-label">Akun</span>
                            <span>{acc.name}</span>
                          </div>
                        )}
                        {tx.note && (
                          <div className="tx-detail-row tx-detail-note">
                            <span className="tx-detail-label">Catatan</span>
                            <span>{tx.note}</span>
                          </div>
                        )}
                        <div className="tx-actions">
                          {tx.type !== 'transfer' && (
                            <>
                              <button
                                className="tx-action-btn"
                                onClick={(e) => { e.stopPropagation(); setEditTx(tx); setShowForm(true); }}
                              >
                                <Edit size={14} /> Edit
                              </button>
                              <button
                                className="tx-action-btn danger"
                                onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}
                              >
                                <Trash2 size={14} /> Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Centered FAB */}
      <div className="fab-center">
        <Button variant="primary" onClick={() => { setEditTx(null); setShowForm(true); }} icon={Plus} circle large />
      </div>

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

      {/* Bottom Sheet Overlay */}
      {activeSheet && (
        <div className="sheet-overlay" onClick={() => setActiveSheet(null)}>
          <div className="sheet-container" onClick={e => e.stopPropagation()}>
            <div className="sheet-grabber" />
            <SheetContent />
          </div>
        </div>
      )}
    </div>
  );
}