// Default data for initial app setup

export const defaultAccounts = [
  { id: 'acc-1', name: 'Kas', type: 'cash', balance: 0, isActive: true },
  { id: 'acc-2', name: 'Bank BCA', type: 'bank', balance: 0, isActive: true },
  { id: 'acc-3', name: 'GoPay', type: 'digital_wallet', balance: 0, isActive: true },
  { id: 'acc-4', name: 'OVO', type: 'digital_wallet', balance: 0, isActive: true },
];

export const defaultCategories = [
  {
    id: 'cat-1',
    name: 'Makanan & Minuman',
    type: 'expense',
    color: '#ef4444',
    icon: '🍴',
    categoryGroup: 'kebutuhan',
    subcategories: [
      { id: 'sub-1', name: 'Groceries' },
      { id: 'sub-2', name: 'Makan di Luar' },
      { id: 'sub-3', name: 'Snack & Minuman' },
    ],
  },
  {
    id: 'cat-2',
    name: 'Transportasi',
    type: 'expense',
    color: '#f97316',
    icon: '🚗',
    categoryGroup: 'kebutuhan',
    subcategories: [
      { id: 'sub-4', name: 'Bensin' },
      { id: 'sub-5', name: 'Parkir & Tol' },
      { id: 'sub-6', name: 'Ojek Online' },
    ],
  },
  {
    id: 'cat-3',
    name: 'Tagihan & Utilitas',
    type: 'expense',
    color: '#eab308',
    icon: '📄',
    categoryGroup: 'kebutuhan',
    subcategories: [
      { id: 'sub-7', name: 'Listrik' },
      { id: 'sub-8', name: 'Air' },
      { id: 'sub-9', name: 'Internet' },
      { id: 'sub-10', name: 'Telepon' },
    ],
  },
  {
    id: 'cat-4',
    name: 'Kesehatan',
    type: 'expense',
    color: '#22c55e',
    icon: '❤️',
    categoryGroup: 'kebutuhan',
    subcategories: [
      { id: 'sub-11', name: 'Obat' },
      { id: 'sub-12', name: 'Dokter' },
      { id: 'sub-13', name: 'Vitamin' },
    ],
  },
  {
    id: 'cat-5',
    name: 'Pendidikan',
    type: 'expense',
    color: '#3b82f6',
    icon: '📖',
    categoryGroup: 'kebutuhan',
    subcategories: [
      { id: 'sub-14', name: 'Buku' },
      { id: 'sub-15', name: 'Kursus' },
    ],
  },
  {
    id: 'cat-6',
    name: 'Hiburan',
    type: 'expense',
    color: '#8b5cf6',
    icon: '🎮',
    categoryGroup: 'keinginan',
    subcategories: [
      { id: 'sub-16', name: 'Streaming' },
      { id: 'sub-17', name: 'Jalan-jalan' },
      { id: 'sub-18', name: 'Hobi' },
    ],
  },
  {
    id: 'cat-7',
    name: 'Belanja',
    type: 'expense',
    color: '#ec4899',
    icon: '🛍️',
    categoryGroup: 'keinginan',
    subcategories: [
      { id: 'sub-19', name: 'Pakaian' },
      { id: 'sub-20', name: 'Elektronik' },
      { id: 'sub-21', name: 'Rumah Tangga' },
    ],
  },
  {
    id: 'cat-8',
    name: 'Tabungan & Investasi',
    type: 'expense',
    color: '#14b8a6',
    icon: '🐷',
    categoryGroup: 'tabungan',
    subcategories: [
      { id: 'sub-22', name: 'Tabungan' },
      { id: 'sub-23', name: 'Deposito' },
      { id: 'sub-24', name: 'Reksa Dana' },
    ],
  },
  {
    id: 'cat-9',
    name: 'Gaji',
    type: 'income',
    color: '#22c55e',
    icon: '💼',
    subcategories: [
      { id: 'sub-25', name: 'Gaji Pokok' },
      { id: 'sub-26', name: 'Bonus' },
      { id: 'sub-27', name: 'Tunjangan' },
    ],
  },
  {
    id: 'cat-10',
    name: 'Usaha',
    type: 'income',
    color: '#3b82f6',
    icon: '🏪',
    subcategories: [
      { id: 'sub-28', name: 'Penjualan' },
      { id: 'sub-29', name: 'Jasa' },
    ],
  },
  {
    id: 'cat-11',
    name: 'Lainnya',
    type: 'income',
    color: '#6b7280',
    icon: '☰',
    subcategories: [
      { id: 'sub-30', name: 'Hadiah' },
      { id: 'sub-31', name: 'Cashback' },
    ],
  },
];

// Updated default recurring payments with all required fields
export const defaultRecurringPayments = [
  { 
    id: 'rec-1', 
    name: 'Listrik PLN', 
    type: 'expense',
    amount: 500000, 
    dueDate: 15, 
    categoryId: 'cat-3', 
    subcategoryId: 'sub-7', 
    isPaid: false,
    isActive: true,
    frequency: 'monthly',
    startDate: '2024-01-01'
  },
  { 
    id: 'rec-2', 
    name: 'Air PDAM', 
    type: 'expense',
    amount: 150000, 
    dueDate: 10, 
    categoryId: 'cat-3', 
    subcategoryId: 'sub-8', 
    isPaid: false,
    isActive: true,
    frequency: 'monthly',
    startDate: '2024-01-01'
  },
  { 
    id: 'rec-3', 
    name: 'Internet IndiHome', 
    type: 'expense',
    amount: 350000, 
    dueDate: 1, 
    categoryId: 'cat-3', 
    subcategoryId: 'sub-9', 
    isPaid: false,
    isActive: true,
    frequency: 'monthly',
    startDate: '2024-01-01'
  },
  { 
    id: 'rec-4', 
    name: 'BPJS Kesehatan', 
    type: 'expense',
    amount: 300000, 
    dueDate: 10, 
    categoryId: 'cat-4', 
    subcategoryId: 'sub-11', 
    isPaid: false,
    isActive: true,
    frequency: 'monthly',
    startDate: '2024-01-01'
  },
];

