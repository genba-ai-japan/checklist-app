"use client";

import { useEffect, useState } from "react";
import { loadRoutine, saveRoutine, toggleRoutineCheck, addRoutineItem, updateRoutineItem, deleteRoutineItem } from "@/lib/dashboard-storage";
import { exportRoutine, importRoutine } from "@/lib/export-import";
import ExportImportBar from "@/components/ExportImportBar";
import { RoutineItem } from "@/types";

const FREQ_OPTIONS = ["毎日 午前", "毎日 午後", "1週目", "2週目", "3週目", "4週目", "毎週", "毎月"];
const FREQ_COLORS: Record<string, string> = {
  "毎日 午前": "text-orange-600 bg-orange-50",
  "毎日 午後": "text-orange-500 bg-orange-50",
  "1週目": "text-blue-600 bg-blue-50",
  "2週目": "text-blue-600 bg-blue-50",
  "3週目": "text-blue-600 bg-blue-50",
  "4週目": "text-blue-600 bg-blue-50",
  "毎週": "text-lime-700 bg-lime-50",
  "毎月": "text-purple-600 bg-purple-50",
};

function getTodayStr() { return new Date().toISOString().slice(0, 10); }
function getMonthStr() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; }
function getISOWeek() {
  const n = new Date();
  const d = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d.getTime() - y.getTime()) / 86400000) + 1) / 7)).padStart(2,"0")}`;
}
function getWeekOfMonth() { return Math.ceil(new Date().getDate() / 7); }
function getMonthWeekKey(freq: string) {
  const m = getMonthStr();
  if (freq === "毎日 午前" || freq === "毎日 午後") return getTodayStr();
  if (freq === "毎週") return getISOWeek();
  if (freq === "毎月") return getMonthStr();
  const w = freq.replace("週目", "");
  return `${m}-W${w}`;
}

const EMPTY_FORM = { frequency: "毎日 午前", task: "", requiredTime: "", comment: "" };

export default function RoutinePage() {
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showDelete, setShowDelete] = useState<string | null>(null);

  function reload() { setItems(loadRoutine()); }
  useEffect(() => { reload(); }, []);

  const month = new Date().toLocaleDateString("ja-JP", { month: "long" });
  const currentWeek = getWeekOfMonth();
  const today = getTodayStr();

  function handleToggle(item: RoutineItem) {
    const key = getMonthWeekKey(item.frequency);
    toggleRoutineCheck(item.id, key);
    reload();
  }

  function isChecked(item: RoutineItem): boolean {
    return item.checkedDates.includes(getMonthWeekKey(item.frequency));
  }

  function openAdd() { setForm({ ...EMPTY_FORM }); setEditingItem(null); setShowForm(true); }
  function openEdit(item: RoutineItem) { setForm({ frequency: item.frequency, task: item.task, requiredTime: item.requiredTime, comment: item.comment }); setEditingItem(item); setShowForm(true); }

  function handleSave() {
    if (!form.task.trim()) return;
    if (editingItem) {
      updateRoutineItem({ ...editingItem, ...form });
    } else {
      addRoutineItem(form);
    }
    reload();
    setShowForm(false);
  }

  function handleDelete(id: string) { deleteRoutineItem(id); reload(); setShowDelete(null); }

  const grouped = FREQ_OPTIONS.reduce<Record<string, RoutineItem[]>>((acc, freq) => {
    const g = items.filter((i) => i.frequency === freq);
    if (g.length > 0) acc[freq] = g;
    return acc;
  }, {});

  const totalMonthItems = items.length;
  const doneItems = items.filter((i) => isChecked(i)).length;

  function isCurrentPeriod(freq: string): boolean {
    if (freq === "毎日 午前" || freq === "毎日 午後") return true;
    if (freq === "毎週" || freq === "毎月") return true;
    const w = parseInt(freq.replace("週目", ""));
    return w === currentWeek;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-lime-600 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">✅ {month}のルーティン</h1>
            <p className="text-sm text-lime-200 mt-0.5">
              {new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })} · {currentWeek}週目
            </p>
          </div>
          <button onClick={openAdd} className="bg-white text-lime-700 font-bold px-3 py-2 rounded-xl text-sm">＋ 追加</button>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-lime-200">今月の完了状況</span>
            <span className="text-xs text-white font-bold">{doneItems} / {totalMonthItems}</span>
          </div>
          <div className="bg-lime-900/40 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${totalMonthItems ? (doneItems / totalMonthItems) * 100 : 0}%` }} />
          </div>
        </div>
      </header>
      <ExportImportBar onExport={exportRoutine} onImport={importRoutine} onImported={reload} />

      <main className="px-4 py-4 space-y-4">
        {Object.entries(grouped).map(([freq, freqItems]) => {
          const isCurrent = isCurrentPeriod(freq);
          const freqLabel = freq === "毎日 午前" ? `毎日 午前（今日: ${new Date().toLocaleDateString("ja-JP",{month:"numeric",day:"numeric"})}）`
            : freq === "毎日 午後" ? `毎日 午後（今日）`
            : freq === "毎週" ? `毎週（今週: ${getISOWeek()}）`
            : freq === "毎月" ? `毎月（${getMonthStr()}）`
            : `${freq}（${currentWeek === parseInt(freq.replace("週目","")) ? "今週！" : `${freq}`}）`;

          return (
            <section key={freq} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isCurrent ? "border-lime-300" : "border-gray-100"}`}>
              <div className={`px-4 py-2.5 border-b flex items-center justify-between ${isCurrent ? "border-lime-200 bg-lime-50" : "border-gray-100"}`}>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${FREQ_COLORS[freq] || "text-gray-600 bg-gray-100"}`}>{freq}</span>
                {isCurrent && <span className="text-xs text-lime-600 font-medium">今月対象</span>}
              </div>
              <div className="divide-y divide-gray-50">
                {freqItems.map((item) => {
                  const checked = isChecked(item);
                  return (
                    <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all ${checked ? "bg-lime-500 border-lime-500" : "border-gray-300"}`}
                        onClick={() => handleToggle(item)}>
                        {checked && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => handleToggle(item)}>
                        <p className={`text-sm font-medium ${checked ? "line-through text-gray-400" : "text-gray-800"}`}>{item.task}</p>
                        <p className="text-xs text-gray-400 mt-0.5">所要時間: {item.requiredTime}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {checked && <span className="text-xs text-lime-600 font-medium">完了</span>}
                        <button onClick={() => openEdit(item)} className="text-gray-400 text-sm px-1">✏️</button>
                        <button onClick={() => setShowDelete(item.id)} className="text-gray-300 text-sm px-1">🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

      </main>

      {/* 削除確認 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-3">
            <p className="font-bold text-gray-900">このルーティンを削除しますか？</p>
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
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editingItem ? "ルーティンを編集" : "ルーティンを追加"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="p-4 space-y-3 pb-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">頻度・タイミング</label>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className={ic}>
                  {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">業務項目 <span className="text-red-500">*</span></label>
                <input value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} placeholder="例: 充填お申し出MTG" className={ic} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所要時間</label>
                <input value={form.requiredTime} onChange={(e) => setForm({ ...form, requiredTime: e.target.value })} placeholder="例: 1時間" className={ic} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">コメント</label>
                <input value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="メモ" className={ic} />
              </div>
              <button onClick={handleSave}
                className={`w-full font-bold py-4 rounded-2xl text-white ${form.task.trim() ? "bg-lime-600 active:bg-lime-700" : "bg-gray-300"}`}>
                {editingItem ? "更新する" : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ic = "w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lime-400";
