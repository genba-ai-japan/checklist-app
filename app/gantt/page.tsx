"use client";

import { useEffect, useState } from "react";
import {
  loadGanttTasks, addGanttTask, updateGanttTask, deleteGanttTask,
  loadCategories, saveCategories,
} from "@/lib/dashboard-storage";
import { GanttTask, GanttPeriod, Priority } from "@/types";

const TOTAL_WEEKS = 20;
const MONTH_HEADERS = [
  { label: "4月", start: 1 }, { label: "5月", start: 5 },
  { label: "6月", start: 9 }, { label: "7月", start: 13 }, { label: "8月", start: 17 },
];

const DEFAULT_CAT_COLORS: Record<string, { header: string; bar: string; light: string }> = {
  "製造管理":             { header: "bg-blue-700 text-white",   bar: "bg-blue-400",   light: "bg-blue-50 text-blue-700" },
  "荷受け業務":           { header: "bg-green-700 text-white",  bar: "bg-green-500",  light: "bg-green-50 text-green-700" },
  "充填・調理課":         { header: "bg-orange-600 text-white", bar: "bg-orange-400", light: "bg-orange-50 text-orange-700" },
  "外部・社内活動":       { header: "bg-purple-700 text-white", bar: "bg-purple-400", light: "bg-purple-50 text-purple-700" },
  "製造管理・荷受け業務": { header: "bg-teal-700 text-white",   bar: "bg-teal-400",   light: "bg-teal-50 text-teal-700" },
  "人材育成":             { header: "bg-rose-700 text-white",   bar: "bg-rose-400",   light: "bg-rose-50 text-rose-700" },
};
const FALLBACK_COLORS = [
  { header: "bg-teal-700 text-white",   bar: "bg-teal-400",   light: "bg-teal-50 text-teal-700" },
  { header: "bg-rose-700 text-white",   bar: "bg-rose-400",   light: "bg-rose-50 text-rose-700" },
  { header: "bg-indigo-700 text-white", bar: "bg-indigo-400", light: "bg-indigo-50 text-indigo-700" },
  { header: "bg-amber-700 text-white",  bar: "bg-amber-400",  light: "bg-amber-50 text-amber-700" },
];
const PRIORITY_COLORS: Record<Priority, string> = { "◎": "bg-red-100 text-red-600", "○": "bg-yellow-100 text-yellow-700", "△": "bg-gray-100 text-gray-500" };

function getCatColors(cat: string, allCats: string[]) {
  if (DEFAULT_CAT_COLORS[cat]) return DEFAULT_CAT_COLORS[cat];
  const idx = allCats.indexOf(cat) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[Math.max(0, idx)];
}

function makeEmptyTask(firstCat: string): Omit<GanttTask, "id"> {
  return { no: "", priority: "○", category: firstCat, taskName: "", specificApproach: "", deadline: "", periods: [{ startWeek: 1, endWeek: 4 }], color: "#6b7280" };
}

