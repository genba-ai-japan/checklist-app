"use client";

import { getGanttTasks } from "@/lib/dashboard-storage";
import { GanttTask } from "@/types";

const TOTAL_WEEKS = 20; // April W1 to August W4

const MONTH_HEADERS = [
  { label: "4月", weeks: [1, 2, 3, 4] },
  { label: "5月", weeks: [5, 6, 7, 8] },
  { label: "6月", weeks: [9, 10, 11, 12] },
  { label: "7月", weeks: [13, 14, 15, 16] },
  { label: "8月", weeks: [17, 18, 19, 20] },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; header: string }> = {
  "A. 製造管理業務": { bg: "bg-blue-100", text: "text-blue-800", header: "bg-blue-700 text-white" },
  "B. 荷受け業務": { bg: "bg-green-100", text: "text-green-800", header: "bg-green-700 text-white" },
  "C. 充填・調理課": { bg: "bg-orange-100", text: "text-orange-800", header: "bg-orange-600 text-white" },
  "D. 外部・社内活動": { bg: "bg-purple-100", text: "text-purple-800", header: "bg-purple-700 text-white" },
};

const BAR_COLORS: Record<string, string> = {
  "A. 製造管理業務": "bg-blue-400",
  "B. 荷受け業務": "bg-green-500",
  "C. 充填・調理課": "bg-orange-400",
  "D. 外部・社内活動": "bg-purple-400",
};

export default function GanttPage() {
  const tasks = getGanttTasks();

  const categories = Array.from(new Set(tasks.map((t) => t.category)));

  // Current week (weeks since April 1, 2026)
  const now = new Date();
  const april1 = new Date(2026, 3, 1);
  const diffMs = now.getTime() - april1.getTime();
  const currentWeek = Math.max(1, Math.min(TOTAL_WEEKS, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000))));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-purple-700 text-white px-4 py-4 sticky top-0 z-30">
        <h1 className="text-xl font-bold">📅 年間計画 ガントチャート</h1>
        <p className="text-sm text-purple-200 mt-0.5">2026年度（週単位）</p>
      </header>

      {/* スクロール可能なガントチャートエリア */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: "700px" }}>
          {/* 月ヘッダー */}
          <div className="sticky top-[68px] z-20 bg-white border-b border-gray-200">
            <div className="flex">
              {/* タスク名列 */}
              <div className="w-40 shrink-0 border-r border-gray-200" />
              {/* 月ラベル */}
              <div className="flex flex-1">
                {MONTH_HEADERS.map(({ label }) => (
                  <div
                    key={label}
                    className="flex-1 text-center text-xs font-bold text-white py-1.5"
                    style={{ backgroundColor: label === "4月" ? "#f59e0b" : label === "5月" || label === "6月" ? "#3b82f6" : "#6b7280" }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
            {/* 週ヘッダー */}
            <div className="flex border-t border-gray-200">
              <div className="w-40 shrink-0 border-r border-gray-200 px-2 py-1">
                <span className="text-xs text-gray-500 font-medium">タスク</span>
              </div>
              <div className="flex flex-1">
                {MONTH_HEADERS.flatMap(({ weeks }) =>
                  weeks.map((w) => (
                    <div
                      key={w}
                      className={`flex-1 text-center text-[10px] py-1 border-l border-gray-100 ${
                        w === currentWeek ? "bg-yellow-100 text-yellow-700 font-bold" : "text-gray-400"
                      }`}
                    >
                      W{((w - 1) % 4) + 1}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* カテゴリ別タスク */}
          {categories.map((category) => {
            const catTasks = tasks.filter((t) => t.category === category);
            const colors = CATEGORY_COLORS[category] || { bg: "bg-gray-100", text: "text-gray-800", header: "bg-gray-600 text-white" };
            const barColor = BAR_COLORS[category] || "bg-gray-400";

            return (
              <div key={category}>
                {/* カテゴリヘッダー行 */}
                <div className={`flex items-center ${colors.header}`}>
                  <div className="w-40 shrink-0 px-3 py-2 border-r border-white/20">
                    <span className="text-xs font-bold">{category}</span>
                  </div>
                  <div className="flex-1 flex">
                    {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
                      <div
                        key={w}
                        className={`flex-1 py-2 border-l border-white/10 ${
                          w === currentWeek ? "bg-yellow-400/30" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* タスク行 */}
                {catTasks.map((task) => (
                  <GanttRow key={task.id} task={task} barColor={barColor} currentWeek={currentWeek} />
                ))}
              </div>
            );
          })}

          {/* 凡例 */}
          <div className="px-4 py-4 bg-white border-t border-gray-200 mt-2">
            <p className="text-xs text-gray-500 font-medium mb-2">凡例</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(BAR_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className={`w-4 h-3 rounded ${color}`} />
                  <span className="text-xs text-gray-600">{cat.replace(/^[A-D]\. /, "")}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 rounded bg-yellow-200" />
                <span className="text-xs text-gray-600">現在週</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* タスク一覧（スマホ向け） */}
      <div className="px-4 py-4 space-y-2">
        <h2 className="text-sm font-bold text-gray-600 mb-3">タスク一覧</h2>
        {tasks.map((task) => {
          const colors = CATEGORY_COLORS[task.category] || { bg: "bg-gray-100", text: "text-gray-700" };
          return (
            <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">{task.no}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{task.taskName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {task.category.replace(/^[A-D]\. /, "")}
                    </span>
                    {task.deadline && (
                      <span className="text-xs text-gray-400">期限: {task.deadline}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{task.priority}</span>
              </div>
              {task.specificApproach && (
                <p className="text-xs text-gray-400 mt-1.5 pl-7 line-clamp-2">{task.specificApproach}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GanttRow({ task, barColor, currentWeek }: { task: GanttTask; barColor: string; currentWeek: number }) {
  return (
    <div className="flex items-center hover:bg-gray-50 border-b border-gray-50">
      {/* タスク名 */}
      <div className="w-40 shrink-0 px-2 py-2 border-r border-gray-100">
        <p className="text-[11px] text-gray-700 leading-tight font-medium truncate" title={task.taskName}>
          {task.no} {task.taskName}
        </p>
        {task.deadline && (
          <p className="text-[9px] text-gray-400 truncate">{task.deadline}</p>
        )}
      </div>

      {/* ガントバー */}
      <div className="flex flex-1 py-1.5">
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => {
          const inRange = w >= task.startWeek && w <= task.endWeek;
          const isStart = w === task.startWeek;
          const isEnd = w === task.endWeek;
          return (
            <div
              key={w}
              className={`flex-1 h-5 border-l border-gray-50 ${
                w === currentWeek ? "bg-yellow-50" : ""
              }`}
            >
              {inRange && (
                <div
                  className={`h-full ${barColor} opacity-80 ${
                    isStart ? "rounded-l-full ml-0.5" : ""
                  } ${isEnd ? "rounded-r-full mr-0.5" : ""}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
