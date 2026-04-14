import { useState } from 'react';
import { Plus } from 'lucide-react';
import TransactionForm from './TransactionForm';
import './FloatingActionButton.css';

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="fab" onClick={() => setIsOpen(true)} title="Tambah Transaksi Cepat">
        <Plus size={24} />
      </button>
      <TransactionForm isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
