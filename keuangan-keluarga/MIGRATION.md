# Migrasi dari localStorage ke Supabase

Dokumen ini menjelaskan langkah-langkah memigrasikan aplikasi Keuangan Keluarga dari penyimpanan lokal (localStorage) ke backend Supabase yang mendukung multi-device dan backup otomatis.

## 1. Ringkasan Perubahan

### Arsitektur Sebelumnya
- Storage: Hanya localStorage (client-side only)
- Multi-device: Tidak didukung
- Backup: Manual (ekspor/impors manual)

### Arsitektur Sekarang
- Storage: localStorage + Supabase (offline-first dengan background sync)
- Multi-device: Otomatis via Supabase auth & realtime sync
- Backup: Otomatis di Supabase
- Auth: Anonymous by default (opsional email/password)

### File-file Baru
- src/lib/supabase.js - Supabase client init
- src/lib/supabaseSync.js - Sync service dengan realtime
- src/context/AuthContext.jsx - Authentication context

### File-file Diubah
- src/utils/storage.js - Diupgrade dengan sync queue
- src/context/AppContext.jsx - Menambahkan queue operation ke Supabase
- src/App.jsx - Menambahkan AuthProvider
- package.json - Menambahkan @supabase/supabase-js

## 2. Prasyarat
- Node.js v16+ dan npm
- Supabase account (gratis di supabase.com)
- Git untuk version control
- Vercel account (jika deploy ke Vercel)

## 3. Setup Supabase Project

### 3.1 Buat Project di Supabase
1. Login ke Supabase Dashboard
2. Klik New Project
3. Isi name, password, region
4. Tunggu hingga project siap

### 3.2 Jalankan Database Schema
1. Buka SQL Editor
2. Copy paste isi file supabase-schema.sql
3. Klik Run

Schema membuat 9 tabel, RLS policies, triggers, dan indexes.

### 3.3 Dapatkan API Keys
Settings → API → Copy Project URL dan anon/public key.

## 4. Konfigurasi Environment Variables

### .env.local
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Vercel
Settings → Environment Variables → tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY, lalu redeploy.

## 5. Deploy ke Vercel
```bash
npm run build
vercel --prod
```

## 6. Migrasi Data Lama

### Opsi A: Manual Export/Import (Rekomendasi)
Export dari localStorage via console browser, lalu import ke Supabase menggunakan SQL INSERT atau script Node.js.

### Opsi B: Auto-Merge
Setelah deploy, data tetap di localStorage. Gunakan supabaseSync.queueOperation untuk upload manual.

### Opsi C: Fresh Start
Clear localStorage, relogin (anonymous), mulai input data baru.

## 7. Testing
- Test offline-first: tambah data offline, lalu sync ketika online
- Test multi-device: cek data muncul di device lain
- Test backup: cek data di Supabase dashboard

## 8. Troubleshooting
- "Supabase credentials not found" → cek .env.local
- Data tidak sync → cek RLS policies
- Anonymous auth gagal → enable di Supabase Auth settings

## 9. Catatan Penting
- Anonymous users have limits; untuk produksi gunakan email/password
- RLS harus aktif di production
- Supabase backup otomatis, tapi bisa enable PITR untuk extra safety

Selamat! Multi-device sync dan backup aktif 🚀
