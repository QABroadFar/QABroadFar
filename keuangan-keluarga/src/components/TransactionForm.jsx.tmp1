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
  });

  useEffect(() => {
    if (editTransaction) {
      setFormData({
        type: editTransaction.type,
        amount: formatNumber(editTransaction.amount.toString()),
        date: editTransaction.date,
        categoryId: editTransaction.categoryId,
        subcategoryId: editTransaction.subcategoryId || '',
        accountId: editTransaction.accountId,
        note: editTransaction.note || '',
      });
    } else if (prefill) {
      setFormData({
        type: prefill.type || 'expense',
        amount: prefill.amount ? formatNumber(prefill.amount.toString()) : '',
        date: prefill.date || new Date().toISOString().split('T')[0],
        categoryId: prefill.categoryId || '',
        subcategoryId: prefill.subcategoryId || '',
        accountId: prefill.accountId || '',
        note: prefill.note || '',
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
      });
    }
  }, [editTransaction, prefill, isOpen]);

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

