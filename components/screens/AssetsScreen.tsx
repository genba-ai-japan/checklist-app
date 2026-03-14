"use client";

import { useMemo } from "react";
import { getAccounts, getSnapshots } from "@/lib/storage";
import { formatCurrency, calcAssetTotals, ACCOUNT_TYPE_LABELS } from "@/lib/utils";
import { Account } from "@/types";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const TYPE_ORDER = ["cash", "bank", "emoney", "investment", "card", "debt"];

const COLORS = ["#4CAF50", "#2196F3", "#00BCD4", "#9C27B0", "#FF9800", "#607D8B"];

export default function AssetsScreen() {
  const accounts = getAccounts();
  const { totalAssets, totalLiabilities, netWorth } = useMemo(
    () => calcAssetTotals(accounts),
    [accounts]
  );

  const assetAccounts = accounts.filter(a => a.type !== "debt" && a.balance >= 0);
  const debtAccounts = accounts.filter(a => a.type === "debt" || a.balance < 0);

  const pieData = useMemo(
    () =>
      assetAccounts
        .filter(a => a.balance > 0)
        .map(a => ({ name: a.name, value: a.balance })),
    [assetAccounts]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const type of TYPE_ORDER) {
      const group = accounts.filter(a => a.type === type);
      if (group.length > 0) map.set(type, group);
    }
    return map;
  }, [accounts]);

  return (
    <div className="px-4 pt-4 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">資産一覧</h1>

      {/* 純資産サマリー */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-md">
        <p className="text-sm text-blue-100 mb-1">純資産</p>
        <p className="text-3xl font-bold">{formatCurrency(netWorth)}</p>
        <div className="flex gap-4 mt-3 text-sm">
          <div>
            <p className="text-blue-200 text-xs">総資産</p>
            <p className="font-semibold">{formatCurrency(totalAssets)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">総負債</p>
            <p className="font-semibold">−{formatCurrency(totalLiabilities)}</p>
          </div>
        </div>
      </div>

      {/* 資産構成グラフ */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-semibold text-gray-800 mb-3">資産構成</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-gray-600 text-xs">{d.name}</span>
                  </div>
                  <span className="text-gray-800 font-medium text-xs">
                    {((d.value / totalAssets) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 口座一覧 */}
      {Array.from(grouped.entries()).map(([type, accs]) => (
        <div key={type} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {ACCOUNT_TYPE_LABELS[type]}
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {accs.map(acc => (
              <div key={acc.id} className="flex items-center px-4 py-3 gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: acc.color }}
                >
                  {acc.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{acc.name}</p>
                  <p className="text-xs text-gray-400">{ACCOUNT_TYPE_LABELS[acc.type]}</p>
                </div>
                <p className={`font-bold text-sm ${acc.balance < 0 ? "text-red-500" : "text-gray-800"}`}>
                  {acc.balance < 0 ? "−" : ""}{formatCurrency(Math.abs(acc.balance))}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {accounts.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
          <p className="text-3xl mb-2">💳</p>
          <p className="text-sm">口座がありません</p>
          <p className="text-xs mt-1">設定から口座を追加してください</p>
        </div>
      )}
    </div>
  );
}
