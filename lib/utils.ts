import { Transaction, Account } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-');
  return `${y}年${Number(m)}月`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function filterByMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter(t => t.date.startsWith(month));
}

export function calcMonthSummary(transactions: Transaction[], month: string) {
  const monthly = filterByMonth(transactions, month);
  const income = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export function calcAssetTotals(accounts: Account[]) {
  const assets = accounts.filter(a => a.type !== 'debt' && a.balance > 0);
  const liabilities = accounts.filter(a => a.type === 'debt' || a.balance < 0);
  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = Math.abs(liabilities.reduce((s, a) => s + a.balance, 0));
  return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: '現金',
  bank: '銀行',
  card: 'クレカ',
  emoney: '電子マネー',
  investment: '投資',
  debt: '負債',
};
