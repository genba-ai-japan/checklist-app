import { Category, Account, Transaction, AssetSnapshot } from '@/types';
import {
  saveCategories, saveAccounts, saveTransactions,
  saveSnapshots, markInitialized
} from './storage';

export const DEFAULT_CATEGORIES: Category[] = [
  // 支出
  { id: 'c1', name: '食費', type: 'expense', icon: '🍽️', sortOrder: 1 },
  { id: 'c2', name: '交通費', type: 'expense', icon: '🚃', sortOrder: 2 },
  { id: 'c3', name: '日用品', type: 'expense', icon: '🧴', sortOrder: 3 },
  { id: 'c4', name: '光熱費', type: 'expense', icon: '💡', sortOrder: 4 },
  { id: 'c5', name: '通信費', type: 'expense', icon: '📱', sortOrder: 5 },
  { id: 'c6', name: '娯楽', type: 'expense', icon: '🎮', sortOrder: 6 },
  { id: 'c7', name: '衣服', type: 'expense', icon: '👕', sortOrder: 7 },
  { id: 'c8', name: '医療', type: 'expense', icon: '🏥', sortOrder: 8 },
  { id: 'c9', name: '外食', type: 'expense', icon: '🍜', sortOrder: 9 },
  { id: 'c10', name: 'その他', type: 'expense', icon: '📦', sortOrder: 10 },
  // 収入
  { id: 'i1', name: '給与', type: 'income', icon: '💼', sortOrder: 1 },
  { id: 'i2', name: 'ボーナス', type: 'income', icon: '🎁', sortOrder: 2 },
  { id: 'i3', name: '副収入', type: 'income', icon: '💰', sortOrder: 3 },
  { id: 'i4', name: 'その他収入', type: 'income', icon: '📥', sortOrder: 4 },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'a1', name: '財布（現金）', type: 'cash', balance: 25000, color: '#4CAF50', sortOrder: 1 },
  { id: 'a2', name: '三菱UFJ銀行', type: 'bank', balance: 580000, color: '#2196F3', sortOrder: 2 },
  { id: 'a3', name: '楽天銀行', type: 'bank', balance: 210000, color: '#F44336', sortOrder: 3 },
  { id: 'a4', name: '楽天カード', type: 'card', balance: -45000, color: '#FF9800', sortOrder: 4 },
  { id: 'a5', name: 'Suica', type: 'emoney', balance: 3200, color: '#00BCD4', sortOrder: 5 },
  { id: 'a6', name: '楽天証券', type: 'investment', balance: 320000, color: '#9C27B0', sortOrder: 6 },
  { id: 'a7', name: 'カーローン', type: 'debt', balance: -800000, color: '#607D8B', sortOrder: 7 },
];

function daysAgo(d: number): string {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString().split('T')[0];
}

function thisMonth(day: number): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function lastMonth(day: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  // 今月
  { id: 't1', type: 'income', amount: 280000, categoryId: 'i1', accountId: 'a2', date: thisMonth(25), memo: '3月分給与', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't2', type: 'expense', amount: 4500, categoryId: 'c1', accountId: 'a1', date: daysAgo(1), memo: 'スーパー買い物', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't3', type: 'expense', amount: 1200, categoryId: 'c2', accountId: 'a5', date: daysAgo(2), memo: '電車通勤', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't4', type: 'expense', amount: 980, categoryId: 'c5', accountId: 'a4', date: daysAgo(3), memo: 'Spotify', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't5', type: 'expense', amount: 3200, categoryId: 'c9', accountId: 'a4', date: daysAgo(4), memo: '焼肉ランチ', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't6', type: 'expense', amount: 8900, categoryId: 'c4', accountId: 'a2', date: thisMonth(5), memo: '電気代', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't7', type: 'expense', amount: 5500, categoryId: 'c3', accountId: 'a1', date: thisMonth(8), memo: 'ドラッグストア', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't8', type: 'expense', amount: 2800, categoryId: 'c1', accountId: 'a4', date: thisMonth(10), memo: 'コンビニ各種', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't9', type: 'expense', amount: 12000, categoryId: 'c7', accountId: 'a4', date: thisMonth(12), memo: 'ユニクロ', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // 先月
  { id: 't10', type: 'income', amount: 280000, categoryId: 'i1', accountId: 'a2', date: lastMonth(25), memo: '2月分給与', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't11', type: 'expense', amount: 45000, categoryId: 'c9', accountId: 'a4', date: lastMonth(14), memo: 'バレンタインディナー', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't12', type: 'expense', amount: 8200, categoryId: 'c1', accountId: 'a1', date: lastMonth(20), memo: '食料品', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't13', type: 'expense', amount: 9100, categoryId: 'c4', accountId: 'a2', date: lastMonth(7), memo: 'ガス代', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 't14', type: 'expense', amount: 18000, categoryId: 'c6', accountId: 'a4', date: lastMonth(18), memo: 'コンサートチケット', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

function makeMonth(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const SAMPLE_SNAPSHOTS: AssetSnapshot[] = [
  { id: 's1', month: makeMonth(-5), totalAssets: 1020000, totalLiabilities: 860000, netWorth: 160000 },
  { id: 's2', month: makeMonth(-4), totalAssets: 1055000, totalLiabilities: 855000, netWorth: 200000 },
  { id: 's3', month: makeMonth(-3), totalAssets: 1082000, totalLiabilities: 849000, netWorth: 233000 },
  { id: 's4', month: makeMonth(-2), totalAssets: 1110000, totalLiabilities: 847000, netWorth: 263000 },
  { id: 's5', month: makeMonth(-1), totalAssets: 1138200, totalLiabilities: 845000, netWorth: 293200 },
  { id: 's6', month: makeMonth(0), totalAssets: 1138200, totalLiabilities: 845000, netWorth: 293200 },
];

export function initSampleData(): void {
  saveCategories(DEFAULT_CATEGORIES);
  saveAccounts(DEFAULT_ACCOUNTS);
  saveTransactions(SAMPLE_TRANSACTIONS);
  saveSnapshots(SAMPLE_SNAPSHOTS);
  markInitialized();
}
