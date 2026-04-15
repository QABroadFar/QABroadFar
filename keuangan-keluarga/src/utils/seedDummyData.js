// Seed script: Generate 6 months of dummy data (Jan-Jun 2026)
// Run in browser console after loading the app

const seedDummyData = () => {
  const now = new Date();
  const currentYear = 2026;

  // Generate dates for 6 months (Jan-Jun 2026)
  const months = [1, 2, 3, 4, 5, 6];

  // Accounts
  const accountIds = ['acc-1', 'acc-2', 'acc-3', 'acc-4']; // Kas, Bank BCA, GoPay, OVO

  // Random helper
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[rand(0, arr.length - 1)];
  const randomDate = (year, month) => {
    const day = rand(1, 28);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const transactions = [];
  let id = 1;

  // ====== MONTHLY PATTERNS ======
  const monthlyIncomes = [
    { categoryId: 'cat-9', subcategoryId: 'sub-25', amount: 12000000, note: 'Gaji bulanan' },
    { categoryId: 'cat-9', subcategoryId: 'sub-25', amount: 8000000, note: 'Gaji bulanan' },
    { categoryId: 'cat-10', subcategoryId: 'sub-28', amount: rand(2000000, 5000000), note: 'Pendapatan usaha' },
  ];

  // Add bonus occasionally
  const occasionalIncomes = [
    { categoryId: 'cat-9', subcategoryId: 'sub-26', amount: 3000000, note: 'Bonus tahunan' },
    { categoryId: 'cat-11', subcategoryId: 'sub-30', amount: rand(500000, 2000000), note: 'Hadiah' },
  ];

  // Monthly fixed expenses
  const monthlyFixed = [
    { categoryId: 'cat-1', subcategoryId: 'sub-1', amount: rand(1500000, 2500000), note: 'Belanja bulanan' },
    { categoryId: 'cat-2', subcategoryId: 'sub-4', amount: rand(500000, 800000), note: 'Bensin' },
    { categoryId: 'cat-3', subcategoryId: 'sub-7', amount: 500000, note: 'Listrik' },
    { categoryId: 'cat-3', subcategoryId: 'sub-8', amount: 150000, note: 'Air PDAM' },
    { categoryId: 'cat-3', subcategoryId: 'sub-9', amount: 350000, note: 'Internet' },
    { categoryId: 'cat-4', subcategoryId: 'sub-11', amount: 100000, note: 'Vitamin & obat' },
    { categoryId: 'cat-6', subcategoryId: 'sub-16', amount: 150000, note: 'Netflix, Spotify' },
    { categoryId: 'cat-8', subcategoryId: 'sub-22', amount: 2000000, note: 'Tabungan bulanan' },
  ];

  // Variable expenses
  const variableExpenses = [
    { categoryId: 'cat-1', subcategoryId: 'sub-2', amount: rand(100000, 300000), note: 'Makan di luar' },
    { categoryId: 'cat-1', subcategoryId: 'sub-3', amount: rand(50000, 150000), note: 'Snack & minum' },
    { categoryId: 'cat-2', subcategoryId: 'sub-5', amount: rand(50000, 150000), note: 'Parkir & tol' },
    { categoryId: 'cat-2', subcategoryId: 'sub-6', amount: rand(30000, 100000), note: 'Gojek/Grab' },
    { categoryId: 'cat-4', subcategoryId: 'sub-12', amount: rand(200000, 500000), note: 'Kontrol dokter' },
    { categoryId: 'cat-5', subcategoryId: 'sub-14', amount: rand(100000, 300000), note: 'Buku' },
    { categoryId: 'cat-5', subcategoryId: 'sub-15', amount: rand(500000, 1000000), note: 'Kursus online' },
    { categoryId: 'cat-6', subcategoryId: 'sub-17', amount: rand(200000, 500000), note: 'Jalan-jalan' },
    { categoryId: 'cat-6', subcategoryId: 'sub-18', amount: rand(100000, 300000), note: 'Hobi' },
    { categoryId: 'cat-7', subcategoryId: 'sub-19', amount: rand(200000, 500000), note: 'Baju' },
    { categoryId: 'cat-7', subcategoryId: 'sub-21', amount: rand(100000, 400000), note: 'Perlengkapan rumah' },
  ];

  // Special expenses (occasional)
  const specialExpenses = [
    { categoryId: 'cat-7', subcategoryId: 'sub-20', amount: rand(1000000, 3000000), note: 'Beli elektronik', months: [2] },
    { categoryId: 'cat-6', subcategoryId: 'sub-17', amount: rand(500000, 1500000), note: 'Liburan', months: [3, 6] },
    { categoryId: 'cat-4', subcategoryId: 'sub-13', amount: rand(300000, 800000), note: 'Vitamin supplement', months: [1, 4] },
  ];

  // Generate transactions for each month
  months.forEach(month => {
    // Monthly incomes
    monthlyIncomes.forEach(inc => {
      transactions.push({
        id: `tx-dummy-${id++}`,
        type: 'income',
        amount: inc.amount + rand(-200000, 200000),
        date: randomDate(currentYear, month),
        categoryId: inc.categoryId,
        subcategoryId: inc.subcategoryId,
        accountId: 'acc-2', // Bank
        note: inc.note,
      });
    });

    // Occasional income (random)
    if (Math.random() > 0.6) {
      const occ = pick(occasionalIncomes);
      transactions.push({
        id: `tx-dummy-${id++}`,
        type: 'income',
        amount: occ.amount,
        date: randomDate(currentYear, month),
        categoryId: occ.categoryId,
        subcategoryId: occ.subcategoryId,
        accountId: pick(['acc-2', 'acc-3']),
        note: occ.note,
      });
    }

    // Fixed expenses
    monthlyFixed.forEach(exp => {
      transactions.push({
        id: `tx-dummy-${id++}`,
        type: 'expense',
        amount: exp.amount + rand(-50000, 50000),
        date: randomDate(currentYear, month),
        categoryId: exp.categoryId,
        subcategoryId: exp.subcategoryId,
        accountId: pick(['acc-1', 'acc-2', 'acc-3']),
        note: exp.note,
      });
    });

    // Variable expenses (3-5 per month)
    const numVariable = rand(3, 5);
    for (let i = 0; i < numVariable; i++) {
      const exp = pick(variableExpenses);
      transactions.push({
        id: `tx-dummy-${id++}`,
        type: 'expense',
        amount: exp.amount,
        date: randomDate(currentYear, month),
        categoryId: exp.categoryId,
        subcategoryId: exp.subcategoryId,
        accountId: pick(accountIds),
        note: exp.note,
      });
    }

    // Special expenses (if month matches)
    specialExpenses.forEach(sp => {
      if (sp.months.includes(month)) {
        transactions.push({
          id: `tx-dummy-${id++}`,
          type: 'expense',
          amount: sp.amount,
          date: randomDate(currentYear, month),
          categoryId: sp.categoryId,
          subcategoryId: sp.subcategoryId,
          accountId: pick(['acc-1', 'acc-2']),
          note: sp.note,
        });
      }
    });
  });

  // Generate budgets for each month
  const budgets = [];
  const budgetCategories = [
    { categoryId: 'cat-1', amount: 3500000 },
    { categoryId: 'cat-2', amount: 1500000 },
    { categoryId: 'cat-3', amount: 1200000 },
    { categoryId: 'cat-4', amount: 500000 },
    { categoryId: 'cat-5', amount: 800000 },
    { categoryId: 'cat-6', amount: 800000 },
    { categoryId: 'cat-7', amount: 1000000 },
    { categoryId: 'cat-8', amount: 2000000 },
  ];

  months.forEach(month => {
    budgetCategories.forEach(bc => {
      budgets.push({
        id: `bud-dummy-${id++}`,
        categoryId: bc.categoryId,
        amount: bc.amount,
        year: currentYear,
        month: month,
        rollover: false,
      });
    });
  });

  // Generate assets
  const assets = [
    { id: 'asset-dummy-1', name: 'Toyota Avanza 2020', purchaseValue: 220000000, currentValue: 180000000, purchaseDate: '2020-03-15' },
    { id: 'asset-dummy-2', name: 'Laptop MacBook Pro', purchaseValue: 28000000, currentValue: 22000000, purchaseDate: '2023-06-10' },
    { id: 'asset-dummy-3', name: 'Emas 50 gram', purchaseValue: 45000000, currentValue: 52000000, purchaseDate: '2024-01-20' },
  ];

  // Generate savings targets
  const savings = [
    { id: 'sav-dummy-1', name: 'DP Rumah', targetAmount: 150000000, currentAmount: 45000000, deadline: '2027-12-31' },
    { id: 'sav-dummy-2', name: 'Liburan Bali', targetAmount: 10000000, currentAmount: 4500000, deadline: '2026-08-15' },
    { id: 'sav-dummy-3', name: 'Dana Pendidikan Anak', targetAmount: 100000000, currentAmount: 18000000, deadline: '2030-06-01' },
  ];

  // Generate debts
  const debts = [
    { id: 'debt-dummy-1', partyName: 'Bank BCA (KPR)', amount: 450000000, dueDate: '2040-12-31', monthlyPayment: 3500000, note: 'Cicilan rumah 20 tahun', isPaid: false },
    { id: 'debt-dummy-2', partyName: 'Kakak', amount: 5000000, dueDate: '2026-06-30', note: 'Pinjaman darurat', isPaid: false },
  ];

  // Generate receivables
  const receivables = [
    { id: 'rec-dummy-1', partyName: 'Teman Suami', amount: 2000000, dueDate: '2026-04-30', note: 'Pinjaman modal usaha', isPaid: false },
  ];

  // Recurring payments
  const recurringPayments = [
    { id: 'rp-dummy-1', name: 'Listrik PLN', amount: 500000, dueDate: 15, categoryId: 'cat-3', subcategoryId: 'sub-7', accountId: 'acc-2', isPaid: false },
    { id: 'rp-dummy-2', name: 'Air PDAM', amount: 150000, dueDate: 10, categoryId: 'cat-3', subcategoryId: 'sub-8', accountId: 'acc-2', isPaid: false },
    { id: 'rp-dummy-3', name: 'Internet IndiHome', amount: 350000, dueDate: 1, categoryId: 'cat-3', subcategoryId: 'sub-9', accountId: 'acc-2', isPaid: false },
    { id: 'rp-dummy-4', name: 'BPJS Kesehatan', amount: 300000, dueDate: 10, categoryId: 'cat-4', subcategoryId: 'sub-11', accountId: 'acc-2', isPaid: false },
    { id: 'rp-dummy-5', name: 'Netflix', amount: 120000, dueDate: 5, categoryId: 'cat-6', subcategoryId: 'sub-16', accountId: 'acc-3', isPaid: false },
    { id: 'rp-dummy-6', name: 'Spotify Family', amount: 70000, dueDate: 5, categoryId: 'cat-6', subcategoryId: 'sub-16', accountId: 'acc-3', isPaid: false },
  ];

  // Calculate account balances from transactions
  const accountBalances = { 'acc-1': 1500000, 'acc-2': 35000000, 'acc-3': 850000, 'acc-4': 320000 };
  transactions.forEach(tx => {
    if (tx.accountId && accountBalances[tx.accountId] !== undefined) {
      accountBalances[tx.accountId] += tx.type === 'income' ? tx.amount : -tx.amount;
    }
  });

  // Save to localStorage
  localStorage.setItem('kk_transactions', JSON.stringify(transactions));
  localStorage.setItem('kk_budgets', JSON.stringify(budgets));
  localStorage.setItem('kk_assets', JSON.stringify(assets));
  localStorage.setItem('kk_savings', JSON.stringify(savings));
  localStorage.setItem('kk_debts', JSON.stringify(debts));
  localStorage.setItem('kk_receivables', JSON.stringify(receivables));
  localStorage.setItem('kk_recurringPayments', JSON.stringify(recurringPayments));
  localStorage.setItem('kk_accounts', JSON.stringify([
    { id: 'acc-1', name: 'Kas', type: 'cash', balance: accountBalances['acc-1'], isActive: true },
    { id: 'acc-2', name: 'Bank BCA', type: 'bank', balance: accountBalances['acc-2'], isActive: true },
    { id: 'acc-3', name: 'GoPay', type: 'ewallet', balance: accountBalances['acc-3'], isActive: true },
    { id: 'acc-4', name: 'OVO', type: 'ewallet', balance: accountBalances['acc-4'], isActive: true },
  ]));

  console.log('✅ Dummy data seeded successfully!');
  console.log(`📊 ${transactions.length} transactions`);
  console.log(`💰 ${budgets.length} budget entries`);
  console.log(`🏠 ${assets.length} assets`);
  console.log(`🎯 ${savings.length} savings targets`);
  console.log(`📉 ${debts.length} debts`);
  console.log(`📈 ${receivables.length} receivables`);
  console.log(`🔄 ${recurringPayments.length} recurring payments`);
  console.log('🔄 Reload the page to see the data!');

  return {
    transactionCount: transactions.length,
    budgetCount: budgets.length,
  };
};

export default seedDummyData;
