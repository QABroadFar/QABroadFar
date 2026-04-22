import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { FormInput, FormSelect, FormTextarea } from '../components/Form';
import {
  Plus, Edit, Trash2, Settings as SettingsIcon,
  CreditCard, Tag, Database, AlertTriangle,
} from 'lucide-react';
import IconPicker, { EmojiDisplay } from '../components/IconPicker';
import './Settings.css';
import seedDummyData from '../utils/seedDummyData';
import { defaultRecurringPayments, defaultAccounts } from '../utils/defaults';
import { storage } from '../utils/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/* ─── Main Settings ──────────────────────────────────────── */
export default function Settings() {
  const [activeTab, setActiveTab] = useState('categories');
  const { resetAllData } = useApp();

  /* ── Handlers (logic unchanged) ────────────────────────── */
  const handleSeedData = () => {
    if (window.confirm('Isi data dummy untuk 6 bulan (Jan–Jun 2026)? Data existing akan ditimpa.')) {
      const result = seedDummyData();
      alert(`✅ Berhasil! ${result.transactionCount} transaksi dan ${result.budgetCount} budget diisi.`);
      window.location.reload();
    }
  };
  const handleResetAllTransactions = async () => {
    if (window.confirm('⚠️ Hapus SEMUA transaksi?\n\nData transaksi, budget, dan riwayat akan terhapus dari local dan Supabase.\nKategori dan Akun tetap tersimpan.')) {
      if (window.confirm('Tindakan ini TIDAK BISA dibatalkan. Lanjutkan?')) {
        storage.set('transactions', []);
        storage.set('budgets', []);
        storage.set('recurringPayments', defaultRecurringPayments);
        storage.set('debts', []);
        storage.set('receivables', []);
        storage.set('assets', []);
        storage.set('savings', []);

        const currentAccounts = storage.get('accounts', defaultAccounts);
        const resetAccounts   = currentAccounts.map(a => ({ ...a, balance: 0 }));
        storage.set('accounts', resetAccounts);

        if (isSupabaseConfigured()) {
          try {
            await supabase.from('transactions').delete().neq('id', '000');
            await supabase.from('budgets').delete().neq('id', '000');
            await supabase.from('recurring_payments').delete().neq('id', '000');
            await supabase.from('debts').delete().neq('id', '000');
            await supabase.from('receivables').delete().neq('id', '000');
            await supabase.from('assets').delete().neq('id', '000');
            await supabase.from('savings').delete().neq('id', '000');
            for (const acc of resetAccounts) {
              await supabase.from('accounts').update({ balance: 0 }).eq('id', acc.id);
            }
          } catch (err) {
            console.error('Failed to delete from Supabase:', err);
          }
        }

        resetAllData();
        alert('✅ Semua data transaksi berhasil dihapus!');
      }
    }
  };

  return (
    <div className="settings-page">

      {/* ── Page header ── */}
      <div className="page-header">
        <h1><SettingsIcon size={20} /> Pengaturan</h1>
      </div>

      {/* ── Tab switcher ── */}
      <div className="tab-switcher">
        <button
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={15} /> Kategori
        </button>
        <button
          className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          <CreditCard size={15} /> Akun
        </button>
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'categories' ? <CategoriesSettings /> : <AccountsSettings />}

      {/* ── Danger zone — diletakkan di bawah, bukan di header ── */}
      <div className="danger-zone">
        <div className="danger-zone-title">
          <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Zona Berbahaya
        </div>
        <p className="danger-zone-desc">
          Tindakan di bawah bersifat permanen dan tidak dapat dibatalkan.
          Kategori dan akun tidak akan terhapus.
        </p>
        <div className="danger-zone-actions">
          <Button variant="outline" size="sm" onClick={handleSeedData} icon={Database}>
            Isi Data Dummy (6 Bulan)
          </Button>
          <Button variant="danger" size="sm" onClick={handleResetAllTransactions} icon={Trash2}>
            Reset Semua Transaksi
          </Button>
        </div>
      </div>

    </div>
  );
}

