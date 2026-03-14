"use client";

import { useState, useMemo } from "react";
import { getTransactions, getCategories } from "@/lib/storage";
import { formatCurrency, filterByMonth } from "@/lib/utils";
import { Transaction } from "@/types";

interface Props {
  onAddPress: () => void;
}

export default function CalendarScreen({ onAddPress }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const transactions = getTransactions();
  const categories = getCategories();

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const monthly = useMemo(() => filterByMonth(transactions, monthStr), [transactions, monthStr]);

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
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
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

  const selectedTransactions = selectedDate
    ? transactions.filter(t => t.date === selectedDate)
    : [];

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

      {/* 選択した日付の記録 */}
      {selectedDate && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="font-semibold text-gray-800">
              {Number(selectedDate.split("-")[2])}日の記録
            </p>
            <button
              onClick={onAddPress}
              className="text-sm text-blue-600 font-medium"
            >
              + 追加
            </button>
          </div>
          {selectedTransactions.length === 0 ? (
            <div className="py-6 text-center text-gray-400">
              <p className="text-sm">この日の記録はありません</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {selectedTransactions.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <div key={t.id} className="flex items-center px-4 py-3 gap-3">
                    <span className="text-2xl">{cat?.icon ?? "📦"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{cat?.name ?? "その他"}</p>
                      {t.memo && <p className="text-xs text-gray-400">{t.memo}</p>}
                    </div>
                    <p className={`font-bold text-sm ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
