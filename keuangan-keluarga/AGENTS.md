# Budget Table Schema (Supabase)

## Verified Schema (2026-04-21)

**Table:** `budgets`  
**Schema:** `public`  
**RLS:** Enabled

### Columns (in order)

| # | Column | Type | Nullable | Default | Description |
|---|--------|------|-----------|---------|-------------|
| 1 | `id` | `text` | **NO** | - | Primary key (client-generated: `bud-{timestamp}-{random}`) |
| 2 | `category_id` | `text` | YES | - | FK → categories(id) |
| 3 | `year` | `integer` | **NO** | - | Budget year (4-digit) |
| 4 | `month` | `integer` | **NO** | - | Budget month (1–12, CHECK constraint applies) |
| 5 | `amount` | `numeric(15,2)` | **NO** | - | Budgeted amount (≥ 0) |
| 6 | `spent` | `numeric(15,2)` | YES | `0` | Cumulative spent (auto-updated via triggers or application) |
| 7 | `rollover` | `boolean` | YES | `false` | Whether unused budget rolls over to next month |
| 8 | `created_at` | `timestamptz` | YES | `now()` | Created timestamp |
| 9 | `updated_at` | `timestamptz` | YES | `now()` | Last updated timestamp |

### Unique Constraint

```sql
CONSTRAINT budgets_category_year_month_key 
UNIQUE (category_id, year, month)
```

### Row Level Security (RLS)

```sql
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Policy: allow_all_budgets (full access for authenticated users)
-- OR household-scoped:
CREATE POLICY "Household members can CRUD budgets" ON budgets FOR ALL
USING (EXISTS (
  SELECT 1 FROM household_members hm 
  WHERE hm.household_id = budgets.household_id 
    AND hm.user_id = auth.uid()
));
```

## Application Integration

### Supabase Sync Layer
- **File:** `src/lib/supabaseSync.js`
- **TABLE_FIELDS** defines allowed columns for filtering: `['id', 'category_id', 'amount', 'year', 'month', 'rollover', 'created_at', 'updated_at']`
- **insertRecord()** includes failsafe:
  - If `year`/`month` missing → uses `data.year` / `data.month` or current date
  - If `rollover` missing → defaults to `false`

### AppContext
- **File:** `src/context/AppContext.jsx`
- **addBudget()** now resolves `year`/`month` from payload or falls back to `selectedPeriod` state before queuing insert.

### Frontend Forms
- **Budget page:** `src/pages/Budget.jsx` — BudgetFormModal passes `selectedYear` and `selectedMonthNum` as props.
- **handleSubmit** includes `year` and `month` explicitly:
  ```js
  const data = {
    ...formData,
    amount: parseFloat(formData.amount),
    year: budget ? budget.year : selectedYear,
    month: budget ? budget.month : selectedMonthNum,
  };
  ```

## Validation & Common Pitfalls

### Required Fields (NOT NULL)
- ✅ `id` — generated client-side
- ✅ `year` — 4-digit integer, always present
- ✅ `month` — 1–12
- ✅ `amount` — non-negative numeric

### Errors & Resolutions
- **"null value in column 'year' violates not-null constraint"**  
  → `addBudget` or form didn't include `year`. Fixed with fallback to `selectedPeriod`.

- **"null value in column 'month' violates not-null constraint"**  
  → Same as above. Fixed.

- **UNIQUE constraint violation `budgets_category_year_month_key`**  
  → Duplicate budget for same category/year/month combination.  
  → The app's `addBudget` function now detects duplicates and updates the existing entry instead of inserting.

## Quick SQL Reference

```sql
-- View all budgets
SELECT * FROM budgets ORDER BY year DESC, month DESC, category_id;

-- Check constraints
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c
WHERE conrelid = 'budgets'::regclass;

-- Count budgets per month
SELECT year, month, COUNT(*) FROM budgets GROUP BY year, month ORDER BY year DESC, month DESC;

-- Delete all budgets (use with caution)
DELETE FROM budgets;
```