export default function GanttPage() {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [form, setForm] = useState<Omit<GanttTask, "id">>(makeEmptyTask("製造管理"));
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [showCatEditor, setShowCatEditor] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  function reload() {
    setTasks(loadGanttTasks());
    setCategories(loadCategories());
  }
  useEffect(() => { reload(); }, []);

  function openAdd() {
    setForm(makeEmptyTask(categories[0] ?? "製造管理"));
    setEditingTask(null);
    setShowForm(true);
  }
  function openEdit(t: GanttTask) {
    setForm({ no: t.no, priority: t.priority, category: t.category, taskName: t.taskName, specificApproach: t.specificApproach, deadline: t.deadline, periods: t.periods?.length ? [...t.periods] : [{ startWeek: 1, endWeek: 4 }], color: t.color });
    setEditingTask(t);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.taskName.trim()) return;
    if (editingTask) updateGanttTask({ ...editingTask, ...form });
    else addGanttTask(form);
    reload();
    setShowForm(false);
  }

  function handleDelete(id: string) { deleteGanttTask(id); reload(); setShowDelete(null); }

  function addPeriod() {
    setForm((f) => ({ ...f, periods: [...f.periods, { startWeek: 1, endWeek: 4 }] }));
  }
  function removePeriod(idx: number) {
    setForm((f) => ({ ...f, periods: f.periods.filter((_, i) => i !== idx) }));
  }
  function updatePeriod(idx: number, field: keyof GanttPeriod, val: number) {
    setForm((f) => ({
      ...f,
      periods: f.periods.map((p, i) => i === idx ? { ...p, [field]: Math.max(1, Math.min(TOTAL_WEEKS, val)) } : p),
    }));
  }

  function addCategory() {
    const name = newCatName.trim();
    if (!name || categories.includes(name)) return;
    const updated = [...categories, name];
    saveCategories(updated);
    setCategories(updated);
    setNewCatName("");
  }
  function deleteCategory(cat: string) {
    const updated = categories.filter((c) => c !== cat);
    saveCategories(updated);
    setCategories(updated);
  }

  const now = new Date();
  const april1 = new Date(2026, 3, 1);
  const currentWeek = Math.max(1, Math.min(TOTAL_WEEKS, Math.ceil((now.getTime() - april1.getTime()) / (7 * 86400000))));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-purple-700 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">📅 年間計画 ガントチャート</h1>
            <p className="text-sm text-purple-200 mt-0.5">2026年度（週単位）</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCatEditor(true)} className="bg-white/20 text-white font-bold px-3 py-2 rounded-xl text-sm">カテゴリ</button>
            <button onClick={openAdd} className="bg-white text-purple-700 font-bold px-3 py-2 rounded-xl text-sm">＋ 追加</button>
          </div>
        </div>
      </header>

      {/* 横スクロール ガントチャート */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: "700px" }}>
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

          {categories.map((category) => {
            const catTasks = tasks.filter((t) => t.category === category);
            if (catTasks.length === 0) return null;
            const cc = getCatColors(category, categories);
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
                        <p className="text-[11px] text-gray-700 leading-tight font-medium truncate" title={task.taskName}>{task.taskName}</p>
                        {task.deadline && <p className="text-[9px] text-gray-400 truncate">{task.deadline}</p>}
                      </div>
                      <div className="hidden group-hover:flex gap-0.5 shrink-0 ml-1">
                        <button onClick={() => openEdit(task)} className="text-blue-400 text-xs p-0.5">✏</button>
                        <button onClick={() => setShowDelete(task.id)} className="text-red-300 text-xs p-0.5">✕</button>
                      </div>
                    </div>
                    <div className="flex flex-1 py-1.5">
                      {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => {
                        const inAnyPeriod = task.periods?.some((p) => w >= p.startWeek && w <= p.endWeek);
                        const isStart = task.periods?.some((p) => w === p.startWeek);
                        const isEnd = task.periods?.some((p) => w === p.endWeek);
                        return (
                          <div key={w} className={`flex-1 h-5 border-l border-gray-50 ${w === currentWeek ? "bg-yellow-50" : ""}`}>
                            {inAnyPeriod && (
                              <div className={`h-full ${cc.bar} opacity-80 ${isStart ? "rounded-l-full ml-0.5" : ""} ${isEnd ? "rounded-r-full mr-0.5" : ""}`} />
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

      {/* タスク一覧 */}
      <div className="px-4 py-4 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-600">タスク一覧</h2>
          <span className="text-xs text-gray-400">タップして編集</span>
        </div>
        {tasks.map((task) => {
          const cc = getCatColors(task.category, categories);
          const periodsLabel = task.periods?.map((p) => `W${p.startWeek}〜W${p.endWeek}`).join(" / ") ?? "";
          return (
            <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm active:bg-gray-50" onClick={() => openEdit(task)}>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cc?.light ?? "bg-gray-100 text-gray-600"}`}>{task.category}</span>
                    {periodsLabel && <span className="text-xs text-gray-400">{periodsLabel}</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-800">{task.taskName}</p>
                  {task.specificApproach && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.specificApproach}</p>}
                  {task.deadline && <p className="text-xs text-gray-400 mt-1">期限: {task.deadline}</p>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowDelete(task.id); }} className="text-red-300 text-sm p-1 shrink-0">🗑</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* カテゴリ編集モーダル */}
      {showCatEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCatEditor(false)}>
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">カテゴリを編集</h3>
              <button onClick={() => setShowCatEditor(false)} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="p-4 space-y-2">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                  <span className="flex-1 text-sm text-gray-800">{cat}</span>
                  <button onClick={() => deleteCategory(cat)} className="text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-50">削除</button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
                  placeholder="新しいカテゴリ名"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <button onClick={addCategory}
                  className={`font-bold px-4 py-2.5 rounded-xl text-sm ${newCatName.trim() ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-400"}`}>追加</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <div className="bg-white rounded-t-3xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">📅 {editingTask ? "タスクを編集" : "タスクを追加"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="p-4 space-y-3 pb-10">
              <div className="grid grid-cols-2 gap-3">
                <F label="番号（任意）"><input value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value })} className={ic} placeholder="例: 1" /></F>
                <F label="優先度">
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={ic}>
                    <option value="◎">◎ 最優先</option><option value="○">○ 通常</option><option value="△">△ 低</option>
                  </select>
                </F>
              </div>
              <F label="カテゴリ">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={ic}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </F>
              <F label="タスク名" required><input value={form.taskName} onChange={(e) => setForm({ ...form, taskName: e.target.value })} className={ic} placeholder="例: 業務フロー完全習得" /></F>
              <F label="具体的取り組み"><textarea value={form.specificApproach} onChange={(e) => setForm({ ...form, specificApproach: e.target.value })} className={ic} rows={2} placeholder="例: OJT研修：日次→週次→月次" /></F>
              <F label="期限"><input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={ic} placeholder="例: 7月末" /></F>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">期間（W1=4月第1週〜W20=8月第4週）</label>
                  <button onClick={addPeriod} className="text-xs text-purple-600 font-medium px-2 py-1 bg-purple-50 rounded-lg">＋ 期間追加</button>
                </div>
                <div className="space-y-2">
                  {form.periods.map((period, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <span className="text-xs text-gray-500 shrink-0">期間{idx + 1}</span>
                      <div className="flex items-center gap-1 flex-1">
                        <input type="number" min={1} max={TOTAL_WEEKS} value={period.startWeek}
                          onChange={(e) => updatePeriod(idx, "startWeek", Number(e.target.value))}
                          className="w-14 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        <span className="text-xs text-gray-400">〜</span>
                        <input type="number" min={1} max={TOTAL_WEEKS} value={period.endWeek}
                          onChange={(e) => updatePeriod(idx, "endWeek", Number(e.target.value))}
                          className="w-14 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        <span className="text-xs text-gray-400">週</span>
                      </div>
                      {form.periods.length > 1 && (
                        <button onClick={() => removePeriod(idx)} className="text-red-300 text-sm px-1 shrink-0">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                className={`w-full font-bold py-4 rounded-2xl text-white ${form.taskName.trim() ? "bg-purple-600 active:bg-purple-700" : "bg-gray-300"}`}
              >
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
