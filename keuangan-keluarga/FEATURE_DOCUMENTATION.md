# Dokumentasi Fitur Aplikasi Keuangan Keluarga

Dokumen ini berisi deskripsi lengkap setiap halaman, komponen, dan fitur untuk keperluan redesign UI oleh AI.

---

## Struktur Aplikasi
- Layout dengan Sidebar kiri + Header atas + Konten utama
- State management menggunakan Context API (`AppContext.jsx`)
- Penyimpanan data menggunakan LocalStorage
- Semua halaman responsive untuk mobile dan desktop

---

## 1. Halaman Dashboard (`/pages/Dashboard.jsx`)
**Deskripsi**: Halaman utama yang menampilkan ringkasan keuangan

✅ **Fitur Utama**:
- Saldo Total semua akun
- Grafik Pengeluaran vs Pemasukan per bulan
- Ringkasan Bulan ini (Total Pemasukan, Total Pengeluaran, Sisa)
- 5 Transaksi terakhir
- Ringkasan Budget (yang terpakai vs total)
- Ringkasan Utang (yang harus dibayar)
- Progress Tabungan

✅ **Komponen yang digunakan**:
- Card, Statistic Card, Bar Chart, Line Chart, Transaction List

---

## 2. Halaman Transaksi (`/pages/Transactions.jsx`)
**Deskripsi**: Manajemen semua transaksi pengguna

✅ **Fitur Utama**:
- ✅ Daftar semua transaksi dengan pagination
- ✅ Filter transaksi berdasarkan:
  - Pencarian teks
  - Tipe (Pemasukan/Pengeluaran)
  - Kategori
  - Akun
  - Rentang tanggal
- ✅ Tombol **Tambah Transaksi** (single entry)
- ✅ Tombol **Import Bulk** (masukan banyak transaksi sekaligus)
- ✅ Edit dan Hapus transaksi
- ✅ Hitung total bersih dari transaksi terfilter
- ✅ Format mata uang Rupiah otomatis
- ✅ Tampilan badge warna untuk setiap kategori

✅ **Modal Terkait**:
- `TransactionForm.jsx` - Form tambah/edit transaksi tunggal
- `BulkTransactionForm.jsx` - Form import transaksi massal

---

## 3. Halaman Budget (`/pages/Budget.jsx`)
**Deskripsi**: Pengaturan dan tracking budget bulanan

✅ **Fitur Utama**:
- Daftar budget per kategori
- Progress bar persentase penggunaan budget
- Sisa budget yang tersedia
- Peringatan jika budget melebihi 80%
- Tambah/edit/hapus budget
- Set budget per periode (bulanan)
- Grafik perbandingan budget vs realisasi

---

## 4. Halaman Utang (`/pages/Debts.jsx`)
**Deskripsi**: Manajemen utang dan piutang

✅ **Fitur Utama**:
- Daftar Utang (yang harus kita bayar)
- Daftar Piutang (yang orang lain hutang ke kita)
- Total utang dan total piutang
- Tanggal jatuh tempo
- Status lunas/belum lunas
- Riwayat pembayaran cicilan
- Catatan utang
- Notifikasi jatuh tempo

---

## 5. Halaman Aset & Tabungan (`/pages/AssetsSavings.jsx`)
**Deskripsi**: Manajemen aset dan target tabungan

✅ **Fitur Utama**:
- Daftar semua akun dan saldonya
- Daftar target tabungan
- Progress pencapaian target tabungan
- Total aset bersih
- Riwayat perubahan saldo
- Tambah/edit/hapus akun
- Transfer antar akun

---

## 6. Halaman Transaksi Berulang (`/pages/Recurring.jsx`)
**Deskripsi**: Transaksi yang otomatis berulang secara periodik

✅ **Fitur Utama**:
- Daftar transaksi berulang
- Frekuensi: harian, mingguan, bulanan, tahunan
- Tanggal eksekusi selanjutnya
- Aktif/nonaktifkan transaksi berulang
- Tambah/edit/hapus transaksi berulang
- Riwayat transaksi yang sudah dijalankan

---

## 7. Halaman Laporan (`/pages/Reports.jsx`)
**Deskripsi**: Laporan dan analisis keuangan

✅ **Fitur Utama**:
- Laporan pengeluaran per kategori
- Laporan pemasukan per kategori
- Trend keuangan bulanan
- Laporan arus kas
- Filter berdasarkan rentang tanggal
- Export laporan ke PDF/Excel
- Grafik pie, bar, dan line chart

---

## 8. Halaman Pengaturan (`/pages/Settings.jsx`)
**Deskripsi**: Pengaturan aplikasi

✅ **Fitur Utama**:
- Manajemen Kategori (tambah/edit/hapus)
- Manajemen Subkategori
- Manajemen Akun
- Pengaturan mata uang
- Backup dan Restore data
- Reset data aplikasi
- Tentang aplikasi

---

## Komponen Penting

### 📄 BulkTransactionForm.jsx
✅ Fitur Import Transaksi Massal:
- Mode Input Manual (tambah banyak baris sekaligus)
- Mode Import File Excel/CSV
- Download Template Excel
- Preview data sebelum disimpan
- Validasi data otomatis
- Auto lookup kategori/akun berdasarkan nama atau ID
- Fix timezone untuk tanggal
- Bisa memakai NAMA Kategori dan NAMA Akun langsung di Excel

### 📄 Modal.jsx
- Komponen modal reusable dengan berbagai ukuran
- Bisa ditutup dengan klik luar atau tombol X
- Animasi buka/tutup

### 📄 Button.jsx
- Varian: primary, secondary, success, danger, outline
- Support icon
- Loading state
- Disable state

### 📄 Card.jsx
- Komponen card dengan header, body, dan footer
- Reusable untuk semua halaman

---

## Panduan untuk Redesign UI:
1. **Prioritaskan pengalaman mobile first**
2. Pertahankan semua fitur yang sudah ada, jangan ada yang dihilangkan
3. UI harus modern, clean, dan tidak berantakan
4. Gunakan space yang cukup antar elemen
5. Gunakan warna yang konsisten
6. Pastikan semua button mudah diklik di mobile
7. Semua tabel harus bisa di-scroll di layar kecil
8. Loading state dan empty state harus jelas
9. Feedback visual untuk setiap aksi pengguna
10. Kontras teks harus memenuhi standar aksesibilitas

---

## Data Model Referensi:
```typescript
interface Transaction {
  id: string
  date: string // YYYY-MM-DD
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  subcategoryId?: string
  accountId: string
  note?: string
  createdAt: string
}

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
  subcategories?: Subcategory[]
}

interface Account {
  id: string
  name: string
  balance: number
  isActive: boolean
  color: string
}
```

Dokumen ini akan membantu AI memahami seluruh fungsionalitas aplikasi sehingga hasil redesign tidak menghilangkan fitur penting yang sudah ada.