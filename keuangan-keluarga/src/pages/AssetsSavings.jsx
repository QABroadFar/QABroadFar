import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle, StatCard } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { FormInput, FormTextarea, FormRow } from '../components/Form';
import { formatCurrency } from '../utils/helpers';
import { Plus, Edit, Trash2, TrendingUp, PiggyBank, Target } from 'lucide-react';
import './AssetsSavings.css';

export default function AssetsSavings() {
  const [activeTab, setActiveTab] = useState('assets');

  return (
    <div className="assets-savings-page">
      <div className="page-header">
        <h1>Aset & Tabungan</h1>
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            <TrendingUp size={16} /> Aset
          </button>
          <button
            className={`tab-btn ${activeTab === 'savings' ? 'active' : ''}`}
            onClick={() => setActiveTab('savings')}
          >
            <PiggyBank size={16} /> Tabungan
          </button>
        </div>
      </div>

      {activeTab === 'assets' ? <AssetsSection /> : <SavingsSection />}
    </div>
  );
}

function AssetsSection() {
  const { assets, addAsset, updateAsset, deleteAsset } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);

  const totalValue = assets.reduce((s, a) => s + (a.currentValue || a.purchaseValue || 0), 0);

  return (
    <div>
      <div className="section-header">
        <StatCard title="Total Nilai Aset" value={formatCurrency(totalValue)} icon={TrendingUp} color="var(--primary)" />
        <Button variant="primary" onClick={() => { setEditAsset(null); setShowForm(true); }} icon={Plus}>
          Tambah Aset
        </Button>
      </div>

      {assets.length === 0 ? (
        <Card><CardBody><p className="empty-state">Belum ada aset. Klik "Tambah Aset" untuk memulai.</p></CardBody></Card>
      ) : (
        <div className="assets-grid">
          {assets.map(asset => (
            <Card key={asset.id}>
              <CardBody>
                <div className="asset-card">
                  <div className="asset-header">
                    <h3>{asset.name}</h3>
                    <div className="asset-actions">
                      <button className="icon-btn" onClick={() => { setEditAsset(asset); setShowForm(true); }}><Edit size={14} /></button>
                      <button className="icon-btn danger" onClick={() => deleteAsset(asset.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="asset-values">
                    <div className="asset-value">
                      <span className="label">Nilai Perolehan</span>
                      <span className="value">{formatCurrency(asset.purchaseValue)}</span>
                    </div>
                    <div className="asset-value">
                      <span className="label">Nilai Saat Ini</span>
                      <span className="value highlight">{formatCurrency(asset.currentValue)}</span>
                    </div>
                    {asset.purchaseDate && (
                      <div className="asset-value">
                        <span className="label">Tanggal Beli</span>
                        <span className="value">{new Date(asset.purchaseDate).toLocaleDateString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                  {asset.currentValue && asset.purchaseValue && (
                    <div className={`asset-change ${(asset.currentValue - asset.purchaseValue) >= 0 ? 'positive' : 'negative'}`}>
                      {(asset.currentValue - asset.purchaseValue) >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(asset.currentValue - asset.purchaseValue))}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <AssetFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditAsset(null); }}
        asset={editAsset}
      />
    </div>
  );
}

function SavingsSection() {
  const { savings, addSaving, updateSaving, addToSaving, deleteSaving } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editSaving, setEditSaving] = useState(null);
  const [addToAmount, setAddToAmount] = useState(null);
  const [addAmount, setAddAmount] = useState('');

  const totalTarget = savings.reduce((s, sv) => s + (sv.targetAmount || 0), 0);
  const totalSaved = savings.reduce((s, sv) => s + (sv.currentAmount || 0), 0);

  return (
    <div>
      <div className="section-header">
        <StatCard title="Total Tabungan" value={formatCurrency(totalSaved)} subtitle={`dari target ${formatCurrency(totalTarget)}`} icon={Target} color="var(--success)" />
        <Button variant="primary" onClick={() => { setEditSaving(null); setShowForm(true); }} icon={Plus}>
          Tambah Target
        </Button>
      </div>

      {savings.length === 0 ? (
        <Card><CardBody><p className="empty-state">Belum ada target tabungan.</p></CardBody></Card>
      ) : (
        <div className="savings-grid">
          {savings.map(sv => {
            const progress = sv.targetAmount > 0 ? (sv.currentAmount || 0) / sv.targetAmount * 100 : 0;
            return (
              <Card key={sv.id}>
                <CardBody>
                  <div className="saving-card">
                    <div className="saving-header">
                      <h3>{sv.name}</h3>
                      <div className="saving-actions">
                        <button className="btn-sm" onClick={() => { setAddToAmount(sv); setAddAmount(''); }}>+ Saldo</button>
                        <button className="icon-btn" onClick={() => { setEditSaving(sv); setShowForm(true); }}><Edit size={14} /></button>
                        <button className="icon-btn danger" onClick={() => deleteSaving(sv.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="saving-progress">
                      <div className="saving-bar">
                        <div className="saving-fill" style={{ width: `${Math.min(100, progress)}%` }}></div>
                      </div>
                      <span className="saving-percent">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="saving-values">
                      <span>Terkumpul: <strong>{formatCurrency(sv.currentAmount || 0)}</strong></span>
                      <span>Target: <strong>{formatCurrency(sv.targetAmount)}</strong></span>
                      {sv.deadline && <span>Deadline: {new Date(sv.deadline).toLocaleDateString('id-ID')}</span>}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <SavingFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditSaving(null); }}
        saving={editSaving}
      />

      <Modal isOpen={!!addToAmount} onClose={() => setAddToAmount(null)} title="Tambah Saldo" size="sm">
        {addToAmount && (
          <form onSubmit={e => {
            e.preventDefault();
            addToSaving(addToAmount.id, parseFloat(addAmount));
            setAddToAmount(null);
          }}>
            <FormInput
              label="Nominal"
              type="number"
              value={addAmount}
              onChange={e => setAddAmount(e.target.value)}
              placeholder="0"
              required
              min="1"
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="outline" onClick={() => setAddToAmount(null)}>Batal</Button>
              <Button type="submit" variant="success">Tambah</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function AssetFormModal({ isOpen, onClose, asset }) {
  const { addAsset, updateAsset } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    purchaseValue: '',
    currentValue: '',
    purchaseDate: '',
  });

  useState(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        purchaseValue: asset.purchaseValue.toString(),
        currentValue: asset.currentValue?.toString() || '',
        purchaseDate: asset.purchaseDate || '',
      });
    } else {
      setFormData({ name: '', purchaseValue: '', currentValue: '', purchaseDate: '' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      purchaseValue: parseFloat(formData.purchaseValue),
      currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
    };

    if (asset) {
      updateAsset(asset.id, data);
    } else {
      addAsset(data);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={asset ? 'Edit Aset' : 'Tambah Aset'} size="sm">
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Nama Aset"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <FormRow>
          <FormInput
            label="Nilai Perolehan"
            type="number"
            value={formData.purchaseValue}
            onChange={e => setFormData(prev => ({ ...prev, purchaseValue: e.target.value }))}
            required
            min="0"
          />
          <FormInput
            label="Nilai Saat Ini"
            type="number"
            value={formData.currentValue}
            onChange={e => setFormData(prev => ({ ...prev, currentValue: e.target.value }))}
            min="0"
          />
        </FormRow>
        <FormInput
          label="Tanggal Beli"
          type="date"
          value={formData.purchaseDate}
          onChange={e => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
        />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">{asset ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function SavingFormModal({ isOpen, onClose, saving }) {
  const { addSaving, updateSaving } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
  });

  useState(() => {
    if (saving) {
      setFormData({
        name: saving.name,
        targetAmount: saving.targetAmount.toString(),
        currentAmount: saving.currentAmount?.toString() || '0',
        deadline: saving.deadline || '',
      });
    } else {
      setFormData({ name: '', targetAmount: '', currentAmount: '0', deadline: '' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
    };

    if (saving) {
      updateSaving(saving.id, data);
    } else {
      addSaving(data);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={saving ? 'Edit Target' : 'Tambah Target'} size="sm">
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Nama Target"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <FormRow>
          <FormInput
            label="Target Nominal"
            type="number"
            value={formData.targetAmount}
            onChange={e => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
            required
            min="1"
          />
          <FormInput
            label="Saldo Awal"
            type="number"
            value={formData.currentAmount}
            onChange={e => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
            min="0"
          />
        </FormRow>
        <FormInput
          label="Deadline (opsional)"
          type="date"
          value={formData.deadline}
          onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
        />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">{saving ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}
