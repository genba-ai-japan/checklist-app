"use client";

import { useState, useMemo } from "react";
import { getTransactions, getCategories, getAccounts, deleteTransaction } from "@/lib/storage";
import { formatCurrency, getCurrentMonth, formatMonthLabel } from "@/lib/utils";
import { TransactionType } from "@/types";
import SwipeableRow from "@/components/ui/SwipeableRow";

interface Props {
  onBack: () => void;
  onAddPress: () => void;
  onDataChange?: () => void;
}

// 直近N件分の月リストを生成
function getRecentMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export default function RecordsScreen({ onBack, onAddPress, onDataChange }: Props) {
  const [transactions, setTransactions] = useState(() => getTransactions());
  const categories = getCategories();
  const accounts = getAccounts();

  const currentMonth = getCurrentMonth();
  const recentMonths = useMemo(() => getRecentMonths(6), []);

  const [selectedMonth, setSelectedMonth] = useState<string | "all">(currentMonth);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");

  // フィルタ適用
  const filtered = useMemo(() => {
    let list = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (selectedMonth !== "all") list = list.filter(t => t.date.startsWith(selectedMonth));
    if (typeFilter !== "all") list = list.filter(t => t.type === typeFilter);
    return list;
  }, [transactions, selectedMonth, typeFilter]);

  // 日付ごとにグルーピング
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // サマリー
  const summary = useMemo(() => ({
    income: filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
  }), [filtered]);

  function handleDelete(id: string) {
    deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    onDataChange?.();
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f2f2f7] max-w-md mx-auto flex flex-col">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg font-bold"
        >
          ‹
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">記録一覧</h1>
        <button
          onClick={onAddPress}
          className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"
        >
          <span className="text-white text-xl leading-none">+</span>
        </button>
      </div>

      {/* フィルター */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-2 flex-shrink-0">
        {/* 月フィルター */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedMonth("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selectedMonth === "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-500 border-gray-200"
            }`}
          >
            全期間
          </button>
          {recentMonths.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedMonth === m
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              {formatMonthLabel(m)}
            </button>
          ))}
        </div>

        {/* 種別フィルター */}
        <div className="flex gap-2">
          {([["all", "すべて"], ["expense", "支出"], ["income", "収入"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTypeFilter(val)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                typeFilter === val
                  ? val === "expense" ? "bg-red-500 text-white border-red-500"
                  : val === "income" ? "bg-green-500 text-white border-green-500"
                  : "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* サマリーバー */}
      {filtered.length > 0 && (
        <div className="bg-white mx-4 mt-3 rounded-2xl px-4 py-3 shadow-sm flex-shrink-0">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">件数</p>
              <p className="text-sm font-bold text-gray-800">{filtered.length}件</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">収入</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(summary.income)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">支出</p>
              <p className="text-sm font-bold text-red-500">{formatCurrency(summary.expense)}</p>
            </div>
          </div>
        </div>
      )}

      {/* リスト */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">記録がありません</p>
          </div>
        ) : (
          grouped.map(([date, txs]) => {
            const [, m, d] = date.split("-");
            const dow = ["日", "月", "火", "水", "木", "金", "土"][new Date(date).getDay()];
            const dayIncome = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
            const dayExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

            return (
              <div key={date}>
                {/* 日付ヘッダー */}
                <div className="flex items-center justify-between px-1 mb-1">
                  <p className="text-sm font-bold text-gray-700">
                    {Number(m)}月{Number(d)}日
                    <span className="ml-1.5 text-xs font-normal text-gray-400">（{dow}）</span>
                  </p>
                  <div className="flex gap-2 text-xs">
                    {dayIncome > 0 && (
                      <span className="text-green-600 font-medium">+{formatCurrency(dayIncome)}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-red-500 font-medium">−{formatCurrency(dayExpense)}</span>
                    )}
                  </div>
                </div>

                {/* その日の取引 */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
                  {txs.map(t => {
                    const cat = categories.find(c => c.id === t.categoryId);
                    const acc = accounts.find(a => a.id === t.accountId);
                    return (
                      <SwipeableRow key={t.id} onDelete={() => handleDelete(t.id)}>
                        <div className="flex items-center px-4 py-3 gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">
                            {cat?.icon ?? "📦"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {cat?.name ?? "その他"}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {t.memo || acc?.name || ""}
                            </p>
                          </div>
                          <p className={`font-bold text-sm flex-shrink-0 ${
                            t.type === "income" ? "text-green-600" : "text-red-500"
                          }`}>
                            {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
                          </p>
                        </div>
                      </SwipeableRow>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
        <div className="pb-4" />
      </div>
    </div>
  );
}
