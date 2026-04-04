"use client";

import { useEffect, useState } from "react";
import { loadGanttTasks, addGanttTask, updateGanttTask, deleteGanttTask } from "@/lib/dashboard-storage";
import { GanttTask, Priority } from "@/types";

const TOTAL_WEEKS = 20;
const MONTH_HEADERS = [
  { label: "4月", start: 1 }, { label: "5月", start: 5 },
  { label: "6月", start: 9 }, { label: "7月", start: 13 }, { label: "8月", start: 17 },
];
const CATEGORIES = ["A. 製造管理業務", "B. 荷受け業務", "C. 充填・調理課", "D. 外部・社内活動"];
const CAT_COLORS: Record<string, { header: string; bar: string; light: string }> = {
  "A. 製造管理業務": { header: "bg-blue-700 text-white", bar: "bg-blue-400", light: "bg-blue-50 text-blue-700" },
  "B. 荷受け業務":  { header: "bg-green-700 text-white", bar: "bg-green-500", light: "bg-green-50 text-green-700" },
  "C. 充填・調理課": { header: "bg-orange-600 text-white", bar: "bg-orange-400", light: "bg-orange-50 text-orange-700" },
  "D. 外部・社内活動": { header: "bg-purple-700 text-white", bar: "bg-purple-400", light: "bg-purple-50 text-purple-700" },
};

const EMPTY_TASK: Omit<GanttTask, "id"> = {
  no: "", priority: "○", category: "A. 製造管理業務",
  taskName: "", specificApproach: "", deadline: "", startWeek: 1, endWeek: 4, color: "#6b7280",
};

