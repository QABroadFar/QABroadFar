import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import Button from './Button';
import { FormSelect } from './Form';
import { Plus, Trash2, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { readFile, utils } from 'xlsx';
import './BulkTransactionForm.css';

export default function BulkTransactionForm({ isOpen, onClose }) {
  const { accounts, categories, addTransaction } = useApp();
  const [mode, setMode] = useState('manual'); // 'manual' or 'import'
  const [items, setItems] = useState([
    { type: 'expense', amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', subcategoryId: '', accountId: '', note: '' },
  ]);
  const [importPreview, setImportPreview] = useState(null);
  const fileInputRef = useRef(null);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const addItem = () => {
    setItems(prev => [...prev, { type: 'expense', amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', subcategoryId: '', accountId: '', note: '' }]);
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'categoryId') updated[index].subcategoryId = '';
      return updated;
    });
  };

  const handleSubmit = () => {
    const validItems = items.filter(item => item.amount && item.categoryId && item.accountId);
    let count = 0;
    validItems.forEach(item => {
      addTransaction({
        ...item,
        amount: parseFloat(item.amount),
      });
      count++;
    });
    alert(`✅ ${count} transaksi berhasil ditambahkan!`);
    setItems([{ type: 'expense', amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', subcategoryId: '', accountId: '', note: '' }]);
    setImportPreview(null);
    onClose();
  };

  const downloadTemplate = () => {
    const headers = ['Tanggal (YYYY-MM-DD)', 'Tipe (income/expense)', 'Kategori ID', 'Subkategori ID (opsional)', 'Akun ID', 'Nominal', 'Catatan (opsional)'];
    const example = ['2026-04-15', 'expense', 'cat-1', 'sub-1', 'acc-2', '50000', 'Belanja'];
    const ws = utils.aoa_to_sheet([headers, example]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Template');
    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 25 }));
    const { writeFile } = require('xlsx');
    writeFile(wb, 'template_transaksi.xlsx');
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = readFile(event.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = utils.sheet_to_json(worksheet, { header: 1 });

        if (rawData.length < 2) {
          alert('File kosong atau tidak memiliki data yang valid.');
          return;
        }

        // Parse header and data
        const dataRows = rawData.slice(1).filter(row => row.length > 0);
        const parsedItems = dataRows.map(row => ({
          date: row[0] ? String(row[0]).trim() : new Date().toISOString().split('T')[0],
          type: row[1] ? String(row[1]).trim() : 'expense',
          categoryId: row[2] ? String(row[2]).trim() : '',
          subcategoryId: row[3] ? String(row[3]).trim() : '',
          accountId: row[4] ? String(row[4]).trim() : '',
          amount: row[5] ? parseFloat(row[5]) : 0,
          note: row[6] ? String(row[6]).trim() : '',
        })).filter(item => item.amount > 0 && item.categoryId && item.accountId);

        if (parsedItems.length === 0) {
          alert('Tidak ada data valid yang ditemukan. Pastikan format sesuai template.');
          return;
        }

        setImportPreview(parsedItems);
        setItems(parsedItems);
        alert(`✅ ${parsedItems.length} baris data berhasil dibaca dari file.`);
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file. Pastikan format sesuai template.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setImportPreview(null); }} title="Input Transaksi Massal" size="xl">
      <div className="bulk-form">
        <div className="bulk-mode-toggle">
          <button className={`mode-btn ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
            ✍️ Input Manual
          </button>
          <button className={`mode-btn ${mode === 'import' ? 'active' : ''}`} onClick={() => setMode('import')}>
            📁 Import File
          </button>
        </div>

        {mode === 'import' && (
          <div className="import-section">
            <div className="import-actions">
              <Button variant="outline" onClick={downloadTemplate} icon={Download}>
                Download Template
              </Button>
              <div className="file-upload">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileImport}
                  className="file-input"
                />
                <Button variant="primary" onClick={() => fileInputRef.current?.click()} icon={Upload}>
                  Pilih File Excel/CSV
                </Button>
              </div>
            </div>
            {importPreview && (
              <p className="import-status">
                ✅ {importPreview.length} transaksi siap ditambahkan. Scroll ke bawah untuk review.
              </p>
            )}
            <div className="import-info">
              <h4>Format Template:</h4>
              <table className="template-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Tipe</th>
                    <th>Kategori ID</th>
                    <th>Akun ID</th>
                    <th>Nominal</th>
                    <th>Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2026-04-15</td>
                    <td>expense</td>
                    <td>cat-1</td>
                    <td>acc-2</td>
                    <td>50000</td>
                    <td>Belanja</td>
                  </tr>
                </tbody>
              </table>
              <p className="import-note">
                💡 <strong>Tip:</strong> Gunakan Kategori ID dan Akun ID yang tersedia di Pengaturan.
                Tipe: <code>income</code> atau <code>expense</code>.
              </p>
            </div>
          </div>
        )}

        <div className="bulk-items">
          <div className="bulk-item-header">
            <span className="bi-num">#</span>
            <span className="bi-type">Tipe</span>
            <span className="bi-amount">Nominal</span>
            <span className="bi-date">Tanggal</span>
            <span className="bi-cat">Kategori</span>
            <span className="bi-subcat">Subkategori</span>
            <span className="bi-acc">Akun</span>
            <span className="bi-note">Catatan</span>
            <span className="bi-action"></span>
          </div>

          {items.map((item, index) => {
            const selectedCat = categories.find(c => c.id === item.categoryId);
            return (
              <div key={index} className="bulk-item">
                <span className="bi-num">{index + 1}</span>
                <select
                  className="bi-type"
                  value={item.type}
                  onChange={e => updateItem(index, 'type', e.target.value)}
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
                <input
                  type="number"
                  className="bi-amount"
                  value={item.amount}
                  onChange={e => updateItem(index, 'amount', e.target.value)}
                  placeholder="0"
                  min="1"
                />
                <input
                  type="date"
                  className="bi-date"
                  value={item.date}
                  onChange={e => updateItem(index, 'date', e.target.value)}
                />
                <select
                  className="bi-cat"
                  value={item.categoryId}
                  onChange={e => updateItem(index, 'categoryId', e.target.value)}
                >
                  <option value="">Kategori</option>
                  {(item.type === 'expense' ? expenseCategories : incomeCategories).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  className="bi-subcat"
                  value={item.subcategoryId}
                  onChange={e => updateItem(index, 'subcategoryId', e.target.value)}
                >
                  <option value="">Sub</option>
                  {selectedCat?.subcategories?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select
                  className="bi-acc"
                  value={item.accountId}
                  onChange={e => updateItem(index, 'accountId', e.target.value)}
                >
                  <option value="">Akun</option>
                  {accounts.filter(a => a.isActive).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="bi-note"
                  value={item.note}
                  onChange={e => updateItem(index, 'note', e.target.value)}
                  placeholder="Catatan"
                />
                <button className="bi-remove" onClick={() => removeItem(index)} title="Hapus baris">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="bulk-actions">
          <Button variant="outline" onClick={addItem} icon={Plus}>
            Tambah Baris
          </Button>
          <div className="bulk-submit-actions">
            <Button variant="outline" onClick={() => onClose()}>Batal</Button>
            <Button variant="success" onClick={handleSubmit}>
              Simpan {items.length} Transaksi
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
