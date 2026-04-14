import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import TransactionDetailModal from '../components/TransactionDetailModal';
import TransactionForm from '../components/TransactionForm';
import { formatCurrency } from '../utils/helpers';
import { Plus, Edit, Trash2, Copy, ChevronDown, AlertCircle } from 'lucide-react';
import './Budget.css';

export default function Budget() {
  const { selectedPeriod, budgets, categories, expenses, addBudget, updateBudget, deleteBudget } = useApp();
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [detailModal, setDetailModal] = useState({ open: false, title: '', txs: [] });
  const [editTx, setEditTx] = useState(null);
  const [showTxForm, setShowTxForm] = useState(false);

  const currentBudgets = useMemo(() => {
    return budgets.filter(b => b.year === selectedPeriod.year && b.month === selectedPeriod.month);
  }, [budgets, selectedPeriod]);

  const handleCopyFromLastMonth = () => {
    const prevMonth = selectedPeriod.month === 1 ? 12 : selectedPeriod.month - 1;
    const prevYear = selectedPeriod.month === 1 ? selectedPeriod.year - 1 : selectedPeriod.year;
    const prevBudgets = budgets.filter(b => b.year === prevYear && b.month === prevMonth);

    prevBudgets.forEach(b => {
      addBudget({
        ...b,
        year: selectedPeriod.year,
        month: selectedPeriod.month,
      });
    });
  };

  const getCategoryExpense = (categoryId) => {
    return expenses.filter(tx => tx.categoryId === categoryId).reduce((s, tx) => s + tx.amount, 0);
  };

  const handleCategoryClick = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    const txs = expenses.filter(tx => tx.categoryId === categoryId);
    setDetailModal({ open: true, title: `Detail: ${cat?.name} - ${selectedPeriod.month}/${selectedPeriod.year}`, txs });
  };

  return (
    <div className="budget-page">
      <div className="page-header">
        <h1>Manajemen Anggaran</h1>
        <div className="budget-actions">
          <Button variant="outline" onClick={handleCopyFromLastMonth} icon={Copy}>
            Duplikasi dari Bulan Lalu
          </Button>
          <Button variant="primary" onClick={() => { setEditBudget(null); setShowBudgetForm(true); }} icon={Plus}>
            Tambah Budget
          </Button>
        </div>
      </div>

      <Card>
        <CardBody>
          {currentBudgets.length === 0 ? (
            <p className="empty-state">
              Belum ada anggaran untuk bulan ini. Klik "Tambah Budget" atau "Duplikasi dari Bulan Lalu".
            </p>
          ) : (
            <div className="budget-table">
              <div className="budget-header-row">
                <span className="budget-col cat">Kategori</span>
                <span className="budget-col amount">Anggaran</span>
                <span className="budget-col spent">Terpakai</span>
                <span className="budget-col remaining">Sisa</span>
                <span className="budget-col progress">Progress</span>
                <span className="budget-col actions">Aksi</span>
              </div>
              {currentBudgets.map(bud => {
                const cat = categories.find(c => c.id === bud.categoryId);
                const spent = getCategoryExpense(bud.categoryId);
                const remaining = bud.amount - spent;
                const percentage = bud.amount > 0 ? Math.min(100, (spent / bud.amount) * 100) : 0;
                const isOver80 = percentage >= 80;
                const isOver = percentage >= 100;

                return (
                  <div key={bud.id} className={`budget-row ${isOver ? 'over' : isOver80 ? 'warning' : ''}`}>
                    <span
                      className="budget-col cat clickable"
                      onClick={() => handleCategoryClick(bud.categoryId)}
                    >
                      <span className="cat-dot" style={{ background: cat?.color || '#666' }}></span>
                      {cat?.name || 'Unknown'}
                    </span>
                    <span className="budget-col amount">{formatCurrency(bud.amount)}</span>
                    <span className="budget-col spent">{formatCurrency(spent)}</span>
                    <span className={`budget-col remaining ${remaining < 0 ? 'negative' : ''}`}>
                      {formatCurrency(remaining)}
                    </span>
                    <span className="budget-col progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${percentage}%`,
                            background: isOver ? 'var(--danger)' : isOver80 ? 'var(--warning)' : 'var(--success)',
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{percentage.toFixed(0)}%</span>
                    </span>
                    <span className="budget-col actions">
                      <button className="icon-btn" onClick={() => { setEditBudget(bud); setShowBudgetForm(true); }} title="Edit">
                        <Edit size={14} />
                      </button>
                      <button className="icon-btn danger" onClick={() => deleteBudget(bud.id)} title="Hapus">
                        <Trash2 size={14} />
                      </button>
                      {bud.rollover && <span className="rollover-badge" title="Rollover aktif">R</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Budget Form Modal */}
      <BudgetFormModal
        isOpen={showBudgetForm}
        onClose={() => { setShowBudgetForm(false); setEditBudget(null); }}
        budget={editBudget}
      />

      {/* Transaction Detail Modal */}
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

function BudgetFormModal({ isOpen, onClose, budget }) {
  const { categories, budgets, selectedPeriod, addBudget, updateBudget } = useApp();
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    rollover: false,
  });

  useEffect(() => {
    if (budget) {
      setFormData({
        categoryId: budget.categoryId,
        amount: budget.amount.toString(),
        rollover: budget.rollover || false,
      });
    } else {
      setFormData({ categoryId: '', amount: '', rollover: false });
    }
  }, [budget, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      year: selectedPeriod.year,
      month: selectedPeriod.month,
    };

    if (budget) {
      updateBudget(budget.id, data);
    } else {
      addBudget(data);
    }
    onClose();
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const usedCategoryIds = budgets
    .filter(b => b.year === selectedPeriod.year && b.month === selectedPeriod.month && b.id !== budget?.id)
    .map(b => b.categoryId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={budget ? 'Edit Budget' : 'Tambah Budget'} size="sm">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Kategori <span className="required">*</span></label>
          <select
            value={formData.categoryId}
            onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            className="form-control"
            required
          >
            <option value="">Pilih kategori</option>
            {expenseCategories.filter(c => !usedCategoryIds.includes(c.id) || c.id === budget?.categoryId).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Nominal Anggaran <span className="required">*</span></label>
          <input
            type="number"
            value={formData.amount}
            onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="form-control"
            placeholder="0"
            required
            min="1"
          />
        </div>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.rollover}
            onChange={e => setFormData(prev => ({ ...prev, rollover: e.target.checked }))}
          />
          <span>Aktifkan rollover (sisa budget ditambahkan ke bulan depan)</span>
        </label>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">{budget ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}
