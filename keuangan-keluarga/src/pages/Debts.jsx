import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle, StatCard } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { FormInput, FormTextarea, FormRow, FormSelect } from '../components/Form';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Edit, Trash2, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import './Debts.css';

export default function Debts() {
  const [activeTab, setActiveTab] = useState('debts');

  return (
    <div className="debts-page">
      <div className="page-header">
        <h1>Utang & Piutang</h1>
        <div className="tab-switcher">
          <button className={`tab-btn ${activeTab === 'debts' ? 'active' : ''}`} onClick={() => setActiveTab('debts')}>
            <TrendingDown size={16} /> Utang (Kita Berutang)
          </button>
          <button className={`tab-btn ${activeTab === 'receivables' ? 'active' : ''}`} onClick={() => setActiveTab('receivables')}>
            <TrendingUp size={16} /> Piutang (Orang Berutang ke Kita)
          </button>
        </div>
      </div>

      {activeTab === 'debts' ? <DebtsSection /> : <ReceivablesSection />}
    </div>
  );
}

function DebtsSection() {
  const { debts, addDebt, markDebtPaid, deleteDebt } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editDebt, setEditDebt] = useState(null);

  const totalDebt = debts.filter(d => !d.isPaid).reduce((s, d) => s + d.amount, 0);
  const paidDebt = debts.filter(d => d.isPaid).reduce((s, d) => s + d.amount, 0);

  // Check due dates (H-3)
  const today = new Date();
  const dueSoon = debts.filter(d => {
    if (d.isPaid || !d.dueDate) return false;
    const due = new Date(d.dueDate);
    const diff = (due - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });

  return (
    <div>
      <div className="section-header">
        <div className="debt-stats">
          <StatCard title="Total Utang Belum Lunas" value={formatCurrency(totalDebt)} icon={TrendingDown} color="var(--danger)" />
          <StatCard title="Sudah Dilunasi" value={formatCurrency(paidDebt)} icon={CheckCircle} color="var(--success)" />
        </div>
        <Button variant="primary" onClick={() => { setEditDebt(null); setShowForm(true); }} icon={Plus}>
          Tambah Utang
        </Button>
      </div>

      {dueSoon.length > 0 && (
        <Card className="due-soon-card">
          <CardHeader>
            <CardTitle><AlertTriangle size={18} /> Jatuh Tempo H-3</CardTitle>
          </CardHeader>
          <CardBody>
            {dueSoon.map(d => (
              <div key={d.id} className="due-item">
                <span className="due-name">{d.partyName}</span>
                <span className="due-amount">{formatCurrency(d.amount)}</span>
                <span className="due-date">Jatuh tempo: {formatDate(d.dueDate)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {debts.length === 0 ? (
        <Card><CardBody><p className="empty-state">Belum ada utang.</p></CardBody></Card>
      ) : (
        <div className="debts-list">
          {debts.map(d => (
            <Card key={d.id} className={`debt-card ${d.isPaid ? 'paid' : ''}`}>
              <CardBody>
                <div className="debt-item">
                  <div className="debt-info">
                    <div className="debt-header">
                      <h3>{d.partyName}</h3>
                      {d.isPaid && <span className="paid-badge">Lunas</span>}
                    </div>
                    <div className="debt-details">
                      {d.dueDate && <span>Jatuh tempo: {formatDate(d.dueDate)}</span>}
                      {d.note && <span>Catatan: {d.note}</span>}
                    </div>
                  </div>
                  <div className="debt-right">
                    <span className="debt-amount">{formatCurrency(d.amount)}</span>
                    <div className="debt-actions">
                      {!d.isPaid && (
                        <Button variant="success" size="sm" onClick={() => markDebtPaid(d.id)} icon={CheckCircle}>
                          Lunas
                        </Button>
                      )}
                      <button className="icon-btn" onClick={() => { setEditDebt(d); setShowForm(true); }}><Edit size={14} /></button>
                      <button className="icon-btn danger" onClick={() => deleteDebt(d.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <DebtFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditDebt(null); }}
        debt={editDebt}
      />
    </div>
  );
}

function ReceivablesSection() {
  const { receivables, addReceivable, markReceivablePaid, deleteReceivable } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editReceivable, setEditReceivable] = useState(null);

  const totalReceivable = receivables.filter(r => !r.isPaid).reduce((s, r) => s + r.amount, 0);
  const paidReceivable = receivables.filter(r => r.isPaid).reduce((s, r) => s + r.amount, 0);

  const today = new Date();
  const dueSoon = receivables.filter(r => {
    if (r.isPaid || !r.dueDate) return false;
    const due = new Date(r.dueDate);
    const diff = (due - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });

  return (
    <div>
      <div className="section-header">
        <div className="debt-stats">
          <StatCard title="Total Piutang Belum Lunas" value={formatCurrency(totalReceivable)} icon={TrendingUp} color="var(--success)" />
          <StatCard title="Sudah Dibayar" value={formatCurrency(paidReceivable)} icon={CheckCircle} color="var(--primary)" />
        </div>
        <Button variant="primary" onClick={() => { setEditReceivable(null); setShowForm(true); }} icon={Plus}>
          Tambah Piutang
        </Button>
      </div>

      {dueSoon.length > 0 && (
        <Card className="due-soon-card">
          <CardHeader>
            <CardTitle><AlertTriangle size={18} /> Jatuh Tempo H-3</CardTitle>
          </CardHeader>
          <CardBody>
            {dueSoon.map(r => (
              <div key={r.id} className="due-item">
                <span className="due-name">{r.partyName}</span>
                <span className="due-amount">{formatCurrency(r.amount)}</span>
                <span className="due-date">Jatuh tempo: {formatDate(r.dueDate)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {receivables.length === 0 ? (
        <Card><CardBody><p className="empty-state">Belum ada piutang.</p></CardBody></Card>
      ) : (
        <div className="debts-list">
          {receivables.map(r => (
            <Card key={r.id} className={`debt-card ${r.isPaid ? 'paid' : ''}`}>
              <CardBody>
                <div className="debt-item">
                  <div className="debt-info">
                    <div className="debt-header">
                      <h3>{r.partyName}</h3>
                      {r.isPaid && <span className="paid-badge">Lunas</span>}
                    </div>
                    <div className="debt-details">
                      {r.dueDate && <span>Jatuh tempo: {formatDate(r.dueDate)}</span>}
                      {r.note && <span>Catatan: {r.note}</span>}
                    </div>
                  </div>
                  <div className="debt-right">
                    <span className="debt-amount">{formatCurrency(r.amount)}</span>
                    <div className="debt-actions">
                      {!r.isPaid && (
                        <Button variant="success" size="sm" onClick={() => markReceivablePaid(r.id)} icon={CheckCircle}>
                          Lunas
                        </Button>
                      )}
                      <button className="icon-btn" onClick={() => { setEditReceivable(r); setShowForm(true); }}><Edit size={14} /></button>
                      <button className="icon-btn danger" onClick={() => deleteReceivable(r.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ReceivableFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditReceivable(null); }}
        receivable={editReceivable}
      />
    </div>
  );
}

function DebtFormModal({ isOpen, onClose, debt }) {
  const { addDebt, updateDebt } = useApp();
  const [formData, setFormData] = useState({
    partyName: '',
    amount: '',
    dueDate: '',
    note: '',
  });

  useEffect(() => {
    if (debt) {
      setFormData({
        partyName: debt.partyName,
        amount: debt.amount.toString(),
        dueDate: debt.dueDate || '',
        note: debt.note || '',
      });
    } else {
      setFormData({ partyName: '', amount: '', dueDate: '', note: '' });
    }
  }, [debt, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, amount: parseFloat(formData.amount) };
    if (debt) {
      updateDebt(debt.id, data);
    } else {
      addDebt(data);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={debt ? 'Edit Utang' : 'Tambah Utang'} size="sm">
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Nama Pihak"
          value={formData.partyName}
          onChange={e => setFormData(prev => ({ ...prev, partyName: e.target.value }))}
          placeholder="Nama orang/bank"
          required
        />
        <FormInput
          label="Nominal"
          type="number"
          value={formData.amount}
          onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          required
          min="1"
        />
        <FormInput
          label="Jatuh Tempo"
          type="date"
          value={formData.dueDate}
          onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
        />
        <FormTextarea
          label="Catatan"
          value={formData.note}
          onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
        />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">{debt ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ReceivableFormModal({ isOpen, onClose, receivable }) {
  const { addReceivable, updateReceivable } = useApp();
  const [formData, setFormData] = useState({
    partyName: '',
    amount: '',
    dueDate: '',
    note: '',
  });

  useEffect(() => {
    if (receivable) {
      setFormData({
        partyName: receivable.partyName,
        amount: receivable.amount.toString(),
        dueDate: receivable.dueDate || '',
        note: receivable.note || '',
      });
    } else {
      setFormData({ partyName: '', amount: '', dueDate: '', note: '' });
    }
  }, [receivable, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, amount: parseFloat(formData.amount) };
    if (receivable) {
      updateReceivable(receivable.id, data);
    } else {
      addReceivable(data);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={receivable ? 'Edit Piutang' : 'Tambah Piutang'} size="sm">
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Nama Pihak"
          value={formData.partyName}
          onChange={e => setFormData(prev => ({ ...prev, partyName: e.target.value }))}
          placeholder="Nama orang"
          required
        />
        <FormInput
          label="Nominal"
          type="number"
          value={formData.amount}
          onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          required
          min="1"
        />
        <FormInput
          label="Jatuh Tempo"
          type="date"
          value={formData.dueDate}
          onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
        />
        <FormTextarea
          label="Catatan"
          value={formData.note}
          onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
        />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">{receivable ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}
