"use client";

import { useEffect, useState } from "react";
import { loadGoals, saveGoals } from "@/lib/dashboard-storage";
import { Goal, GoalStatus } from "@/types";

const CATEGORIES = ["すべて", "充填・調理課", "荷受け業務", "製造管理・荷受け業務", "製造管理", "人材育成", "外部・社内活動"];

const STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
};

const STATUS_COLORS: Record<GoalStatus, string> = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  "◎": "bg-red-100 text-red-600",
  "○": "bg-yellow-100 text-yellow-700",
  "△": "bg-gray-100 text-gray-500",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState("すべて");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  function cycleStatus(goal: Goal) {
    const order: GoalStatus[] = ["not_started", "in_progress", "completed"];
    const idx = order.indexOf(goal.status);
    const next = order[(idx + 1) % order.length];
    const updated = { ...goal, status: next };
    const newGoals = goals.map((g) => (g.id === goal.id ? updated : g));
    setGoals(newGoals);
    saveGoals(newGoals);
    if (selectedGoal?.id === goal.id) setSelectedGoal(updated);
  }

  function updateComment(goal: Goal, comment: string) {
    const updated = { ...goal, resultComment: comment };
    const newGoals = goals.map((g) => (g.id === goal.id ? updated : g));
    setGoals(newGoals);
    saveGoals(newGoals);
    setSelectedGoal(updated);
  }

  const filtered = goals.filter((g) =>
    filter === "すべて" || g.category === filter
  );

  const stats = {
    total: goals.length,
    done: goals.filter((g) => g.status === "completed").length,
    inProgress: goals.filter((g) => g.status === "in_progress").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-blue-700 text-white px-4 py-4 sticky top-0 z-30">
        <h1 className="text-xl font-bold">🎯 2026年度 目標管理</h1>
        <div className="flex gap-4 mt-2 text-sm">
          <span>全{stats.total}件</span>
          <span className="text-blue-200">進行中 {stats.inProgress}</span>
          <span className="text-green-300">完了 {stats.done}</span>
        </div>
      </header>

      {/* 進捗バー */}
      <div className="bg-blue-700 pb-3 px-4">
        <div className="bg-blue-900/40 rounded-full h-2">
          <div
            className="bg-green-400 h-2 rounded-full transition-all"
            style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-blue-200 mt-1 text-right">
          達成率 {stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%
        </p>
      </div>

      {/* カテゴリフィルター */}
      <div className="overflow-x-auto bg-white border-b border-gray-200">
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 目標リスト */}
      <main className="px-4 py-4 space-y-3">
        {filtered.map((goal) => (
          <div
            key={goal.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            onClick={() => setSelectedGoal(goal)}
          >
            <div className="p-4">
              <div className="flex items-start gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[goal.priority]}`}>
                  {goal.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-medium">No.{goal.no}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {goal.category}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 mt-1">{goal.objective}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); cycleStatus(goal); }}
                  className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[goal.status]}`}
                >
                  {STATUS_LABELS[goal.status]}
                </button>
              </div>
              {goal.kpi && (
                <p className="text-xs text-gray-500 mt-2">KPI: {goal.kpi}</p>
              )}
              {goal.deadline && (
                <p className="text-xs text-gray-400 mt-0.5">期限: {goal.deadline}</p>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* 詳細モーダル */}
      {selectedGoal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setSelectedGoal(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">目標詳細</h3>
              <button onClick={() => setSelectedGoal(null)} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${PRIORITY_COLORS[selectedGoal.priority]}`}>
                  優先 {selectedGoal.priority}
                </span>
                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {selectedGoal.category}
                </span>
                <button
                  onClick={() => cycleStatus(selectedGoal)}
                  className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[selectedGoal.status]}`}
                >
                  {STATUS_LABELS[selectedGoal.status]}
                </button>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">目標・施策</p>
                <p className="text-base font-bold text-gray-900 mt-1">{selectedGoal.objective}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">具体的アクション</p>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{selectedGoal.specificActions}</p>
              </div>

              {selectedGoal.kpi && (
                <div>
                  <p className="text-xs text-gray-400 font-medium">KPI・指標</p>
                  <p className="text-sm font-medium text-blue-700 mt-1">{selectedGoal.kpi}</p>
                </div>
              )}

              {selectedGoal.deadline && (
                <div>
                  <p className="text-xs text-gray-400 font-medium">期限</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{selectedGoal.deadline}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">結果・コメント</p>
                <textarea
                  value={selectedGoal.resultComment}
                  onChange={(e) => updateComment(selectedGoal, e.target.value)}
                  placeholder="結果やコメントを入力..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="pb-2">
                <p className="text-xs text-gray-400 mb-2">ステータスを変更：</p>
                <div className="flex gap-2">
                  {(["not_started", "in_progress", "completed"] as GoalStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        const updated = { ...selectedGoal, status: s };
                        const newGoals = goals.map((g) => g.id === updated.id ? updated : g);
                        setGoals(newGoals);
                        saveGoals(newGoals);
                        setSelectedGoal(updated);
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium ${
                        selectedGoal.status === s ? STATUS_COLORS[s] + " ring-2 ring-offset-1 ring-blue-400" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
