import { Transaction, Category, Account, AssetSnapshot, CategoryBudget } from '@/types';

const KEYS = {
  transactions: 'kanemiru_transactions',
  categories: 'kanemiru_categories',
  accounts: 'kanemiru_accounts',
  snapshots: 'kanemiru_snapshots',
  initialized: 'kanemiru_initialized',
};

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Transactions
export function getTransactions(): Transaction[] {
  return load<Transaction>(KEYS.transactions);
}
export function saveTransactions(data: Transaction[]): void {
  save(KEYS.transactions, data);
}
export function addTransaction(t: Transaction): void {
  const all = getTransactions();
  all.push(t);
  saveTransactions(all);
}
export function updateTransaction(t: Transaction): void {
  saveTransactions(getTransactions().map(x => x.id === t.id ? t : x));
}
export function deleteTransaction(id: string): void {
  saveTransactions(getTransactions().filter(x => x.id !== id));
}

// Categories
export function getCategories(): Category[] {
  return load<Category>(KEYS.categories);
}
export function saveCategories(data: Category[]): void {
  save(KEYS.categories, data);
}

// Accounts
export function getAccounts(): Account[] {
  return load<Account>(KEYS.accounts);
}
export function saveAccounts(data: Account[]): void {
  save(KEYS.accounts, data);
}

// Asset Snapshots
export function getSnapshots(): AssetSnapshot[] {
  return load<AssetSnapshot>(KEYS.snapshots);
}
export function saveSnapshots(data: AssetSnapshot[]): void {
  save(KEYS.snapshots, data);
}
export function upsertSnapshot(snap: AssetSnapshot): void {
  const all = getSnapshots();
  const idx = all.findIndex(s => s.month === snap.month);
  if (idx >= 0) all[idx] = snap;
  else all.push(snap);
  saveSnapshots(all);
}

// Category Budgets
const CAT_BUDGET_KEY = 'kanemiru_category_budgets';
export function getCategoryBudgets(): CategoryBudget[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CAT_BUDGET_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
export function saveCategoryBudgets(data: CategoryBudget[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CAT_BUDGET_KEY, JSON.stringify(data));
}
export function setCategoryBudget(categoryId: string, amount: number): void {
  const all = getCategoryBudgets();
  const idx = all.findIndex(b => b.categoryId === categoryId);
  if (amount === 0) {
    if (idx >= 0) { all.splice(idx, 1); saveCategoryBudgets(all); }
    return;
  }
  if (idx >= 0) all[idx].amount = amount;
  else all.push({ categoryId, amount });
  saveCategoryBudgets(all);
}

// Monthly Budget
export function getMonthlyBudget(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem('kanemiru_monthly_budget');
  return raw ? Number(raw) : 0;
}
export function setMonthlyBudget(amount: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('kanemiru_monthly_budget', String(amount));
}

// Init check
export function isInitialized(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEYS.initialized) === 'true';
}
export function markInitialized(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.initialized, 'true');
}
