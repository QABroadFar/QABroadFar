# Household Sharing Setup - Untuk Anda & Istri

## 🏠 Apa Ini?

Fitur household memungkinkan **Anda dan istri** share satu data keuangan yang sama. Semua transaksi, kategori, akun, budget, dll. terlihat oleh kedua orang.

## 📊 Perubahan Database

Schema baru menambahkan:
- `households` - grup keluarga
- `household_members` - anggota (Anda & istri)
- Semua tabel lain sekarang punya `household_id` (bukan `user_id`)

**Artinya:** Data tidak lagi per-user, tapi per-household.

---

## 🔧 Setup Langkah demi Langkah

### Step 1: Update Supabase Schema

**IMPORTANT:** Database Sudah Ada dengan Schema Lama?

Jika Anda sudah menjalankan schema lama (per-user),hapus dulu:

```sql
-- Drop all old tables
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
-- households dan household_members akan otomatis ter-drop karena cascade
```

Setelah bersih, **jalankan `supabase-schema.sql` yang baru** (yang sudah saya update).

### Step 2: Update Aplikasi (Code Changes)

File-file berikut perlu diupdate untuk pakai `household_id`:

1. **src/lib/supabaseSync.js** - ubah filter queries pakai `household_id`
2. **src/context/AppContext.jsx** - state management per household
3. **src/utils/storage.js** - storage keys tetep sama (localStorage), tapi data structure beda

Mari saya buat file-file yang sudah diupdate:

---

## 📁 File Updates

### 1. Update supabaseSync.js

**Replace** `src/lib/supabaseSync.js` dengan:

```javascript
// ... (existing imports and constructor)

async fetchAllData() {
  if (!this.userId || !this.householdId) return;

  const tables = ['transactions','categories','accounts','budgets','assets','savings','debts','receivables','recurringPayments'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('household_id', this.householdId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Remove household_id before storing in localStorage
      const cleanData = (data || []).map(({ household_id: _hid, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEYS[table], JSON.stringify(cleanData));
    } catch (error) {
      console.error(`Failed to fetch ${table}:`, error.message);
    }
  }
}

// Update realtime filter
setupRealtimeSubscriptions() {
  if (!this.userId || !this.householdId) return;

  const tables = [/* ... */];
  
  tables.forEach(table => {
    const channel = supabase
      .channel(`public:${table}:${this.householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `household_id=eq.${this.householdId}`
        },
        (payload) => { /* ... */ }
      )
      .subscribe();
    
    this.subscriptions.set(table, channel);
  });
}

// Update insert to include household_id
async insertRecord(table, data) {
  const { data: result, error } = await supabase
    .from(table)
    .insert([{ ...data, household_id: this.householdId }])
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

// Update update to filter by household_id
async updateRecord(table, data) {
  const { id, ...updateData } = data;
  const { data: result, error } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', id)
    .eq('household_id', this.householdId)  // <-- ADD THIS
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

// Update delete to filter by household_id
async deleteRecord(table, id) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('household_id', this.householdId);  // <-- ADD THIS
  
  if (error) throw error;
}
```

**Catatan:** Tambahkan `this.householdId` state di constructor.

---

### 2. Add Household Context

**Buat** `src/context/HouseholdContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const HouseholdContext = createContext(null);

export const useHousehold = () => {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be within HouseholdProvider');
  return ctx;
};

export const HouseholdProvider = ({ children }) => {
  const [currentHousehold, setCurrentHousehold] = useState(null);
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserHouseholds();
  }, []);

  const loadUserHouseholds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: members } = await supabase
      .from('household_members')
      .select('household_id, role, households(*)')
      .eq('user_id', user.id);

    setHouseholds(members || []);
    if (members?.length > 0) {
      setCurrentHousehold(members[0].households);
    }
    setLoading(false);
  };

  const createHousehold = async (name) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: household, error } = await supabase
      .from('households')
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (error) throw error;

    // Add creator as owner member
    await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: user.id,
      role: 'owner'
    });

    setCurrentHousehold(household);
    loadUserHouseholds(); // refresh list
    return household;
  };

  const joinHousehold = async (inviteCode) => {
    // For now, manual: admin adds you via Supabase dashboard
    // Future: implement invite links/email
    throw new Error('Not implemented yet - ask admin to add you');
  };

  const switchHousehold = (household) => {
    setCurrentHousehold(household);
    // Trigger refetch of all data
    window.dispatchEvent(new Event('household-changed'));
  };

  return (
    <HouseholdContext.Provider value={{
      currentHousehold,
      households,
      loading,
      createHousehold,
      joinHousehold,
      switchHousehold,
      setCurrentHousehold
    }}>
      {children}
    </HouseholdContext.Provider>
  );
};
```

---

### 3. Update App.jsx

```jsx
import { HouseholdProvider } from './context/HouseholdContext';

function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>  {/* ADD THIS */}
        <AppProvider>
          {/* ... */}
        </AppProvider>
      </HouseholdProvider>
    </AuthProvider>
  );
}
```

---

### 4. Update supabaseSync.js to Use Household

Di `supabaseSync.js`, tambah `this.householdId` dan subscribe ke household changes:

```jsx
// Tambah di constructor
this.householdId = null;

// Di init(), after getting user:
const { data: { user } } = await supabase.auth.getUser();
this.userId = user.id;

// Get household
const { data: memberData } = await supabase
  .from('household_members')
  .select('household_id')
  .eq('user_id', user.id)
  .limit(1);

if (memberData?.[0]) {
  this.householdId = memberData[0].household_id;
}

// Listen for household changes
window.addEventListener('household-changed', async () => {
  // Refetch householdId from storage or context
  const { data: memberData } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', this.userId)
    .limit(1);
  this.householdId = memberData?.[0]?.household_id || null;
  if (this.householdId) {
    await this.fetchAllData();
  }
});
```

---

## 🎯 Cara Pakai (Anda & Istri)

### Setup Awal (1 kali oleh pemilik rumah tangga):

1. **Login di app** → create anonymous user (atau email/password)
2. **Buka Supabase Dashboard** → **Table Editor** → `households`
3. **Insert row:**
   - `id`: (auto)
   - `name`: "Keluarga Andi"
   - `created_by`: (isi user ID Anda dari console.log user.id)
4. **Buka table `household_members`** → **Insert row:**
   - `household_id`: (ID household yang baru)
   - `user_id`: (ID user Anda)
   - `role`: "owner"
5. **Insert lagi untuk istri:**
   - `household_id`: (sama)
   - `user_id`: (ID user istri — minta istri login dulu, lihat user ID di console)
   - `role`: "member"

Setelah itu, **refresh app** → data akan ter-load.

---

## 🔄 Alternative: Auto-Create Household (Easier)

Ubah `AuthContext` untuk otomatis buat household saat first login:

```jsx
// Di AuthContext, setelah signInAnonymously:
const { data: household } = await supabase
  .from('households')
  .insert({ 
    name: 'My Household', 
    created_by: data.user.id 
  })
  .select()
  .single();

// Add creator as owner
await supabase.from('household_members').insert({
  household_id: household.id,
  user_id: data.user.id,
  role: 'owner'
});
```

---

## 📝 Summary

Perubahan utama:
- **All tables now have `household_id`** instead of `user_id`
- **RLS policies** check `household_members` to allow access
- Users dalam household yang sama **share all data**
- Add HouseholdContext untuk manage multiple households (future: separate family vs personal)

**Next:** Update code di `supabaseSync.js`, `AppContext.jsx`, dan tambah `HouseholdContext.jsx` seperti di atas.

Butuh saya implementasikan full household sharing?
