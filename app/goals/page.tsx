"use client";

import { useEffect, useState } from "react";
import { loadGoals, addGoal, updateGoal, deleteGoal, loadCategories, saveCategories } from "@/lib/dashboard-storage";
import { Goal, GoalStatus, Priority } from "@/types";

const STATUS_LABELS: Record<GoalStatus, string> = { not_started: "未着手", in_progress: "進行中", completed: "完了" };
const STATUS_COLORS: Record<GoalStatus, string> = { not_started: "bg-gray-100 text-gray-600", in_progress: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700" };
const PRIORITY_COLORS: Record<Priority, string> = { "◎": "bg-red-100 text-red-600", "○": "bg-yellow-100 text-yellow-700", "△": "bg-gray-100 text-gray-500" };

const EMPTY_GOAL = { priority: "○" as Priority, category: "製造管理", objective: "", specificActions: "", kpi: "", deadline: "", resultComment: "", status: "not_started" as GoalStatus };

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filter, setFilter] = useState("すべて");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState({ ...EMPTY_GOAL });
  const [showDelete, setShowDelete] = useState(false);
  const [showCatEditor, setShowCatEditor] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  function reload() {
    setGoals(loadGoals());
    const cats = loadCategories();
    setCategories(cats);
  }
  useEffect(() => { reload(); }, []);

  function openAdd() {
    setForm({ ...EMPTY_GOAL, category: categories[0] ?? "その他" });
    setEditingGoal(null);
    setShowForm(true);
  }
  function openEdit(goal: Goal) { setForm({ ...goal }); setEditingGoal(goal); setShowForm(true); setSelectedGoal(null); }

  function handleSave() {
    if (!form.objective.trim()) return;
    if (editingGoal) {
      updateGoal({ ...editingGoal, ...form });
    } else {
      addGoal({ no: 0, ...form });
    }
    reload();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    deleteGoal(id);
    reload();
    setSelectedGoal(null);
    setShowDelete(false);
  }

  function cycleStatus(goal: Goal) {
    const order: GoalStatus[] = ["not_started", "in_progress", "completed"];
    const next = order[(order.indexOf(goal.status) + 1) % order.length];
    const updated = { ...goal, status: next };
    updateGoal(updated);
    reload();
    if (selectedGoal?.id === goal.id) setSelectedGoal(updated);
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
    if (filter === cat) setFilter("すべて");
  }

  const allCategories = ["すべて", ...categories];
  const filtered = goals.filter((g) => filter === "すべて" || g.category === filter);
  const stats = { total: goals.length, done: goals.filter((g) => g.status === "completed").length, inProgress: goals.filter((g) => g.status === "in_progress").length };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-blue-700 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🎯 2026年度 目標管理</h1>
            <div className="flex gap-4 mt-1 text-sm">
              <span>全{stats.total}件</span>
              <span className="text-blue-200">進行中 {stats.inProgress}</span>
              <span className="text-green-300">完了 {stats.done}</span>
            </div>
          </div>
          <button onClick={openAdd} className="bg-white text-blue-700 font-bold px-4 py-2 rounded-xl text-sm active:bg-blue-50">＋ 追加</button>
        </div>
        <div className="mt-2 bg-blue-900/40 rounded-full h-1.5">
          <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${stats.total ? (stats.done / stats.total) * 100 : 0}%` }} />
        </div>
        <p className="text-[10px] text-blue-300 text-right mt-0.5">達成率 {stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%</p>
      </header>

      <div className="overflow-x-auto bg-white border-b border-gray-200">
        <div className="flex gap-1 px-3 py-2 min-w-max items-center">
          {allCategories.map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filter === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
              {cat}
            </button>
          ))}
          <button onClick={() => setShowCatEditor(true)}
            className="ml-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 whitespace-nowrap">
            ✏️ 編集
          </button>
        </div>
      </div>

      <main className="px-4 py-4 space-y-3">
        {filtered.map((goal) => (
          <div key={goal.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:bg-gray-50" onClick={() => setSelectedGoal(goal)}>
            <div className="p-4">
              <div className="flex items-start gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLORS[goal.priority]}`}>{goal.priority}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">No.{goal.no}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{goal.category}</span>
                  </div>
                  <p className="font-bold text-gray-900 mt-1">{goal.objective}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); cycleStatus(goal); }}
                  className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[goal.status]}`}>
                  {STATUS_LABELS[goal.status]}
                </button>
              </div>
              {goal.kpi && <p className="text-xs text-gray-500 mt-2">KPI: {goal.kpi}</p>}
              {goal.deadline && <p className="text-xs text-gray-400 mt-0.5">期限: {goal.deadline}</p>}
            </div>
          </div>
        ))}
      </main>

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
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                <button onClick={addCategory}
                  className={`font-bold px-4 py-2.5 rounded-xl text-sm ${newCatName.trim() ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}>追加</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => { setSelectedGoal(null); setShowDelete(false); }}>
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">目標詳細</h3>
              <div className="flex gap-2">
                <button onClick={() => openEdit(selectedGoal)} className="text-blue-500 text-sm px-3 py-1 bg-blue-50 rounded-lg">編集</button>
                <button onClick={() => { setSelectedGoal(null); setShowDelete(false); }} className="text-gray-400 text-xl p-1">✕</button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${PRIORITY_COLORS[selectedGoal.priority]}`}>優先 {selectedGoal.priority}</span>
                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{selectedGoal.category}</span>
                <button onClick={() => cycleStatus(selectedGoal)} className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[selectedGoal.status]}`}>
                  {STATUS_LABELS[selectedGoal.status]}
                </button>
              </div>
              <div>
                <p className="text-xs text-gray-400">目標・施策</p>
                <p className="text-base font-bold text-gray-900 mt-1">{selectedGoal.objective}</p>
              </div>
              {selectedGoal.specificActions && (
                <div>
                  <p className="text-xs text-gray-400">具体的アクション</p>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{selectedGoal.specificActions}</p>
                </div>
              )}
              {selectedGoal.kpi && <div><p className="text-xs text-gray-400">KPI・指標</p><p className="text-sm font-medium text-blue-700 mt-1">{selectedGoal.kpi}</p></div>}
              {selectedGoal.deadline && <div><p className="text-xs text-gray-400">期限</p><p className="text-sm font-medium text-gray-800 mt-1">{selectedGoal.deadline}</p></div>}
              <div>
                <p className="text-xs text-gray-400 mb-1">結果・コメント</p>
                <textarea value={selectedGoal.resultComment}
                  onChange={(e) => { const u = { ...selectedGoal, resultComment: e.target.value }; updateGoal(u); reload(); setSelectedGoal(u); }}
                  placeholder="結果やコメントを入力..." rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="pb-2">
                {showDelete ? (
                  <div className="bg-red-50 rounded-xl p-3 space-y-2">
                    <p className="text-sm text-red-700 font-medium">この目標を削除しますか？</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(selectedGoal.id)} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium">削除する</button>
                      <button onClick={() => setShowDelete(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium">キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowDelete(true)} className="w-full text-red-400 text-sm py-2 rounded-xl border border-red-200">この目標を削除</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 追加・編集フォーム */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editingGoal ? "目標を編集" : "目標を追加"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="p-4 space-y-3 pb-10">
              <div className="grid grid-cols-2 gap-3">
                <F label="優先度">
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={ic}>
                    <option value="◎">◎ 最優先</option><option value="○">○ 通常</option><option value="△">△ 低</option>
                  </select>
                </F>
                <F label="ステータス">
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GoalStatus })} className={ic}>
                    <option value="not_started">未着手</option><option value="in_progress">進行中</option><option value="completed">完了</option>
                  </select>
                </F>
              </div>
              <F label="カテゴリ">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={ic}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </F>
              <F label="目標・施策" required>
                <input value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="例: 業務フロー完全習得" className={ic} />
              </F>
              <F label="具体的アクション">
                <textarea value={form.specificActions} onChange={(e) => setForm({ ...form, specificActions: e.target.value })} rows={3} placeholder="具体的な取り組み内容" className={ic} />
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="KPI・指標"><input value={form.kpi} onChange={(e) => setForm({ ...form, kpi: e.target.value })} placeholder="例: 独立対応率100%" className={ic} /></F>
                <F label="期限"><input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="例: 7月末" className={ic} /></F>
              </div>
              <button onClick={handleSave}
                className={`w-full font-bold py-4 rounded-2xl text-white ${form.objective.trim() ? "bg-blue-600 active:bg-blue-700" : "bg-gray-300"}`}>
                {editingGoal ? "更新する" : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ic = "w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400";
function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
    </div>
  );
}
