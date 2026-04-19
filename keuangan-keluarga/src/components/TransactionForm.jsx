import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import Button from './Button';
import { FormInput, FormSelect, FormTextarea, FormRow } from './Form';

const GROUP_CONFIG = {
  kebutuhan: {
    label: 'Kebutuhan',
    emoji: '🏠',
    color: '#2563eb',
    bgActive: '#2563eb',
    bgInactive: '#eff6ff',
    textActive: '#ffffff',
    textInactive: '#1d4ed8',
    borderActive: '#2563eb',
    borderInactive: '#bfdbfe',
    pillBg: '#eff6ff',
    pillBgSelected: '#2563eb',
    pillText: '#1d4ed8',
    pillTextSelected: '#ffffff',
    pillBorder: '#bfdbfe',
    pillBorderSelected: '#2563eb',
  },
  keinginan: {
    label: 'Keinginan',
    emoji: '✨',
    color: '#7c3aed',
    bgActive: '#7c3aed',
    bgInactive: '#f5f3ff',
    textActive: '#ffffff',
    textInactive: '#6d28d9',
    borderActive: '#7c3aed',
    borderInactive: '#ddd6fe',
    pillBg: '#f5f3ff',
    pillBgSelected: '#7c3aed',
    pillText: '#6d28d9',
    pillTextSelected: '#ffffff',
    pillBorder: '#ddd6fe',
    pillBorderSelected: '#7c3aed',
  },
  tabungan: {
    label: 'Tabungan',
    emoji: '🐖',
    color: '#059669',
    bgActive: '#059669',
    bgInactive: '#ecfdf5',
    textActive: '#ffffff',
    textInactive: '#047857',
    borderActive: '#059669',
    borderInactive: '#a7f3d0',
    pillBg: '#ecfdf5',
    pillBgSelected: '#059669',
    pillText: '#047857',
    pillTextSelected: '#ffffff',
    pillBorder: '#a7f3d0',
    pillBorderSelected: '#059669',
  },
};

