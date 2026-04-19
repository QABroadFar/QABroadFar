import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import Button from './Button';
import { FormInput, FormSelect, FormTextarea, FormRow } from './Form';

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
    }
  }, [editTransaction, prefill, isOpen]);

  // Watch for categoryId changes to update selectedCategoryGroup
  useEffect(() => {
    if (formData.categoryId) {
      const selectedCat = categories.find(c => c.id === formData.categoryId);
      setFormData(prev => ({ ...prev, selectedCategoryGroup: selectedCat?.categoryGroup || '' }));
    } else {
      setFormData(prev => ({ ...prev, selectedCategoryGroup: '' }));
    }
  }, [formData.categoryId, categories]);

  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

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

  // Format number with thousand separator comma
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Parse formatted string back to number
  const parseNumber = (str) => {
    return parseInt(str.replace(/,/g, ''), 10) || 0;
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const formatted = raw ? formatNumber(raw) : '';
    setFormData(prev => ({ ...prev, amount: formatted }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'categoryId') {
      setFormData(prev => ({ ...prev, subcategoryId: '', selectedCategoryGroup: '' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'} size="md">
      <form onSubmit={handleSubmit}>
        <FormSelect
          label="Tipe"
          value={formData.type}
          onChange={e => handleChange('type', e.target.value)}
          options={[
            { value: 'expense', label: 'Pengeluaran' },
            { value: 'income', label: 'Pemasukan' },
          ]}
          required
        />

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

        <FormRow>
          {/* Category Group Dropdown for Expense */}
          {formData.type === 'expense' && (
            <>
              <FormSelect
                label="Kategori Grup"
                value={formData.selectedCategoryGroup}
                onChange={e => handleChange('selectedCategoryGroup', e.target.value)}
              >
                <option value="">Pilih Grup Kategori</option>
                <option value="kebutuhan">Kebutuhan</option>
                <option value="keinginan">Keinginan</option>
                <option value="tabungan">Tabungan</option>
              </FormSelect>
            </>
          )}
          <FormSelect
            label="Kategori"
            value={formData.categoryId}
            onChange={e => {
              handleChange('categoryId', e.target.value);
              // Update selectedCategoryGroup when category is selected
              if (e.target.value) {
                const selectedCat = categories.find(c => c.id === e.target.value);
                setFormData(prev => ({ ...prev, selectedCategoryGroup: selectedCat?.categoryGroup || '' }));
              }
            }}
            options={(formData.type === 'expense' 
              ? expenseCategories.filter(c => formData.selectedCategoryGroup ? c.categoryGroup === formData.selectedCategoryGroup : true)
              : incomeCategories).map(c => ({
                value: c.id,
                label: c.name,
              }))}
            placeholder="Pilih kategori"
            required
          />
          {selectedCategory && selectedCategory.subcategories.length > 0 && (
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
        </FormRow>

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

        <FormTextarea
          label="Catatan (opsional)"
          value={formData.note}
          onChange={e => handleChange('note', e.target.value)}
          placeholder="Tambahkan catatan..."
          rows={2}
        />

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={() => onClose(null)}>Batal</Button>
          <Button type="submit" variant="primary">{editTransaction ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}
