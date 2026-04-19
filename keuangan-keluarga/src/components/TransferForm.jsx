import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import Button from './Button';
import { FormInput, FormSelect, FormTextarea, FormRow } from './Form';

export default function TransferForm({ isOpen, onClose }) {
  const { accounts, transferBetweenAccounts } = useApp();

  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
      });
    }
  }, [isOpen]);

  const activeAccounts = accounts.filter(a => a.isActive);
  const fromAccount = accounts.find(acc => acc.id === formData.fromAccountId);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const transferData = {
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: parseNumber(formData.amount),
        note: formData.note,
        date: formData.date
      };
      transferBetweenAccounts(transferData);
      onClose(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

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
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Antar Akun" size="md">
      <form onSubmit={handleSubmit}>
        <FormRow>
          <FormSelect
            label="Dari Akun"
            value={formData.fromAccountId}
            onChange={e => handleChange('fromAccountId', e.target.value)}
            options={activeAccounts.map(a => ({
              value: a.id,
              label: `${a.name} - Rp ${formatNumber((a.balance || 0).toString())}`,
            }))}
            placeholder="Pilih akun asal"
            required
          />

          <FormSelect
            label="Ke Akun"
            value={formData.toAccountId}
            onChange={e => handleChange('toAccountId', e.target.value)}
            options={activeAccounts
              .filter(a => a.id !== formData.fromAccountId)
              .map(a => ({
                value: a.id,
                label: `${a.name} (${a.type})`,
              }))}
            placeholder="Pilih akun tujuan"
            required
          />
        </FormRow>

        <FormRow>
          <div>
            <FormInput
              label="Nominal Transfer"
              type="text"
              inputMode="numeric"
              value={formData.amount}
              onChange={handleAmountChange}
              placeholder="0"
              required
              className="amount-input"
            />
            {fromAccount && parseNumber(formData.amount) > (fromAccount.balance || 0) && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                ⚠️ Saldo tidak cukup (tersedia: Rp {formatNumber((fromAccount.balance || 0).toString())})
              </p>
            )}
          </div>
          <FormInput
            label="Tanggal"
            type="date"
            value={formData.date}
            onChange={e => handleChange('date', e.target.value)}
            required
          />
        </FormRow>

        <FormTextarea
          label="Catatan (opsional)"
          value={formData.note}
          onChange={e => handleChange('note', e.target.value)}
          placeholder="Tambahkan catatan transfer..."
          rows={2}
        />

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button variant="outline" onClick={() => onClose(null)}>Batal</Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={
              !formData.fromAccountId || 
              !formData.toAccountId || 
              !formData.amount || 
              parseNumber(formData.amount) <= 0 ||
              (fromAccount && parseNumber(formData.amount) > (fromAccount.balance || 0))
            }
          >
            Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