export default function TransactionForm({ isOpen, onClose, editTransaction, prefill }) {
  const { accounts, categories, addTransaction, updateTransaction } = useApp();

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    subcategoryId: '',
    accountId: '',
    note: '',
    selectedCategoryGroup: '',
  });

  const [showSubcategory, setShowSubcategory] = useState(false);

  useEffect(() => {
    if (editTransaction) {
      const selectedCat = categories.find(c => c.id === editTransaction.categoryId);
      setFormData({
        type: editTransaction.type,
        amount: formatNumber(editTransaction.amount.toString()),
        date: editTransaction.date,
        categoryId: editTransaction.categoryId,
        subcategoryId: editTransaction.subcategoryId || '',
        accountId: editTransaction.accountId,
        note: editTransaction.note || '',
        selectedCategoryGroup: selectedCat?.categoryGroup || '',
      });
      setShowSubcategory(!!editTransaction.subcategoryId);
    } else if (prefill) {
      const selectedCat = categories.find(c => c.id === prefill.categoryId);
      setFormData({
        type: prefill.type || 'expense',
        amount: prefill.amount ? formatNumber(prefill.amount.toString()) : '',
        date: prefill.date || new Date().toISOString().split('T')[0],
        categoryId: prefill.categoryId || '',
        subcategoryId: prefill.subcategoryId || '',
        accountId: prefill.accountId || '',
        note: prefill.note || '',
        selectedCategoryGroup: selectedCat?.categoryGroup || '',
      });
      setShowSubcategory(!!prefill.subcategoryId);
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        subcategoryId: '',
        accountId: '',
        note: '',
        selectedCategoryGroup: '',
      });
      setShowSubcategory(false);
    }
  }, [editTransaction, prefill, isOpen]);

  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const filteredCategories = formData.type === 'expense'
    ? expenseCategories.filter(c =>
        formData.selectedCategoryGroup ? c.categoryGroup === formData.selectedCategoryGroup : true
      )
    : incomeCategories;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      type: formData.type,
      amount: parseNumber(formData.amount),
      date: formData.date,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId,
      accountId: formData.accountId,
      note: formData.note,
    };

    if (editTransaction) {
      updateTransaction(editTransaction.id, data);
      onClose(data);
    } else {
      const newTx = addTransaction(data);
      onClose(newTx);
    }
  };

  const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const parseNumber = (str) => parseInt(str.replace(/,/g, ''), 10) || 0;

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const formatted = raw ? formatNumber(raw) : '';
    setFormData(prev => ({ ...prev, amount: formatted }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGroupSelect = (group) => {
    setFormData(prev => ({
      ...prev,
      selectedCategoryGroup: prev.selectedCategoryGroup === group ? '' : group,
      categoryId: '',
      subcategoryId: '',
    }));
    setShowSubcategory(false);
  };

  const handleCategorySelect = (categoryId) => {
    setFormData(prev => ({ ...prev, categoryId, subcategoryId: '' }));
    setShowSubcategory(false);
  };

  const handleTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      categoryId: '',
      subcategoryId: '',
      selectedCategoryGroup: '',
    }));
    setShowSubcategory(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'} size="md">
      <form onSubmit={handleSubmit}>

        {/* Type Toggle */}
        <div className="type-toggle">
          <button
            type="button"
            className={`type-btn type-btn--expense ${formData.type === 'expense' ? 'active' : ''}`}
            onClick={() => handleTypeChange('expense')}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            className={`type-btn type-btn--income ${formData.type === 'income' ? 'active' : ''}`}
            onClick={() => handleTypeChange('income')}
          >
            Pemasukan
          </button>
        </div>

        {/* Amount + Date */}
        <FormRow>
          <div>
            <FormInput
              label="Nominal"
              type="text"
              inputMode="numeric"
              value={formData.amount}
              onChange={handleAmountChange}
              placeholder="0"
              required
              className="amount-input"
            />
          </div>
          <FormInput
            label="Tanggal"
            type="date"
            value={formData.date}
            onChange={e => handleChange('date', e.target.value)}
            required
          />
        </FormRow>

        {/* Category Section */}
        <div className="category-section">
          <label className="form-label">
            Kategori <span className="required">*</span>
          </label>

          {/* Group Buttons — only for expense */}
          {formData.type === 'expense' && (
            <div className="group-btn-row">
              {Object.entries(GROUP_CONFIG).map(([key, cfg]) => {
                const isActive = formData.selectedCategoryGroup === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className="group-btn"
                    style={{
                      background: isActive ? cfg.bgActive : cfg.bgInactive,
                      color: isActive ? cfg.textActive : cfg.textInactive,
                      border: `1.5px solid ${isActive ? cfg.borderActive : cfg.borderInactive}`,
                    }}
                    onClick={() => handleGroupSelect(key)}
                  >
                    <span className="group-btn-emoji">{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Category Pills */}
          {(formData.type === 'income' || formData.selectedCategoryGroup || formData.type === 'expense') && (
            <div className="category-pill-grid">
              {filteredCategories.length === 0 && (
                <span className="category-empty">Pilih grup dulu</span>
              )}
              {filteredCategories.map(cat => {
                const isSelected = formData.categoryId === cat.id;
                const cfg = GROUP_CONFIG[cat.categoryGroup] || GROUP_CONFIG['kebutuhan'];
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-pill ${isSelected ? 'selected' : ''}`}
                    style={
                      isSelected
                        ? {
                            background: cfg.pillBgSelected,
                            color: cfg.pillTextSelected,
                            border: `1.5px solid ${cfg.pillBorderSelected}`,
                          }
                        : {
                            background: cfg.pillBg,
                            color: cfg.pillText,
                            border: `1.5px solid ${cfg.pillBorder}`,
                          }
                    }
                    onClick={() => handleCategorySelect(cat.id)}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Subcategory — shown only if selected category has subcategories */}
          {selectedCategory && selectedCategory.subcategories?.length > 0 && (
            <div className="subcategory-section">
              {!showSubcategory ? (
                <button
                  type="button"
                  className="subcategory-toggle-btn"
                  onClick={() => setShowSubcategory(true)}
                >
                  ＋ Tambah Subkategori
                </button>
              ) : (
                <FormSelect
                  label="Subkategori"
                  value={formData.subcategoryId}
                  onChange={e => handleChange('subcategoryId', e.target.value)}
                  options={selectedCategory.subcategories.map(s => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  placeholder="Pilih subkategori"
                />
              )}
            </div>
          )}
        </div>

        {/* Account */}
        <FormRow>
          <FormSelect
            label="Akun"
            value={formData.accountId}
            onChange={e => handleChange('accountId', e.target.value)}
            options={accounts.filter(a => a.isActive).map(a => ({
              value: a.id,
              label: `${a.name} (${a.type})`,
            }))}
            placeholder="Pilih akun"
            required
          />
        </FormRow>

        {/* Note */}
        <FormTextarea
          label="Catatan (opsional)"
          value={formData.note}
          onChange={e => handleChange('note', e.target.value)}
          placeholder="Tambahkan catatan..."
          rows={2}
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={() => onClose(null)}>Batal</Button>
          <Button type="submit" variant="primary">{editTransaction ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}