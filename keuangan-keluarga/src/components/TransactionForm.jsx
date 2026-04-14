import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import Button from './Button';
import { FormInput, FormSelect, FormTextarea, FormRow } from './Form';

export default function TransactionForm({ isOpen, onClose, editTransaction }) {
  const { members, accounts, categories, addTransaction, updateTransaction } = useApp();

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    subcategoryId: '',
    accountId: '',
    memberId: '',
    note: '',
  });

  useEffect(() => {
    if (editTransaction) {
      setFormData({
        type: editTransaction.type,
        amount: editTransaction.amount.toString(),
        date: editTransaction.date,
        categoryId: editTransaction.categoryId,
        subcategoryId: editTransaction.subcategoryId || '',
        accountId: editTransaction.accountId,
        memberId: editTransaction.memberId,
        note: editTransaction.note || '',
      });
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        subcategoryId: '',
        accountId: '',
        memberId: '',
        note: '',
      });
    }
  }, [editTransaction, isOpen]);

  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (editTransaction) {
      updateTransaction(editTransaction.id, data);
    } else {
      addTransaction(data);
    }
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'categoryId') {
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
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
          <FormInput
            label="Nominal"
            type="number"
            value={formData.amount}
            onChange={e => handleChange('amount', e.target.value)}
            placeholder="0"
            required
            min="1"
            step="1"
          />
          <FormInput
            label="Tanggal"
            type="date"
            value={formData.date}
            onChange={e => handleChange('date', e.target.value)}
            required
          />
        </FormRow>

        <FormRow>
          <FormSelect
            label="Kategori"
            value={formData.categoryId}
            onChange={e => handleChange('categoryId', e.target.value)}
            options={(formData.type === 'expense' ? expenseCategories : incomeCategories).map(c => ({
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
          <FormSelect
            label="Anggota"
            value={formData.memberId}
            onChange={e => handleChange('memberId', e.target.value)}
            options={members.filter(m => m.isActive).map(m => ({
              value: m.id,
              label: m.name,
            }))}
            placeholder="Pilih anggota"
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
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="primary">{editTransaction ? 'Simpan' : 'Tambah'}</Button>
        </div>
      </form>
    </Modal>
  );
}
