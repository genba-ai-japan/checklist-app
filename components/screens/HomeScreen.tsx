"use client";

import { useMemo } from "react";
import { getTransactions, getAccounts, getCategories } from "@/lib/storage";
import { formatCurrency, getCurrentMonth, calcMonthSummary, calcAssetTotals, formatDate } from "@/lib/utils";
import { Transaction } from "@/types";

interface Props {
  onAddPress: () => void;
}

export default function HomeScreen({ onAddPress }: Props) {
  const transactions = getTransactions();
  const accounts = getAccounts();
  const categories = getCategories();
  const currentMonth = getCurrentMonth();

  const summary = useMemo(() => calcMonthSummary(transactions, currentMonth), [transactions, currentMonth]);
  const assetTotals = useMemo(() => calcAssetTotals(accounts), [accounts]);

  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [transactions]
  );

  const now = new Date();
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">カネミル</h1>
          <p className="text-sm text-gray-400">{monthLabel}の収支</p>
        </div>
        <button
          onClick={onAddPress}
          className="w-12 h-12 bg-blue-600 active:bg-blue-700 rounded-full flex items-center justify-center shadow-md"
        >
          <span className="text-white text-2xl leading-none">+</span>
        </button>
      </div>

      {/* 今月の収支カード */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-3">今月の収支</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-400 mb-1">収入</p>
            <p className="text-base font-bold text-green-600">{formatCurrency(summary.income)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">支出</p>
            <p className="text-base font-bold text-red-500">{formatCurrency(summary.expense)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">収支</p>
            <p className={`text-base font-bold ${summary.balance >= 0 ? "text-blue-600" : "text-red-500"}`}>
              {summary.balance >= 0 ? "+" : ""}{formatCurrency(summary.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* 純資産カード */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 shadow-md text-white">
        <p className="text-sm text-blue-100 mb-1">純資産</p>
        <p className="text-3xl font-bold mb-3">{formatCurrency(assetTotals.netWorth)}</p>
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-blue-200 text-xs">総資産</p>
            <p className="font-semibold">{formatCurrency(assetTotals.totalAssets)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">総負債</p>
            <p className="font-semibold">−{formatCurrency(assetTotals.totalLiabilities)}</p>
          </div>
        </div>
      </div>

      {/* 最近の記録 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <p className="font-semibold text-gray-800">最近の記録</p>
          <span className="text-xs text-gray-400">{recent.length}件</span>
        </div>
        {recent.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-sm">まだ記録がありません</p>
            <button
              onClick={onAddPress}
              className="mt-3 text-sm text-blue-600 font-medium"
            >
              最初の記録を追加 →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((t) => (
              <TransactionRow key={t.id} transaction={t} categories={categories} accounts={accounts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionRow({
  transaction: t,
  categories,
  accounts,
}: {
  transaction: Transaction;
  categories: ReturnType<typeof getCategories>;
  accounts: ReturnType<typeof getAccounts>;
}) {
  const cat = categories.find(c => c.id === t.categoryId);
  const acc = accounts.find(a => a.id === t.accountId);

  return (
    <div className="flex items-center px-4 py-3 gap-3">
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">
        {cat?.icon ?? "📦"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{cat?.name ?? "その他"}</p>
        <p className="text-xs text-gray-400 truncate">{t.memo || acc?.name || ""}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-bold text-sm ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
          {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
        </p>
        <p className="text-xs text-gray-400">{t.date.slice(5).replace("-", "/")}</p>
      </div>
    </div>
  );
}
