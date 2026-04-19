import { useApp } from '../context/AppContext';
import Modal from './Modal';
import Button from './Button';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Edit, Trash2 } from 'lucide-react';

export default function TransactionDetailModal({ isOpen, onClose, transactions, title, onEdit }) {

  const { deleteTransaction, accounts, categories } = useApp();
  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId) || {};
  };

  const getSubcategoryInfo = (categoryId, subId) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return {};
    return cat.subcategories?.find(s => s.id === subId) || {};
  };

  const getAccountInfo = (accountId) => {
    return accounts.find(a => a.id === accountId) || {};
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus transaksi ini?')) {
      deleteTransaction(id);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {transactions.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
          Tidak ada transaksi untuk kategori ini.
        </p>
      ) : (
        <div className="transaction-detail-list">
          {transactions.map(tx => {
            const cat = getCategoryInfo(tx.categoryId);
            const sub = getSubcategoryInfo(tx.categoryId, tx.subcategoryId);
            const acc = getAccountInfo(tx.accountId);
            return (
              <div key={tx.id} className="tx-detail-item">
                <div className="tx-detail-header">
                  <div className="tx-detail-info">
                    <span className="tx-detail-date">{formatDate(tx.date)}</span>
                    <span className="tx-detail-cat">
                      {cat.name}
                      {sub.name && <span> → {sub.name}</span>}
                    </span>
                  </div>
                  <span className="tx-detail-amount">{formatCurrency(tx.amount)}</span>
                </div>
                <div className="tx-detail-meta">
                  <span>{acc.name}</span>
                  {tx.note && <span>• {tx.note}</span>}
                </div>
                <div className="tx-detail-actions">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(tx)}>
                    <Edit size={14} /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(tx.id)}>
                    <Trash2 size={14} /> Hapus
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
