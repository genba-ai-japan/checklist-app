"use client";

import { useState, useMemo } from "react";
import { getTransactions, getCategories, getAccounts, deleteTransaction } from "@/lib/storage";
import { formatCurrency, filterByMonth, calcMonthSummary } from "@/lib/utils";
import SwipeableRow from "@/components/ui/SwipeableRow";

interface Props {
  onAddPress: () => void;
  onDataChange?: () => void;
}

export default function CalendarScreen({ onAddPress, onDataChange }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [transactions, setTransactions] = useState(() => getTransactions());
  const categories = getCategories();
  const accounts = getAccounts();

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const monthly = useMemo(() => filterByMonth(transactions, monthStr), [transactions, monthStr]);
  const summary = useMemo(() => calcMonthSummary(transactions, monthStr), [transactions, monthStr]);

  // 日付ごとの収支マップ
  const dayMap = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const t of monthly) {
      const entry = map.get(t.date) ?? { income: 0, expense: 0 };
      if (t.type === "income") entry.income += t.amount;
      else entry.expense += t.amount;
      map.set(t.date, entry);
    }
    return map;
  }, [monthly]);

  // カレンダー生成
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const calDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  // 月の全取引を日付降順でグルーピング
  const monthlyGrouped = useMemo(() => {
    const sorted = [...monthly].sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map<string, typeof sorted>();
    for (const t of sorted) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthly]);

  const selectedTransactions = selectedDate
    ? transactions.filter(t => t.date === selectedDate)
    : [];

  function handleDelete(id: string) {
    deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    onDataChange?.();
  }

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 active:bg-gray-50">
          ‹
        </button>
        <h2 className="text-lg font-bold text-gray-900">{year}年{month}月</h2>
        <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 active:bg-gray-50">
          ›
        </button>
      </div>

      {/* カレンダー */}
      <div className="bg-white rounded-2xl shadow-sm p-3">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 mb-1">
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-1 ${
                i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        {/* 日付グリッド */}
        <div className="grid grid-cols-7 gap-y-1">
          {calDays.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const entry = dayMap.get(dateStr);
            const isToday =
              year === now.getFullYear() &&
              month === now.getMonth() + 1 &&
              day === now.getDate();
            const isSelected = selectedDate === dateStr;
            const dow = (firstDay + day - 1) % 7;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`flex flex-col items-center py-1 rounded-xl transition-all ${
                  isSelected ? "bg-blue-600" : isToday ? "bg-blue-50" : "active:bg-gray-50"
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isSelected ? "text-white" : isToday ? "text-blue-600" :
                    dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-400" : "text-gray-700"
                  }`}
                >
                  {day}
                </span>
                {entry && (
                  <div className="mt-0.5 space-y-0.5">
                    {entry.income > 0 && (
                      <div className={`text-[9px] leading-none ${isSelected ? "text-green-200" : "text-green-500"}`}>
                        +{(entry.income / 1000).toFixed(0)}k
                      </div>
                    )}
                    {entry.expense > 0 && (
                      <div className={`text-[9px] leading-none ${isSelected ? "text-red-200" : "text-red-400"}`}>
                        -{(entry.expense / 1000).toFixed(0)}k
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 月次損益サマリー */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-gray-400 mb-2">{year}年{month}月の収支</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">収入</p>
            <p className="text-sm font-bold text-green-600">{formatCurrency(summary.income)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">支出</p>
            <p className="text-sm font-bold text-red-500">{formatCurrency(summary.expense)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">収支</p>
            <p className={`text-sm font-bold ${summary.balance >= 0 ? "text-blue-600" : "text-red-500"}`}>
              {summary.balance >= 0 ? "+" : ""}{formatCurrency(summary.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* 選択日 or 月全体の記録一覧 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <p className="font-semibold text-gray-800">
            {selectedDate
              ? `${Number(selectedDate.split("-")[2])}日の記録`
              : `${month}月の記録一覧`}
          </p>
          <div className="flex items-center gap-3">
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-xs text-gray-400">
                全て表示
              </button>
            )}
            <button onClick={onAddPress} className="text-sm text-blue-600 font-medium">+ 追加</button>
          </div>
        </div>

        {(selectedDate ? selectedTransactions : monthly).length === 0 ? (
          <div className="py-6 text-center text-gray-400">
            <p className="text-sm">{selectedDate ? "この日の記録はありません" : "この月の記録はありません"}</p>
          </div>
        ) : selectedDate ? (
          /* 選択日の記録 */
          <div className="divide-y divide-gray-50">
            {selectedTransactions.map(t => {
              const cat = categories.find(c => c.id === t.categoryId);
              const acc = accounts.find(a => a.id === t.accountId);
              return (
                <SwipeableRow key={t.id} onDelete={() => handleDelete(t.id)}>
                  <div className="flex items-center px-4 py-3 gap-3">
                    <span className="text-2xl">{cat?.icon ?? "📦"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{cat?.name ?? "その他"}</p>
                      <p className="text-xs text-gray-400 truncate">{t.memo || acc?.name || ""}</p>
                    </div>
                    <p className={`font-bold text-sm flex-shrink-0 ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
                    </p>
                  </div>
                </SwipeableRow>
              );
            })}
          </div>
        ) : (
          /* 月全体（日付グループ） */
          <div className="divide-y divide-gray-50">
            {monthlyGrouped.map(([date, txs]) => {
              const [, , d] = date.split("-");
              const dow = ["日", "月", "火", "水", "木", "金", "土"][new Date(date).getDay()];
              const dayExp = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
              const dayInc = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
              return (
                <div key={date}>
                  {/* 日付ヘッダー */}
                  <button
                    onClick={() => setSelectedDate(date)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 active:bg-gray-100"
                  >
                    <p className="text-xs font-semibold text-gray-600">
                      {Number(d)}日（{dow}）
                    </p>
                    <div className="flex gap-2 text-xs">
                      {dayInc > 0 && <span className="text-green-600 font-medium">+{formatCurrency(dayInc)}</span>}
                      {dayExp > 0 && <span className="text-red-500 font-medium">−{formatCurrency(dayExp)}</span>}
                    </div>
                  </button>
                  {txs.map(t => {
                    const cat = categories.find(c => c.id === t.categoryId);
                    const acc = accounts.find(a => a.id === t.accountId);
                    return (
                      <SwipeableRow key={t.id} onDelete={() => handleDelete(t.id)}>
                        <div className="flex items-center px-4 py-2.5 gap-3">
                          <span className="text-lg w-8 text-center flex-shrink-0">{cat?.icon ?? "📦"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{cat?.name ?? "その他"}</p>
                            {(t.memo || acc?.name) && (
                              <p className="text-xs text-gray-400 truncate">{t.memo || acc?.name}</p>
                            )}
                          </div>
                          <p className={`font-bold text-sm flex-shrink-0 ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                            {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
                          </p>
                        </div>
                      </SwipeableRow>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
