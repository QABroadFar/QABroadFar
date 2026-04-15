import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle, StatCard } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import { FormInput, FormSelect, FormRow } from '../components/Form';
import { formatCurrency } from '../utils/helpers';
import { Plus, Edit, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import './Recurring.css';

export default function Recurring() {
  const { recurringPayments, selectedPeriod, addRecurringPayment, updateRecurringPayment, markRecurringPaid, deleteRecurringPayment, resetRecurringPayments, categories, accounts } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editRecurring, setEditRecurring] = useState(null);
  const [showTxForm, setShowTxForm] = useState(false);
  const [txFormPrefill, setTxFormPrefill] = useState(null);

  const paidCount = recurringPayments.filter(r => r.isPaid).length;
  const totalCount = recurringPayments.length;
  const totalAmount = recurringPayments.reduce((s, r) => s + r.amount, 0);
  const paidAmount = recurringPayments.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0);

  const handleMarkPaid = (rp) => {
    // Set prefill data and open transaction form
    setTxFormPrefill({
      type: 'expense',
      amount: rp.amount.toString(),
      date: new Date().toISOString().split('T')[0],
      categoryId: rp.categoryId,
      subcategoryId: rp.subcategoryId || '',
      accountId: rp.accountId || accounts[0]?.id,
      memberId: '',
      note: `Pembayaran rutin: ${rp.name}`,
      recurringId: rp.id,
    });
    setShowTxForm(true);
  };

  const handleTxFormClose = (createdTx) => {
    setShowTxForm(false);
    setTxFormPrefill(null);
    // If transaction was created successfully, mark recurring as paid
    if (createdTx && txFormPrefill?.recurringId) {
      markRecurringPaid(txFormPrefill.recurringId);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset semua status pembayaran untuk bulan baru?')) {
      resetRecurringPayments();
    }
  };

  return (
    <div className="recurring-page">
      <div className="page-header">
        <h1>Pembayaran Rutin</h1>
        <div className="recurring-actions">
          <Button variant="outline" onClick={handleReset} icon={RefreshCw}>
            Reset Bulanan
          </Button>
          <Button variant="primary" onClick={() => { setEditRecurring(null); setShowForm(true); }} icon={Plus}>
            Tambah Tagihan
          </Button>
        </div>
      </div>

      <div className="recurring-summary">
        <StatCard
          title="Total Tagihan"
          value={formatCurrency(totalAmount)}
          subtitle={`${paidCount}/${totalCount} lunas`}
          icon={CheckCircle}
          color="var(--primary)"
        />
        <StatCard
          title="Sudah Dibayar"
          value={formatCurrency(paidAmount)}
          icon={CheckCircle}
          color="var(--success)"
        />
        <StatCard
          title="Belum Dibayar"
          value={formatCurrency(totalAmount - paidAmount)}
          icon={XCircle}
          color="var(--danger)"
        />
      </div>

      {recurringPayments.length === 0 ? (
        <Card><CardBody><p className="empty-state">Belum ada tagihan rutin. Tambahkan tagihan bulanan Anda di sini.</p></CardBody></Card>
      ) : (
        <div className="recurring-list">
          {recurringPayments.map(rp => {
            const cat = categories.find(c => c.id === rp.categoryId);
            return (
              <Card key={rp.id} className={`recurring-card ${rp.isPaid ? 'paid' : 'unpaid'}`}>
                <CardBody>
                  <div className="recurring-item">
                    <div className="recurring-icon">
                      {rp.isPaid ? <CheckCircle size={24} className="paid-icon" /> : <XCircle size={24} className="unpaid-icon" />}
                    </div>
                    <div className="recurring-info">
                      <h3>{rp.name}</h3>
                      <div className="recurring-details">
                        <span>Jatuh tempo: tanggal {rp.dueDate}</span>
                        {cat && <span>Kategori: {cat.name}</span>}
                      </div>
                    </div>
                    <div className="recurring-right">
                      <span className="recurring-amount">{formatCurrency(rp.amount)}</span>
                      <div className="recurring-actions">
                        {!rp.isPaid && (
                          <Button variant="success" size="sm" onClick={() => handleMarkPaid(rp)} icon={CheckCircle}>
                            Bayar
                          </Button>
                        )}
                        <button className="icon-btn" onClick={() => { setEditRecurring(rp); setShowForm(true); }}>
                          <Edit size={14} />
                        </button>
                        <button className="icon-btn danger" onClick={() => deleteRecurringPayment(rp.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <RecurringFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditRecurring(null); }}
        recurring={editRecurring}
      />

      <TransactionForm
        isOpen={showTxForm}
        onClose={handleTxFormClose}
        editTransaction={null}
        prefill={txFormPrefill}
      />
    </div>
  );
}

function RecurringFormModal({ isOpen, onClose, recurring }) {
  const { categories, addRecurringPayment, updateRecurringPayment } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    categoryId: '',
    subcategoryId: '',
    accountId: '',
  });

  useEffect(() => {
    if (recurring) {
      setFormData({
        name: recurring.name,
        amount: recurring.amount.toString(),
        dueDate: recurring.dueDate.toString(),
        categoryId: recurring.categoryId,
        subcategoryId: recurring.subcategoryId || '',
        accountId: recurring.accountId || '',
      });
    } else {
      setFormData({ name: '', amount: '', dueDate: '', categoryId: '', subcategoryId: '', accountId: '' });
    }
  }, [recurring, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      dueDate: parseInt(formData.dueDate),
    };

    if (recurring) {
      updateRecurringPayment(recurring.id, data);
    } else {
      addRecurringPayment(data);
    }
    onClose();
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const selectedCat = categories.find(c => c.id === formData.categoryId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={recurring ? 'Edit Tagihan' : 'Tambah Tagihan'} size="sm">
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Nama Tagihan"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Contoh: Listrik PLN"
          required
        />
        <FormRow>
          <FormInput
            label="Nominal"
            type="number"
            value={formData.amount}
            onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
            min="1"
          />
          <FormInput
            label="Tanggal Jatuh Tempo"
            type="number"
            value={formData.dueDate}
            onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            required
            min="1"
            max="31"
            placeholder="1-31"
          />
        </FormRow>
        <FormSelect
          label="Kategori"
          value={formData.categoryId}
          onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: '' }))}
          options={expenseCategories.map(c => ({ value: c.id, label: c.name }))}
          placeholder="Pilih kategori"
          required
        />
        {selectedCat && selectedCat.subcategories.length > 0 && (
          <FormSelect
            label="Subkategori"
            value={formData.subcategoryId}
            onChange={e => setFormData(prev => ({ ...prev, subcategoryId: e.target.value }))}
            options={selectedCat.subcategories.map(s => ({ value: s.id, label: s.name }))}
            placeholder="Pilih subkategori"
          />
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">{recurring ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}
