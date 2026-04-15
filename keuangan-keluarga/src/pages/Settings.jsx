import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { FormInput, FormSelect, FormTextarea } from '../components/Form';
import { Plus, Edit, Trash2, Settings as SettingsIcon, CreditCard, Tag, Database } from 'lucide-react';
import './Settings.css';
import seedDummyData from '../utils/seedDummyData';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('categories');

  const handleSeedData = () => {
    if (window.confirm('Isi data dummy untuk 6 bulan (Jan-Jun 2026)? Data existing akan ditimpa.')) {
      const result = seedDummyData();
      alert(`✅ Berhasil! ${result.transactionCount} transaksi dan ${result.budgetCount} budget diisi.`);
      window.location.reload();
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1><SettingsIcon size={24} /> Pengaturan</h1>
        <Button variant="outline" onClick={handleSeedData} icon={Database}>
          Isi Data Dummy (6 Bulan)
        </Button>
      </div>

      <div className="tab-switcher">
        <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          <Tag size={16} /> Kategori
        </button>
        <button className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`} onClick={() => setActiveTab('accounts')}>
          <CreditCard size={16} /> Akun
        </button>
      </div>

      {activeTab === 'categories' ? <CategoriesSettings /> :
       <AccountsSettings />}
    </div>
  );
}

function CategoriesSettings() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  const handleDelete = (id) => {
    if (window.confirm('Hapus kategori ini? Transaksi terkait tidak akan dihapus.')) {
      deleteCategory(id);
    }
  };

  return (
    <div>
      <div className="section-header">
        <p className="section-desc">Kelola kategori pemasukan dan pengeluaran Anda.</p>
        <Button variant="primary" onClick={() => { setEditCategory(null); setShowForm(true); }} icon={Plus}>
          Tambah Kategori
        </Button>
      </div>

      <div className="categories-list">
        {categories.map(cat => (
          <Card key={cat.id}>
            <CardBody>
              <div className="category-item">
                <div className="category-header">
                  <span className="cat-color" style={{ background: cat.color }}></span>
                  <div className="cat-info">
                    <h4>{cat.name}</h4>
                    <span className={`cat-type ${cat.type}`}>{cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
                  </div>
                </div>
                <div className="category-actions">
                  <button className="icon-btn" onClick={() => { setEditCategory(cat); setShowForm(true); }}><Edit size={14} /></button>
                  <button className="icon-btn danger" onClick={() => handleDelete(cat.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              {cat.subcategories && cat.subcategories.length > 0 && (
                <div className="subcategories">
                  <span className="sub-label">Subkategori:</span>
                  <div className="sub-list">
                    {cat.subcategories.map(sub => (
                      <span key={sub.id} className="sub-item">{sub.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <CategoryFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditCategory(null); }}
        category={editCategory}
      />
    </div>
  );
}

function CategoryFormModal({ isOpen, onClose, category }) {
  const { addCategory, updateCategory } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3b82f6',
    subcategories: '',
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color,
        subcategories: category.subcategories?.map(s => s.name).join('\n') || '',
      });
    } else {
      setFormData({ name: '', type: 'expense', color: '#3b82f6', subcategories: '' });
    }
  }, [category, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subcategories = formData.subcategories
      .split('\n')
      .filter(s => s.trim())
      .map((name, i) => ({ id: `sub-${Date.now()}-${i}`, name: name.trim() }));

    const data = { ...formData, subcategories };

    if (category) {
      updateCategory(category.id, data);
    } else {
      addCategory(data);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Edit Kategori' : 'Tambah Kategori'} size="sm">
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Nama Kategori"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
        <FormSelect
          label="Tipe"
          value={formData.type}
          onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
          options={[
            { value: 'expense', label: 'Pengeluaran' },
            { value: 'income', label: 'Pemasukan' },
          ]}
        />
        <div className="form-group">
          <label className="form-label">Warna</label>
          <input
            type="color"
            value={formData.color}
            onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="color-picker"
          />
        </div>
        <FormTextarea
          label="Subkategori (satu per baris)"
          value={formData.subcategories}
          onChange={e => setFormData(prev => ({ ...prev, subcategories: e.target.value }))}
          placeholder="Subkategori 1&#10;Subkategori 2"
          rows={4}
        />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">{category ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AccountsSettings() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState(null);

  const handleDelete = (id) => {
    if (window.confirm('Hapus akun ini?')) {
      deleteAccount(id);
    }
  };

  return (
    <div>
      <div className="section-header">
        <p className="section-desc">Kelola akun kas, bank, dan e-wallet Anda.</p>
        <Button variant="primary" onClick={() => { setEditAccount(null); setShowForm(true); }} icon={Plus}>
          Tambah Akun
        </Button>
      </div>

      <div className="accounts-list">
        {accounts.map(acc => (
          <Card key={acc.id}>
            <CardBody>
              <div className="account-item">
                <div className="account-info">
                  <h4>{acc.name}</h4>
                  <div className="account-meta">
                    <span className={`account-type ${acc.type}`}>{acc.type === 'cash' ? 'Kas' : acc.type === 'bank' ? 'Bank' : 'E-Wallet'}</span>
                    <span className={`account-status ${acc.isActive ? 'active' : 'inactive'}`}>{acc.isActive ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                </div>
                <div className="account-right">
                  <span className="account-balance">Saldo: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(acc.balance || 0)}</span>
                  <div className="account-actions">
                    <button className="icon-btn" onClick={() => { setEditAccount(acc); setShowForm(true); }}><Edit size={14} /></button>
                    <button className="icon-btn danger" onClick={() => handleDelete(acc.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <AccountFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditAccount(null); }}
        account={editAccount}
      />
    </div>
  );
}

function AccountFormModal({ isOpen, onClose, account }) {
  const { addAccount, updateAccount } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    balance: '0',
    isActive: true,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
        isActive: account.isActive,
      });
    } else {
      setFormData({ name: '', type: 'bank', balance: '0', isActive: true });
    }
  }, [account, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, balance: parseFloat(formData.balance) };
    if (account) {
      updateAccount(account.id, data);
    } else {
      addAccount(data);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={account ? 'Edit Akun' : 'Tambah Akun'} size="sm">
      <form onSubmit={handleSubmit}>
        <FormInput
          label="Nama Akun"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Contoh: Bank BCA"
          required
        />
        <FormSelect
          label="Tipe"
          value={formData.type}
          onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
          options={[
            { value: 'cash', label: 'Kas' },
            { value: 'bank', label: 'Bank' },
            { value: 'ewallet', label: 'E-Wallet' },
          ]}
        />
        <FormInput
          label="Saldo Awal"
          type="number"
          value={formData.balance}
          onChange={e => setFormData(prev => ({ ...prev, balance: e.target.value }))}
        />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          />
          <span>Aktif</span>
        </label>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">{account ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}
