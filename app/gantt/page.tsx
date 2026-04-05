"use client";

import { useEffect, useState } from "react";
import {
  loadGanttTasks, addGanttTask, updateGanttTask, deleteGanttTask, saveGanttTasks,
  loadCategories, saveCategories,
} from "@/lib/dashboard-storage";
import { GanttTask, GanttPeriod, Priority } from "@/types";

const TOTAL_WEEKS = 48;

const MONTH_HEADERS = [
  { label: "4月" }, { label: "5月" }, { label: "6月" }, { label: "7月" },
  { label: "8月" }, { label: "9月" }, { label: "10月" }, { label: "11月" },
  { label: "12月" }, { label: "1月" }, { label: "2月" }, { label: "3月" },
];
// 4色で年度4クォーター
const MONTH_BG = [
  "#f59e0b","#f59e0b","#f59e0b",
  "#3b82f6","#3b82f6","#3b82f6",
  "#6b7280","#6b7280","#6b7280",
  "#8b5cf6","#8b5cf6","#8b5cf6",
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
const PRIORITY_COLORS: Record<Priority, string> = {
  "◎": "bg-red-100 text-red-600",
  "○": "bg-yellow-100 text-yellow-700",
  "△": "bg-gray-100 text-gray-500",
};

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

  // タスク並び替え（カテゴリ内）
  function moveTask(taskId: string, direction: "up" | "down", category: string) {
    const catTasks = tasks.filter((t) => t.category === category);
    const catIdx = catTasks.findIndex((t) => t.id === taskId);
    const targetCatIdx = direction === "up" ? catIdx - 1 : catIdx + 1;
    if (targetCatIdx < 0 || targetCatIdx >= catTasks.length) return;
    const all = [...tasks];
    const idx = all.findIndex((t) => t.id === taskId);
    const targetIdx = all.findIndex((t) => t.id === catTasks[targetCatIdx].id);
    [all[idx], all[targetIdx]] = [all[targetIdx], all[idx]];
    saveGanttTasks(all);
    setTasks(all);
  }

  // カテゴリ並び替え
  function moveCategory(cat: string, direction: "up" | "down") {
    const idx = categories.indexOf(cat);
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= categories.length) return;
    const updated = [...categories];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    saveCategories(updated);
    setCategories(updated);
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

  // 期間ヘルパー
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

  // 現在週
  const now = new Date();
  const april1 = new Date(2026, 3, 1);
  const currentWeek = Math.max(1, Math.min(TOTAL_WEEKS, Math.ceil((now.getTime() - april1.getTime()) / (7 * 86400000))));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-purple-700 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">📅 年間計画 ガントチャート</h1>
            <p className="text-sm text-purple-200 mt-0.5">2026年度 4月〜3月（週単位）</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCatEditor(true)} className="bg-white/20 text-white font-bold px-3 py-2 rounded-xl text-sm active:bg-white/30">カテゴリ</button>
            <button onClick={openAdd} className="bg-white text-purple-700 font-bold px-3 py-2 rounded-xl text-sm active:bg-purple-50">＋ 追加</button>
          </div>
        </div>
      </header>

      {/* 横スクロール ガントチャート */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: "1100px" }}>
          {/* 月ヘッダー（スティッキー） */}
          <div className="sticky top-[80px] z-20 bg-white border-b border-gray-200">
            <div className="flex">
              <div className="w-52 shrink-0 border-r border-gray-200" />
              <div className="flex flex-1">
                {MONTH_HEADERS.map(({ label }, mi) => (
                  <div key={label} className="flex-[4] text-center text-xs font-bold text-white py-1.5"
                    style={{ backgroundColor: MONTH_BG[mi] }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>
            {/* 週番号行 */}
            <div className="flex border-t border-gray-200">
              <div className="w-52 shrink-0 border-r border-gray-200 px-2 py-1">
                <span className="text-xs text-gray-500">タスク</span>
              </div>
              <div className="flex flex-1">
                {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
                  <div key={w} className={`flex-1 text-center text-[9px] py-1 border-l border-gray-100 ${w === currentWeek ? "bg-yellow-100 text-yellow-700 font-bold" : "text-gray-400"}`}>
                    {((w - 1) % 4) + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* カテゴリ別タスク行 */}
          {categories.map((category) => {
            const catTasks = tasks.filter((t) => t.category === category);
            if (catTasks.length === 0) return null;
            const cc = getCatColors(category, categories);
            return (
              <div key={category}>
                {/* カテゴリヘッダー行 */}
                <div className={`flex items-center ${cc.header}`}>
                  <div className="w-52 shrink-0 px-3 py-1.5 border-r border-white/20">
                    <span className="text-xs font-bold">{category}</span>
                  </div>
                  <div className="flex flex-1">
                    {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
                      <div key={w} className={`flex-1 py-1.5 border-l border-white/10 ${w === currentWeek ? "bg-yellow-400/30" : ""}`} />
                    ))}
                  </div>
                </div>
                {/* タスク行 */}
                {catTasks.map((task) => {
                  const periodsLabel = task.periods?.map((p) => `W${p.startWeek}〜${p.endWeek}`).join(" / ") ?? "";
                  return (
                    <div key={task.id} className="flex border-b border-gray-100 hover:bg-gray-50">
                      {/* 左：タスク情報 */}
                      <div className="w-52 shrink-0 px-2 pt-1.5 pb-2 border-r border-gray-100">
                        {/* ツールバー */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex gap-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); moveTask(task.id, "up", category); }}
                              className="text-gray-300 hover:text-gray-700 active:text-gray-700 text-[11px] px-1 py-0.5 rounded hover:bg-gray-100"
                            >▲</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveTask(task.id, "down", category); }}
                              className="text-gray-300 hover:text-gray-700 active:text-gray-700 text-[11px] px-1 py-0.5 rounded hover:bg-gray-100"
                            >▼</button>
                          </div>
                          <div className="flex gap-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(task); }}
                              className="text-blue-400 hover:text-blue-600 active:text-blue-600 text-[11px] px-1 py-0.5 rounded hover:bg-blue-50"
                            >✏</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowDelete(task.id); }}
                              className="text-red-300 hover:text-red-500 active:text-red-500 text-[11px] px-1 py-0.5 rounded hover:bg-red-50"
                            >✕</button>
                          </div>
                        </div>
                        {/* 優先度・カテゴリ */}
                        <div className="flex items-center gap-1 flex-wrap mb-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${cc.light}`}>{task.category}</span>
                        </div>
                        {/* タスク名 */}
                        <p className="text-[11px] text-gray-800 font-medium leading-tight line-clamp-2 mb-0.5">{task.taskName}</p>
                        {/* 具体的取り組み */}
                        {task.specificApproach && (
                          <p className="text-[9px] text-gray-500 leading-tight line-clamp-2 mb-0.5">{task.specificApproach}</p>
                        )}
                        {/* 期限・期間 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {task.deadline && <p className="text-[9px] text-blue-500 font-medium">{task.deadline}</p>}
                          {periodsLabel && <p className="text-[9px] text-gray-400">{periodsLabel}</p>}
                        </div>
                      </div>
                      {/* 右：ガントバー */}
                      <div className="flex flex-1">
                        {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => {
                          const inAnyPeriod = task.periods?.some((p) => w >= p.startWeek && w <= p.endWeek);
                          const isStart = task.periods?.some((p) => w === p.startWeek);
                          const isEnd = task.periods?.some((p) => w === p.endWeek);
                          return (
                            <div key={w} className={`flex-1 border-l border-gray-50 flex items-center py-2 ${w === currentWeek ? "bg-yellow-50" : ""}`}>
                              {inAnyPeriod && (
                                <div className={`w-full h-4 ${cc.bar} opacity-80 ${isStart ? "rounded-l-full ml-0.5" : ""} ${isEnd ? "rounded-r-full mr-0.5" : ""}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* カテゴリ編集モーダル */}
      {showCatEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowCatEditor(false)}>
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">カテゴリを編集・並び替え</h3>
              <button onClick={() => setShowCatEditor(false)} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="p-4 space-y-2">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveCategory(cat, "up")} className="text-gray-400 hover:text-gray-700 active:text-gray-700 text-[11px] leading-none px-1">▲</button>
                    <button onClick={() => moveCategory(cat, "down")} className="text-gray-400 hover:text-gray-700 active:text-gray-700 text-[11px] leading-none px-1">▼</button>
                  </div>
                  <span className="flex-1 text-sm text-gray-800">{cat}</span>
                  <button onClick={() => deleteCategory(cat)} className="text-red-400 text-xs px-2 py-1 rounded-lg hover:bg-red-50 active:bg-red-50">削除</button>
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

              {/* 期間（複数設定可） */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    期間　<span className="text-xs text-gray-400 font-normal">W1=4月第1週 〜 W48=3月第4週</span>
                  </label>
                  <button onClick={addPeriod} className="text-xs text-purple-600 font-medium px-2 py-1 bg-purple-50 rounded-lg active:bg-purple-100">＋ 追加</button>
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
                        <button onClick={() => removePeriod(idx)} className="text-red-300 text-sm px-1 shrink-0 active:text-red-500">✕</button>
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
