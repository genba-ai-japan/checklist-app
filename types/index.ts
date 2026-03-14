export type TransactionType = 'income' | 'expense';

export type AccountType = 'cash' | 'bank' | 'card' | 'emoney' | 'investment' | 'debt';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  sortOrder: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetSnapshot {
  id: string;
  month: string; // YYYY-MM
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}
