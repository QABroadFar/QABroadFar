# Quick Deploy Guide - Keuangan Keluarga with Supabase

## Your Supabase Project

```
Project ID: uwdtrdurwvugqfqryhup
URL: https://uwdtrdurwvugqfqryhup.supabase.co
Anon Key: sb_publishable_9ri-doionYvcLIE6hBJuaw_CgPgLtxH
```

## ✅ Done

- Supabase client configured
- Auth (anonymous) added
- Realtime sync service added
- Storage upgraded with queue
- Build verified

## 🔧 Setup Steps

### Step 1: Run Database Schema

1. Open `supabase-schema.sql` in this repo
2. Go to **Supabase Dashboard** → **SQL Editor**
3. Paste entire file
4. Click **Run**

This creates 9 tables with RLS, triggers, and indexes.

**Verify:** Tables tab should show: accounts, categories, transactions, budgets, assets, savings, debts, receivables, recurring_payments

### Step 2: Test Locally

```bash
cd keuangan-keluarga
npm run dev
```

Open `http://localhost:5173`

**Expected console output:**
```
Supabase configured: true
Anonymous user created: xxxxx-xxxx-xxxx-xxxx-xxxx
```
or
```
Authenticated as: xxxxx-xxxx-xxxx-xxxx-xxxx
```

If you see errors about credentials, check `.env.local` exists with correct keys.

### Step 3: Deploy to Vercel

```bash
# From project root
cd /workspaces/QABroadFar/keuangan-keluarga
vercel --prod
```

Follow prompts. After deploy, get your URL (e.g., `https://keuangan-keluarga.vercel.app`).

### Step 4: Add Env Vars to Vercel

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add:
   ```
   VITE_SUPABASE_URL = https://uwdtrdurwvugqfqryhup.supabase.co
   VITE_SUPABASE_ANON_KEY = sb_publishable_9ri-doionYvcLIE6hBJuaw_CgPgLtxH
   ```
3. Click **Redeploy** (or trigger new deploy)

### Step 5: Verify

1. Open deployed URL
2. Open browser console
3. Should see: `"Supabase configured: true"`
4. Add a transaction
5. Go to Supabase Dashboard → **Table Editor** → `transactions`
6. New row should appear (within 1 sec)

---

## 🔄 How It Works

**Offline-first architecture:**

1. User action (add transaction) → updates React state instantly
2. State change → saved to localStorage immediately (fast)
3. Operation queued to Supabase in background
4. When online, queue processes → data uploaded
5. Realtime subscription pushes to other devices

**Multi-device:** Open same app on phone/desktop → changes sync automatically.

---

## 📱 Multi-Device Notes

- **Anonymous users:** Created per browser. Data isolated per device unless you implement email login.
- To share data across devices, add login/logout UI (future enhancement).
- Current design: each device gets its own anonymous user (good for personal use on one device + backup).

---

## 🗑️ Reset / Fresh Start

Clear all data and start over:

```javascript
// In browser console
localStorage.clear()
location.reload()
```

Creates new anonymous user. Old data still in Supabase (can delete manually from dashboard).

---

## 🐛 Troubleshooting

### "Supabase credentials not found"
- Check `.env.local` in project root exists
- Keys must start with `VITE_`
- Restart dev server after adding env vars

### "Failed to run SQL: column does not exist"
- **Fix:** Drop the table and re-run `supabase-schema.sql`:
  ```sql
  DROP TABLE IF EXISTS categories CASCADE;
  DROP TABLE IF EXISTS transactions CASCADE;
  -- Then re-run entire schema
  ```
  Or just drop entire database and recreate (easiest).

### Data not appearing in Supabase
1. Check browser console for errors
2. Verify `storage.getSyncStatus()` returns `{available: true}`
3. Ensure RLS policies are enabled (Tables → categories → Policies tab)
4. Check that `user_id` is being set (data must have user_id)

### "Row Level Security policy violation"
- RLS is blocking insert. Ensure you're authenticated (anonymous user exists).
- Check Policies tab for each table — should have "Users can CRUD own [table]" policy.

### Build fails with "operation already declared"
- Fixed in current code. If still seeing, check `src/lib/supabaseSync.js` line 157-172 — `queueOperation` parameter should be `opType`, not `operation`.

---

## 📚 Files

| File | Purpose |
|------|---------|
| `supabase-schema.sql` | Run this in Supabase SQL Editor |
| `.env.local` | Your local credentials (gitignored) |
| `.env.example` | Template for new setups |
| `MIGRATION.md` | Full migration guide (data import, advanced topics) |
| `DEPLOY.md` | This file — quick start |

---

## 🎯 That's it!

1. Run SQL in Supabase ✅
2. Test locally ✅
3. Deploy to Vercel ✅
4. Add env vars ✅
5. Redeploy ✅
6. Verify data sync ✅

**Your app now has multi-device sync and automatic backup!** 🚀
