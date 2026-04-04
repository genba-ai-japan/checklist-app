"use client";

import { useEffect, useState } from "react";
import { loadRoutine, toggleRoutineCheck } from "@/lib/dashboard-storage";
import { RoutineItem } from "@/types";

const FREQ_ORDER = ["毎日 午前", "毎日 午後", "1週目", "2週目", "3週目", "4週目", "毎週", "毎月"];
const FREQ_COLORS: Record<string, string> = {
  "毎日 午前": "text-orange-600 bg-orange-50",
  "毎日 午後": "text-orange-500 bg-orange-50",
  "1週目": "text-blue-600 bg-blue-50",
  "2週目": "text-blue-600 bg-blue-50",
  "3週目": "text-blue-600 bg-blue-50",
  "4週目": "text-blue-600 bg-blue-50",
  "毎週": "text-green-600 bg-green-50",
  "毎月": "text-purple-600 bg-purple-50",
};

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentWeekOfMonth(): number {
  const now = new Date();
  return Math.ceil(now.getDate() / 7);
}

function isRelevantToday(freq: string): boolean {
  if (freq === "毎日 午前" || freq === "毎日 午後" || freq === "毎週" || freq === "毎月") return true;
  const week = getCurrentWeekOfMonth();
  if (freq === "1週目" && week === 1) return true;
  if (freq === "2週目" && week === 2) return true;
  if (freq === "3週目" && week === 3) return true;
  if (freq === "4週目" && week === 4) return true;
  return false;
}

export default function RoutinePage() {
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const today = getTodayStr();
  const week = getCurrentWeekOfMonth();

  useEffect(() => {
    setItems(loadRoutine());
  }, []);

  function handleToggle(id: string) {
    toggleRoutineCheck(id, today);
    setItems(loadRoutine());
  }

  const displayItems = showAll ? items : items.filter((i) => isRelevantToday(i.frequency));

  const grouped = FREQ_ORDER.reduce<Record<string, RoutineItem[]>>((acc, freq) => {
    const group = displayItems.filter((i) => i.frequency === freq);
    if (group.length > 0) acc[freq] = group;
    return acc;
  }, {});

  const todayItems = items.filter((i) => isRelevantToday(i.frequency));
  const todayDone = todayItems.filter((i) => i.checkedDates.includes(today)).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-green-700 text-white px-4 py-4 sticky top-0 z-30">
        <h1 className="text-xl font-bold">✅ ルーティンチェックリスト</h1>
        <p className="text-sm text-green-200 mt-1">
          {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })} · {week}週目
        </p>
      </header>

      {/* 今日の進捗 */}
      <div className="bg-green-700 pb-4 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-green-200">今日の完了状況</span>
          <span className="text-xs text-white font-bold">{todayDone} / {todayItems.length}</span>
        </div>
        <div className="bg-green-900/40 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{ width: `${todayItems.length ? (todayDone / todayItems.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* フィルタートグル */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2">
        <button
          onClick={() => setShowAll(false)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${!showAll ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          今日・今週のみ
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${showAll ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          全て表示
        </button>
      </div>

      {/* チェックリスト */}
      <main className="px-4 py-4 space-y-4">
        {Object.entries(grouped).map(([freq, freqItems]) => (
          <section key={freq} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${FREQ_COLORS[freq] || "text-gray-600 bg-gray-100"}`}>
                {freq}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {freqItems.map((item) => {
                const checked = item.checkedDates.includes(today);
                return (
                  <div
                    key={item.id}
                    className="px-4 py-4 flex items-center gap-3 active:bg-gray-50"
                    onClick={() => handleToggle(item.id)}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      checked ? "bg-green-500 border-green-500" : "border-gray-300"
                    }`}>
                      {checked && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${checked ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {item.task}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">所要時間: {item.requiredTime}</p>
                    </div>
                    {checked && (
                      <span className="text-xs text-green-500 font-medium shrink-0">完了</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {displayItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-gray-500 font-medium">今日・今週のルーティンはありません</p>
          </div>
        )}

        {/* ガルーンスケジュール登録メモ */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-700">📌 ガルーンスケジュール登録済み</p>
          <p className="text-xs text-amber-600 mt-1">週次・月次ルーティンはガルーンスケジュールにも登録されています</p>
        </div>
      </main>
    </div>
  );
}