/* ─── Categories Settings ────────────────────────────────── */
function CategoriesSettings() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [showForm,     setShowForm]     = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData,     setFormData]     = useState({
    name: '', type: 'expense', color: '#3b82f6', icon: '', categoryGroup: 'kebutuhan', subcategories: '',
  });

  /* ── Open edit form ── */
  const openEdit = (cat) => {
    setEditCategory(cat);
    setFormData({
      name:          cat.name,
      type:          cat.type,
      color:         cat.color,
      icon:          cat.icon || '',
      categoryGroup: cat.categoryGroup || 'kebutuhan',
      subcategories: cat.subcategories?.map(s => s.name).join('\n') || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditCategory(null);
    setFormData({ name: '', type: 'expense', color: '#3b82f6', icon: '', categoryGroup: 'kebutuhan', subcategories: '' });
  };

  /* ── Submit (logic unchanged) ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    const subcategories = formData.subcategories
      .split('\n')
      .filter(s => s.trim())
      .map((name, i) => ({ id: `sub-${Date.now()}-${i}`, name: name.trim() }));

    const data = { ...formData, subcategories };

    if (editCategory) {
      updateCategory(editCategory.id, data);
    } else {
      addCategory(data);
    }
    closeForm();
  };

  return (
    <div className="settings-section">

      {/* Section header */}
      <div className="section-header">
        <h2>Kategori</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)} icon={Plus}>
          Tambah
        </Button>
      </div>

      {/* List */}
      {categories.length === 0 ? (
        <p className="empty-state">Belum ada kategori.</p>
      ) : (
        <div className="categories-list">
          {categories.map(cat => (
            <div key={cat.id} className="category-item">
              {/* Color dot */}
              <span className="cat-color" style={{ background: cat.color }} />

              {/* Name */}
              <span className="cat-name">
                <EmojiDisplay emoji={cat.icon} size={14} />
                {cat.name}
              </span>

              {/* Type badge */}
              <span
                className={`cat-type ${cat.type}`}
                data-type={cat.type}
              >
                {cat.type === 'income' ? 'Masuk' : 'Keluar'}
              </span>

              {/* Actions */}
              <div className="cat-actions">
                <button
                  className="icon-btn"
                  onClick={() => openEdit(cat)}
                  title="Edit kategori"
                  aria-label="Edit kategori"
                >
                  <Edit size={14} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => deleteCategory(cat.id)}
                  title="Hapus kategori"
                  aria-label="Hapus kategori"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editCategory ? 'Edit Kategori' : 'Kategori Baru'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="category-form">
          <FormInput
            label="Nama Kategori"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="Contoh: Makanan & Minuman"
            required
          />

          <div className="form-row">
            <FormSelect
              label="Tipe"
              value={formData.type}
              onChange={e => setFormData(p => ({ ...p, type: e.target.value, categoryGroup: e.target.value === 'expense' ? 'kebutuhan' : '' }))}
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </FormSelect>
            {formData.type === 'expense' && (
              <FormSelect
                label="Kategori"
                value={formData.categoryGroup}
                onChange={e => setFormData(p => ({ ...p, categoryGroup: e.target.value }))}
              >
                <option value="kebutuhan">Kebutuhan</option>
                <option value="keinginan">Keinginan</option>
                <option value="tabungan">Tabungan</option>
              </FormSelect>
            )}
            <div className="form-group">
              <label className="form-label">Warna</label>
              <input
                type="color"
                className="color-picker"
                value={formData.color}
                onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <IconPicker
              selectedEmoji={formData.icon || '☰'}
              onSelect={emoji => setFormData(p => ({ ...p, icon: emoji }))}
              color={formData.color}
            />
          </div>

          <FormInput
            label="Subkategori (pisahkan dengan enter)"
            multiline
            rows={3}
            value={formData.subcategories}
            onChange={e => setFormData(p => ({ ...p, subcategories: e.target.value }))}
            placeholder={"Sarapan\nMakan Siang\nMakan Malam"}
          />

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={closeForm}>Batal</Button>
            <Button type="submit" variant="primary">
              {editCategory ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

/* ─── Accounts Settings ──────────────────────────────────── */
function AccountsSettings() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useApp();
  const [showForm,    setShowForm]    = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [formData,    setFormData]    = useState({
    name: '', type: 'cash', initialBalance: '0',
  });

  const openEdit = (acc) => {
    setEditAccount(acc);
    setFormData({
      name:           acc.name,
      type:           acc.type,
      initialBalance: acc.balance?.toString() || '0',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditAccount(null);
    setFormData({ name: '', type: 'cash', initialBalance: '0' });
  };

   /* ── Submit (logic unchanged) ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    const { initialBalance, ...rest } = formData;
    if (editAccount) {
      // Preserve initial_balance on edit; only update name and type
      const data = { ...rest };
      updateAccount(editAccount.id, data);
    } else {
      const data = {
        ...rest,
        balance: parseFloat(initialBalance) || 0,
        initial_balance: parseFloat(initialBalance) || 0,
      };
      addAccount(data);
    }
    closeForm();
  };

  /* Account type label */
  const typeLabel = (type) => ({
    cash:           'Tunai',
    bank:           'Bank',
    credit_card:    'Kartu Kredit',
    digital_wallet: 'E-Wallet',
    investment:     'Investasi',
    savings:        'Tabungan',
  }[type] || type);

  return (
    <div className="settings-section">

      {/* Section header */}
      <div className="section-header">
        <h2>Akun</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)} icon={Plus}>
          Tambah
        </Button>
      </div>

      {/* List */}
      {accounts.length === 0 ? (
        <p className="empty-state">Belum ada akun.</p>
      ) : (
        <div className="accounts-list">
          {accounts.map(acc => (
            <div key={acc.id} className="account-item">
              {/* Info */}
              <div className="acc-info">
                <span className="acc-name">{acc.name}</span>
                <span className="acc-type">{typeLabel(acc.type)}</span>
              </div>

              {/* Balance */}
              {acc.balance !== undefined && (
                <span className="acc-balance">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
                  }).format(acc.balance)}
                </span>
              )}

              {/* Actions */}
              <div className="acc-actions">
                <button
                  className="icon-btn"
                  onClick={() => openEdit(acc)}
                  title="Edit akun"
                  aria-label="Edit akun"
                >
                  <Edit size={14} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={() => deleteAccount(acc.id)}
                  title="Hapus akun"
                  aria-label="Hapus akun"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editAccount ? 'Edit Akun' : 'Akun Baru'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="account-form">
          <FormInput
            label="Nama Akun"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="Contoh: BCA Tabungan"
            required
          />
           <FormSelect
             label="Tipe"
             value={formData.type}
             onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
           >
             <option value="cash">Tunai</option>
             <option value="bank">Bank</option>
             <option value="credit_card">Kartu Kredit</option>
             <option value="digital_wallet">E-Wallet</option>
             <option value="investment">Investasi</option>
             <option value="savings">Tabungan</option>
           </FormSelect>
           <FormInput
             label="Saldo Awal"
             type="number"
             value={formData.initialBalance}
             onChange={e => setFormData(p => ({ ...p, initialBalance: e.target.value }))}
             min="0"
             {...(editAccount ? { readOnly: true, title: 'Saldo awal tidak dapat diubah setelah akun dibuat' } : {})}
           />
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={closeForm}>Batal</Button>
            <Button type="submit" variant="primary">
              {editAccount ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}