export default function GanttPage() {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [form, setForm] = useState<Omit<GanttTask, "id">>({ ...EMPTY_TASK });
  const [showDelete, setShowDelete] = useState<string | null>(null);

  function reload() { setTasks(loadGanttTasks()); }
  useEffect(() => { reload(); }, []);

  function openAdd() { setForm({ ...EMPTY_TASK }); setEditingTask(null); setShowForm(true); }
  function openEdit(t: GanttTask) { setForm({ no: t.no, priority: t.priority, category: t.category, taskName: t.taskName, specificApproach: t.specificApproach, deadline: t.deadline, startWeek: t.startWeek, endWeek: t.endWeek, color: t.color }); setEditingTask(t); setShowForm(true); }

  function handleSave() {
    if (!form.taskName.trim()) return;
    if (editingTask) updateGanttTask({ ...editingTask, ...form });
    else addGanttTask(form);
    reload();
    setShowForm(false);
  }

  function handleDelete(id: string) { deleteGanttTask(id); reload(); setShowDelete(null); }

  // 現在週
  const now = new Date();
  const april1 = new Date(2026, 3, 1);
  const currentWeek = Math.max(1, Math.min(TOTAL_WEEKS, Math.ceil((now.getTime() - april1.getTime()) / (7 * 86400000))));

  const categories = CATEGORIES.filter((c) => tasks.some((t) => t.category === c));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-purple-700 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">📅 年間計画 ガントチャート</h1>
            <p className="text-sm text-purple-200 mt-0.5">2026年度（週単位）</p>
          </div>
          <button onClick={openAdd} className="bg-white text-purple-700 font-bold px-3 py-2 rounded-xl text-sm">＋ 追加</button>
        </div>
      </header>

      {/* 横スクロール ガントチャート */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: "700px" }}>
          {/* 月ヘッダー */}
          <div className="sticky top-[68px] z-20 bg-white border-b border-gray-200">
            <div className="flex">
              <div className="w-40 shrink-0 border-r border-gray-200" />
              <div className="flex flex-1">
                {MONTH_HEADERS.map(({ label }) => (
                  <div key={label} className="flex-[4] text-center text-xs font-bold text-white py-1.5"
                    style={{ backgroundColor: label === "4月" ? "#f59e0b" : ["5月","6月"].includes(label) ? "#3b82f6" : "#6b7280" }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex border-t border-gray-200">
              <div className="w-40 shrink-0 border-r border-gray-200 px-2 py-1">
                <span className="text-xs text-gray-500">タスク</span>
              </div>
              <div className="flex flex-1">
                {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
                  <div key={w} className={`flex-1 text-center text-[10px] py-1 border-l border-gray-100 ${w === currentWeek ? "bg-yellow-100 text-yellow-700 font-bold" : "text-gray-400"}`}>
                    W{((w - 1) % 4) + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* カテゴリ別タスク */}
          {CATEGORIES.map((category) => {
            const catTasks = tasks.filter((t) => t.category === category);
            if (catTasks.length === 0) return null;
            const cc = CAT_COLORS[category] ?? { header: "bg-gray-600 text-white", bar: "bg-gray-400", light: "bg-gray-100 text-gray-700" };
            return (
              <div key={category}>
                <div className={`flex items-center ${cc.header}`}>
                  <div className="w-40 shrink-0 px-3 py-1.5 border-r border-white/20">
                    <span className="text-xs font-bold">{category}</span>
                  </div>
                  <div className="flex flex-1">
                    {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
                      <div key={w} className={`flex-1 py-1.5 border-l border-white/10 ${w === currentWeek ? "bg-yellow-400/30" : ""}`} />
                    ))}
                  </div>
                </div>
                {catTasks.map((task) => (
                  <div key={task.id} className="flex items-center border-b border-gray-50 hover:bg-gray-50 group">
                    <div className="w-40 shrink-0 px-2 py-2 border-r border-gray-100 flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-700 leading-tight font-medium truncate" title={task.taskName}>{task.no} {task.taskName}</p>
                        {task.deadline && <p className="text-[9px] text-gray-400 truncate">{task.deadline}</p>}
                      </div>
                      <div className="hidden group-hover:flex gap-0.5 shrink-0 ml-1">
                        <button onClick={() => openEdit(task)} className="text-blue-400 text-xs p-0.5">✏</button>
                        <button onClick={() => setShowDelete(task.id)} className="text-red-300 text-xs p-0.5">✕</button>
                      </div>
                    </div>
                    <div className="flex flex-1 py-1.5">
                      {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => {
                        const inRange = w >= task.startWeek && w <= task.endWeek;
                        return (
                          <div key={w} className={`flex-1 h-5 border-l border-gray-50 ${w === currentWeek ? "bg-yellow-50" : ""}`}>
                            {inRange && (
                              <div className={`h-full ${cc.bar} opacity-80 ${w === task.startWeek ? "rounded-l-full ml-0.5" : ""} ${w === task.endWeek ? "rounded-r-full mr-0.5" : ""}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* タスク一覧（スマホ向け補完） */}
      <div className="px-4 py-4 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-600">タスク一覧</h2>
          <span className="text-xs text-gray-400">タップして編集</span>
        </div>
        {tasks.map((task) => {
          const cc = CAT_COLORS[task.category];
          return (
            <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm active:bg-gray-50" onClick={() => openEdit(task)}>
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded shrink-0">{task.no}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{task.taskName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cc?.light ?? "bg-gray-100 text-gray-600"}`}>{task.category.replace(/^[A-D]\. /, "")}</span>
                    {task.deadline && <span className="text-xs text-gray-400">期限: {task.deadline}</span>}
                    <span className="text-xs text-gray-400">W{task.startWeek}〜W{task.endWeek}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowDelete(task.id); }} className="text-red-300 text-sm p-1 shrink-0">🗑</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 削除確認 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-3">
            <p className="font-bold text-gray-900">このタスクを削除しますか？</p>
            <p className="text-sm text-gray-500">{tasks.find((t) => t.id === showDelete)?.taskName}</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(showDelete)} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-2xl">削除する</button>
              <button onClick={() => setShowDelete(null)} className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-2xl">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* 追加・編集フォーム */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">📅 {editingTask ? "タスクを編集" : "タスクを追加"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <F label="番号（A1など）"><input value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value })} className={ic} placeholder="例: A1" /></F>
                <F label="優先度">
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={ic}>
                    <option value="◎">◎</option><option value="○">○</option><option value="△">△</option>
                  </select>
                </F>
              </div>
              <F label="カテゴリ">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={ic}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </F>
              <F label="タスク名" required><input value={form.taskName} onChange={(e) => setForm({ ...form, taskName: e.target.value })} className={ic} placeholder="例: 業務フロー完全習得" /></F>
              <F label="具体的取り組み"><textarea value={form.specificApproach} onChange={(e) => setForm({ ...form, specificApproach: e.target.value })} className={ic} rows={2} placeholder="例: OJT研修：日次→週次→月次" /></F>
              <F label="期限"><input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={ic} placeholder="例: 7月末" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label={`開始週 (1〜${TOTAL_WEEKS})`}>
                  <input type="number" min={1} max={TOTAL_WEEKS} value={form.startWeek}
                    onChange={(e) => setForm({ ...form, startWeek: Math.max(1, Math.min(TOTAL_WEEKS, Number(e.target.value))) })} className={ic} />
                </F>
                <F label={`終了週 (1〜${TOTAL_WEEKS})`}>
                  <input type="number" min={1} max={TOTAL_WEEKS} value={form.endWeek}
                    onChange={(e) => setForm({ ...form, endWeek: Math.max(1, Math.min(TOTAL_WEEKS, Number(e.target.value))) })} className={ic} />
                </F>
              </div>
              <p className="text-xs text-gray-400">※ 週はW1=4月第1週、W20=8月第4週</p>
              <button onClick={handleSave} disabled={!form.taskName.trim()} className="w-full bg-purple-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl">
                {editingTask ? "更新する" : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ic = "w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400";
function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
    </div>
  );
}
