# Setup Household Sharing - Untuk Anda & Istri

## 🎯 Tujuan

Membuat satu data keuangan **bersama** yang bisa diakses oleh:
- **Anda** (owner)
- **Istri** (member)

Data: transactions, categories, accounts, budgets, assets, savings, debts, receivables, recurring payments — **semua terlihat oleh berdua**.

---

## 📋 Prasyarat

1. **Aplikasi sudah deploy** di Vercel dengan Supabase
2. **Database schema sudah di-run** (yang baru dengan household tables)
3. Kedua orang memiliki **akun Supabase** (bisa anonymous atau email)

---

## 🔧 Step-by-Step Setup

### Step 1: Login sebagai Owner (Anda)

1. Buka app di browser: `https://qabroadfar2.vercel.app`
2. Login (atau daftar dengan email) — **Gunakan email yang sama untuk household owner**
3. **Console browser (F12)** akan menampilkan:
   ```
   Anonymous user created: xxxxx-xxxx-xxxx-xxxx-xxxx
   ```
   **Copy User ID tersebut** ( Electronics / Application / Console → copy)

### Step 2: Buat Household via Supabase Dashboard

Karena UI share belum dibuat, kita buat manual lewat dashboard:

1. Buka https://supabase.com/dashboard/project/uwdtrdurwvugqfqryhup
2. **Table Editor** → Cari tabel `households` → klik **Insert row**
3. Isi:
   ```
   id: (biarkan kosong / auto)
   name: "Keluarga [Nama Anda]"
   created_by: [paste User ID Anda dari console]
   ```
4. Klik **Save**

Hasil: household dibuat, catat `id`-nya (misal: `abc-123...`).

---

### Step 3: Tambah Anggota (Istri)

**Pertama, minta istri login dulu:**

1. Istri buka app di browser/HP
2. Login/daftar (bisa anonymous juga)
3. **Copy User ID istri** dari console

**Keduanya, tambah anggota ke household:**

1. Di Supabase Dashboard → Table Editor → `household_members`
2. Klik **Insert row**
3. Isi **untuk Anda (owner):** (seharusnya sudah ada otomatis)
   ```
   household_id: [ID household dari Step 2]
   user_id: [User ID Anda]
   role: "owner"
   ```
4. Klik **Save**

5. **Insert row untuk istri:**
   ```
   household_id: [sama seperti di atas]
   user_id: [User ID istri]
   role: "member"
   ```
6. Klik **Save**

---

### Step 4: Test Shared Data

**On your device:**
1. Refresh app
2. Tambah some transactions, categories, accounts
3. Tunggu 1-2 detik

**On wife's device:**
1. Refresh app
2. Data Anda harus muncul otomatis (realtime sync)

**Realtime check:**
- Tambah transaksi di device A → muncul di device B dalam 1-2 detik
- Edit/delete juga sync

---

## 💡 Cara Cek Status

Console browser:
```javascript
// Check if household loaded
console.log(useHousehold()?.currentHousehold);

// Check sync status
console.log(storage.getSyncStatus());

// Force manual refresh
window.dispatchEvent(new Event('household-changed'));
```

---

## 🔄 How It Works

```
Device A (Anda)       Supabase Realtime        Device B (Istri)
    │                       │                       │
    ├─Insert transaction────→│                       │
    │                       ├─Broadcast─────────────→│
    │                       │                       ├─Update localStorage
    │                       │                       ├─Re-render UI
    ├─Receive ACK───────────←│                       │
```

Setiap perubahan disimpan lokal dulu, lalu dikirim ke Supabase, lalu dibroadcast ke semua device dalam household yang sama.

---

## 🏠 Multiple Households?

Saat ini satu user hanya bisa join **satu household**. Jika ingin separate (misal: "Personal" + "Keluarga"), perlu UI untuk switch.

**Alternative:** Buat 2 akun Supabase berbeda (email berbeda) untuk personal vs household.

---

## 🧹 Reset / Change Household

Jika ingin pindah household atau reset:

```javascript
// Clear localStorage (local data)
localStorage.clear();
location.reload();
// Then login with new account or create new household via dashboard
```

---

## 🚨 Troubleshooting

### "No household found" di console
**Cause:** Belum dibuat household di database  
**Fix:** Ikut Step 2 & 3 di atas

### Data tidak muncul di device istri
1. Cek both devices logged in (check console for user ID)
2. Pastikan `household_members` table punya 2 entries dengan household_id yang sama
3. Cek RLS policies aktif di semua tabel
4. Reload app di kedua device

### "Row Level Security policy violation"
**Cause:** RLS policy menolak akses  
**Fix:** Pastikan RLS di semua tabel aktif. Di Supabase Dashboard → Tables → [table] → Policies → harus ada policies yang allow household members.

### Realtime tidak jalan
**Fix:** 
1. Check Supabase Dashboard → Realtime → subscription aktif
2. Pastikan `supabase-js` version compatible (sudah ^2.103.3)

---

## 📞 Butuh Bantuan?

1. **Check browser console** untuk error messages
2. **Supabase Dashboard** → Logs (SQL & Realtime)
3. Pastikan semua **RLS policies** sudah aktif

---

**Setelah setup selesai, Anda & istri bisa manage keuangan bersama secara real-time!** 🎉

---
Penafian: Fitur household sharing masih **beta**. UI untuk invite/login belum dibuat — manual via dashboard dulu.
