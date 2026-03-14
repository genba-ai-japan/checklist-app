"use client";

import React, { useMemo, useState } from "react";
import { getTransactions, getCategories, getSnapshots, getAccounts } from "@/lib/storage";
import { formatCurrency, getCurrentMonth, calcMonthSummary } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";

const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#F44336", "#9C27B0", "#00BCD4", "#607D8B", "#E91E63"];

const PERIOD_OPTIONS = [5, 10, 20, 30];

export default function AnalyticsScreen() {
  const transactions = getTransactions();
  const categories = getCategories();
  const snapshots = getSnapshots();
  const accounts = getAccounts();
  const currentMonth = getCurrentMonth();
  const [analysisMonth, setAnalysisMonth] = useState(currentMonth);

  // 投資シミュレーション用state
  const investmentAccounts = accounts.filter(a => a.type === "investment" && a.balance > 0);
  const totalInvestment = investmentAccounts.reduce((s, a) => s + a.balance, 0);
  const [annualRate, setAnnualRate] = useState("5");
  const [monthlyContrib, setMonthlyContrib] = useState("0");
  const [simYears, setSimYears] = useState(10);

  // 複利計算: A = P(1+r/12)^n + M*((1+r/12)^n - 1)/(r/12)
  const simData = useMemo(() => {
    const P = totalInvestment;
    const r = (parseFloat(annualRate) || 0) / 100;
    const M = parseInt(monthlyContrib.replace(/,/g, ""), 10) || 0;
    const data: { year: string; 元本: number; 評価額: number }[] = [];
    data.push({ year: "現在", 元本: P, 評価額: P });
    for (let y = 1; y <= simYears; y++) {
      const n = y * 12;
      const principal = P + M * n;
      let value: number;
      if (r === 0) {
        value = principal;
      } else {
        const factor = Math.pow(1 + r / 12, n);
        value = P * factor + M * (factor - 1) / (r / 12);
      }
      data.push({ year: `${y}年後`, 元本: Math.round(principal), 評価額: Math.round(value) });
    }
    return data;
  }, [totalInvestment, annualRate, monthlyContrib, simYears]);

  const finalData = simData[simData.length - 1];
  const totalGain = finalData.評価額 - finalData.元本;
  const gainRate = finalData.元本 > 0 ? (totalGain / finalData.元本) * 100 : 0;

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

      {/* 投資シミュレーション */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="font-semibold text-gray-800 mb-1">📈 投資シミュレーション</p>
        <p className="text-xs text-gray-400 mb-4">投資口座の元本をもとに将来の評価額を試算します</p>

        {/* 現在の投資残高 */}
        <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-blue-400 mb-0.5">現在の投資残高（元本）</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalInvestment)}</p>
          {investmentAccounts.length > 0 && (
            <p className="text-xs text-blue-400 mt-1">
              {investmentAccounts.map(a => a.name).join(" / ")}
            </p>
          )}
          {investmentAccounts.length === 0 && (
            <p className="text-xs text-blue-400 mt-1">設定から「投資」タイプの口座を追加してください</p>
          )}
        </div>

        {/* パラメータ設定 */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 w-20 flex-shrink-0">年利率</label>
            <div className="flex items-center flex-1 border border-gray-200 rounded-xl overflow-hidden">
              <input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={annualRate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnnualRate(e.target.value)}
                className="flex-1 px-3 py-2 text-sm text-right outline-none"
              />
              <span className="px-3 text-gray-400 text-sm bg-gray-50 h-full flex items-center border-l border-gray-200">%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 w-20 flex-shrink-0">月々積立額</label>
            <div className="flex items-center flex-1 border border-gray-200 rounded-xl overflow-hidden">
              <span className="px-3 text-gray-400 text-sm bg-gray-50 h-full flex items-center border-r border-gray-200">¥</span>
              <input
                type="tel"
                inputMode="numeric"
                value={monthlyContrib}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const clean = e.target.value.replace(/[^0-9]/g, "");
                  setMonthlyContrib(clean ? Number(clean).toLocaleString() : "0");
                }}
                className="flex-1 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 w-20 flex-shrink-0">期間</label>
            <div className="flex gap-2 flex-1">
              {PERIOD_OPTIONS.map(y => (
                <button
                  key={y}
                  onClick={() => setSimYears(y)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    simYears === y
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  {y}年
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* シミュレーショングラフ */}
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={simData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2196F3" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2196F3" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={v => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : `${v}`} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Area type="monotone" dataKey="評価額" stroke="#2196F3" strokeWidth={2} fill="url(#gainGradient)" dot={false} />
            <Area type="monotone" dataKey="元本" stroke="#4CAF50" strokeWidth={2} fill="none" strokeDasharray="4 2" dot={false} />
          </AreaChart>
        </ResponsiveContainer>

        {/* 凡例 */}
        <div className="flex gap-4 mt-2 mb-4 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-blue-500" />
            <span className="text-xs text-gray-500">評価額</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 bg-green-500 border-dashed" style={{ borderTop: "2px dashed #4CAF50", background: "none" }} />
            <span className="text-xs text-gray-500">元本</span>
          </div>
        </div>

        {/* 結果サマリー */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">{simYears}年後の元本</p>
            <p className="text-sm font-bold text-green-600">{formatCurrency(finalData.元本)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">最終評価額</p>
            <p className="text-sm font-bold text-blue-600">{formatCurrency(finalData.評価額)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">運用益</p>
            <p className={`text-sm font-bold ${totalGain >= 0 ? "text-blue-600" : "text-red-500"}`}>
              {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
            </p>
            <p className={`text-xs ${gainRate >= 0 ? "text-blue-400" : "text-red-400"}`}>
              ({gainRate >= 0 ? "+" : ""}{gainRate.toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
