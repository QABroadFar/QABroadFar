# Setup Berbagi Data dengan Istri — Household Sharing

## ✅ Sudah Selesai: Backend Database & Sync

**Database schema baru** (dengan household) sudah dibuat: `supabase-schema.sql`

**App sudah di-deploy:** https://qabroadfar2.vercel.app

**Supabase project:** https://uwdtrdurwvugqfqryhup.supabase.co

---

## 🏠 Apa Itu Household?

**Household = Grup bersama.** Data semua table (transactions, categories, accounts, dll) disimpan per-household, bukan per-user. Jadi:

- **Anda & istri** masuk ke household yang sama → lihat data yang sama
- Perubahan Anda muncul di HP istri dalam 1-2 detik (realtime)
- Backup otomatis ke Supabase

---

## 🔧 Step 1: Update Schema di Supabase (PENTING!)

**BUKAN** schema lama (per-user). **Ganti** dengan yang baru:

1. Buka file: `supabase-schema.sql` (sudah di-update household)
2. Copy整个 IS ISI (paste走)
3. Supabase Dashboard → SQL Editor → Paste → **Run**

**Jika sudah menjalankan schema lama, HAPUS dulu:**

```sql
-- Run ini DULU, lalu run schema baru
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS savings CASCADE;
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS receivables CASCADE;
DROP TABLE IF EXISTS recurring_payments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS household_members CASCADE;
DROP TABLE IF EXISTS households CASCADE;
-- Lalu run supabase-schema.sql yang baru
```

---

## 🔧 Step 2: Buat Household (Manual via Dashboard)

**Hanya sekali saja — by owner (Anda)**

### 2.1 Login ke App (Anda)

1. Buka https://qabroadfar2.vercel.app
2. Login (atau Register) dengan email (contoh: `anda@email.com`)
3. **Buka Console (F12)** → copy `user.id` dari log:
   ```
   Authenticated as: xxxxx-xxxx-xxxx-xxxx-xxxx
   ```
   Simpan ID tersebut.

### 2.2 Buat Household di Supabase Dashboard

1. Buka: https://supabase.com/dashboard/project/uwdtrdurwvugqfqryhup/table-editor
2. Cari tabel `households` → klik **Insert row**
3. Isi:
   - `id` ← biarkan (auto)
   - `name`: `"Keluarga Andi dan Siti"` (atau nama Anda)
   - `created_by`: ← paste user ID Anda tadi
4. Klik **Save**
5. **Copy `id` household** yang dibuat (misal: `a1b2c3-...`)

---

## 🔧 Step 3: Tambah Istri sebagai Member

### 3.1 Istri Login ke App

1. Istri buka https://qabroadfar2.vercel.app
2. Login/Register dengan email sendiri (contoh: `isti@email.com`)
3. **Copy user ID istri** dari console

### 3.2 Tambah ke household_members

1. Di Supabase Dashboard → Table Editor → `household_members`
2. Klik **Insert row**
3. Isi:
   - `id` ← kosong (auto)
   - `household_id`: ← ID household dari Step 2.5
   - `user_id`: ← user ID istri
   - `role`: `"member"`
4. Klik **Save**

**Sudah!** Household siap digunakan.

---

## ✨ Step 4: Test Sync

1. **Refresh app** di browser Anda & istri
2. Console harus menampilkan:
   ```
   Household found: [household_id]
   Anonymous user created: [user_id]
   ```
3. Anda tambah transaksi → harus muncul di HP istri dalam 2 detik

---

## 🎯 Troubleshooting

### "No household found" di console
**Cause:** Belum insert di `household_members`  
**Fix:** Pastikan Step 2 & 3 selesai. Check:
  - `households` table punya 1 row
  - `household_members` punya 2 rows (you + wife) dengan household_id sama

### Data tidak muncul di device lain
1. Cek kedua device logged in (console shows user ID)
2. Cek `household_members` → both user_id exist with same household_id
3. Cek RLS policies aktif (each table → Policies tab)
4. Reload app di kedua device

### "Row Level Security policy violation"
**Cause:** RLS menolak akses  
**Fix:** Pastikan policies aktif. Setiap tabel harus ada policy:
```
Household members can CRUD [table]
```
(Run ulang `supabase-schema.sql` jika policies belum ada.)

### Household auto-create tidak jalan
Jika console shows: `User not in any household yet` dan tidak auto-create,
mungkin `household_members` belum di-insert. Follow manual Step 2 & 3.

---

## 📱 Multi-Device Usage

Setelah setup, **berdua** bisa:

- **Tambah transaksi** dari mana saja → langsung sync
- **Edit/delete** → semua device ter-update
- **Lihat saldo** akun, budget, dll. → selalu up-to-date

**Catatan:** Anonymous user terikat ke browser. Jika clear cookies, akan buat user baru → perlu assign ke household lagi (manual via dashboard). Untuk lebih seamless, gunakan **email/password** login (belum diimplementasi, tapi siap di code).

---

## 🛠️ Technical Notes

- **Tables with `household_id`**:
  transactions, categories, accounts, budgets, assets, savings, debts, receivables, recurring_payments
  
- **RLS**: Each table checks `household_members` membership
  
- **Realtime**: Subscribe to `household_id` filter → only get changes from your household

- **Offline-first**: localStorage masi dipakai. Ketika offline, data disimpan lokal, lalu sync ketika online.

---

## 📂 File Changes

| File | Perubahan |
|------|-----------|
| `supabase-schema.sql` | ✅ Added `households`, `household_members`, `household_id` columns |
| `src/lib/supabaseSync.js` | ✅ Scope queries by household_id |
| `src/context/HouseholdContext.jsx` | ✅ NEW - manage household membership |
| `src/context/AppContext.jsx` | ✅ Uses sync with household |
| `src/App.jsx` | ✅ Wrapped with HouseholdProvider |

---

## 🔮 Future Enhancements

- **[UI]** Settings page: "Invite partner" (email form)
- **[UI]** Show current household name in header
- **[Feature]** Switch between multiple households (personal + family)
- **[Feature]** Roles: owner can delete household, members read-only
- **[Feature]** Invite link / email magic link for spouse

---

## 📞 Support

Jika ada error:
1. Check browser console
2. Check Supabase Dashboard → Logs
3. Pastikan semua RLS policies aktif
4. Cek `household_members` entries untuk 2 user

---

**Selamat!** Sistem household sharing sudah aktif. Cukup lakukan Step 1-3 sekali, lalu app akan sync otomatis untuk Anda dan istri selamanya. 🏠💕
