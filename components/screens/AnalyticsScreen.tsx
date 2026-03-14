"use client";

import { useMemo, useState } from "react";
import { getTransactions, getCategories, getSnapshots } from "@/lib/storage";
import { formatCurrency, getCurrentMonth, calcMonthSummary } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#F44336", "#9C27B0", "#00BCD4", "#607D8B", "#E91E63"];

export default function AnalyticsScreen() {
  const transactions = getTransactions();
  const categories = getCategories();
  const snapshots = getSnapshots();
  const currentMonth = getCurrentMonth();
  const [analysisMonth, setAnalysisMonth] = useState(currentMonth);

  // 過去6ヶ月の月別収支
  const monthlyData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months.map(m => {
      const { income, expense } = calcMonthSummary(transactions, m);
      const label = m.slice(5) + "月"; // "03月"
      return { month: label, income, expense, balance: income - expense };
    });
  }, [transactions]);

  // 選択月のカテゴリ別支出
  const categoryData = useMemo(() => {
    const monthly = transactions.filter(t => t.date.startsWith(analysisMonth) && t.type === "expense");
    const map = new Map<string, number>();
    for (const t of monthly) {
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        return { name: cat?.name ?? "その他", icon: cat?.icon ?? "📦", amount };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, analysisMonth]);

  // 純資産推移
  const netWorthData = useMemo(
    () =>
      [...snapshots]
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6)
        .map(s => ({
          month: s.month.slice(5) + "月",
          純資産: s.netWorth,
          総資産: s.totalAssets,
        })),
    [snapshots]
  );

  const { income, expense, balance } = calcMonthSummary(transactions, analysisMonth);

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">分析</h1>

      {/* 月切り替え */}
      <div className="flex items-center gap-2">
        <input
          type="month"
          value={analysisMonth}
          onChange={e => setAnalysisMonth(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 今月サマリー */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "収入", value: income, color: "text-green-600" },
          { label: "支出", value: expense, color: "text-red-500" },
          { label: "収支", value: balance, color: balance >= 0 ? "text-blue-600" : "text-red-500" },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-400 mb-1">{item.label}</p>
            <p className={`text-sm font-bold ${item.color}`}>
              {item.label === "収支" && balance >= 0 ? "+" : ""}
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* 月別収支グラフ */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="font-semibold text-gray-800 mb-3">月別収支推移（6ヶ月）</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Bar dataKey="income" name="収入" fill="#4CAF50" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="支出" fill="#F44336" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* カテゴリ別支出 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="font-semibold text-gray-800 mb-3">カテゴリ別支出</p>
        {categoryData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">この月の支出データがありません</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  strokeWidth={0}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {categoryData.map((c, i) => {
                const total = categoryData.reduce((s, x) => s + x.amount, 0);
                const pct = total > 0 ? (c.amount / total * 100).toFixed(0) : "0";
                return (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-600 flex-1">{c.icon} {c.name}</span>
                    <span className="text-xs text-gray-400">{pct}%</span>
                    <span className="text-sm font-medium text-gray-800">{formatCurrency(c.amount)}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 純資産推移グラフ */}
      {netWorthData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-semibold text-gray-800 mb-3">純資産推移</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={netWorthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Line type="monotone" dataKey="純資産" stroke="#2196F3" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="総資産" stroke="#4CAF50" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
