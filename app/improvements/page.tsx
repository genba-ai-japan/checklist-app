"use client";

import { useEffect, useState } from "react";
import { loadImprovements, addImprovement, updateImprovement, deleteImprovement } from "@/lib/dashboard-storage";
import { ImprovementItem, ImprovementStatus } from "@/types";

const STATUS_OPTIONS: ImprovementStatus[] = ["未着手", "進行中", "完了"];
const STATUS_COLORS: Record<ImprovementStatus, string> = {
  "未着手": "bg-gray-100 text-gray-600",
  "進行中": "bg-blue-100 text-blue-700",
  "完了": "bg-green-100 text-green-700",
};

const EMPTY_FORM = {
  proposalDate: "", problem: "", improvementContent: "", action: "",
  expectedEffect: "", person: "", deadline: "", status: "未着手" as ImprovementStatus, effectConfirmation: "",
};

function getWeekLabel() {
  const n = new Date();
  return `${n.getMonth() + 1}月 W${Math.ceil(n.getDate() / 7)}`;
}

export default function ImprovementsPage() {
  const [items, setItems] = useState<ImprovementItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ImprovementItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<ImprovementItem | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, proposalDate: getWeekLabel() });
  const [filterStatus, setFilterStatus] = useState<ImprovementStatus | "すべて">("すべて");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function reload() { setItems(loadImprovements()); }
  useEffect(() => { reload(); }, []);

  function openAdd() {
    setForm({ ...EMPTY_FORM, proposalDate: getWeekLabel() });
    setEditingItem(null);
    setShowForm(true);
  }

  function openEdit(item: ImprovementItem) {
    setForm({
      proposalDate: item.proposalDate, problem: item.problem, improvementContent: item.improvementContent,
      action: item.action, expectedEffect: item.expectedEffect, person: item.person,
      deadline: item.deadline, status: item.status, effectConfirmation: item.effectConfirmation,
    });
    setEditingItem(item);
    setSelectedItem(null);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.problem || !form.improvementContent) return;
    if (editingItem) {
      updateImprovement({ ...editingItem, ...form });
    } else {
      addImprovement(form);
    }
    reload();
    setShowForm(false);
  }

  function handleDelete(id: string) {
    deleteImprovement(id);
    reload();
    setSelectedItem(null);
    setShowDeleteConfirm(false);
  }

  function handleStatusChange(item: ImprovementItem, status: ImprovementStatus) {
    const updated = { ...item, status };
    updateImprovement(updated);
    reload();
    if (selectedItem?.id === item.id) setSelectedItem(updated);
  }

  function handleUpdateConfirmation(item: ImprovementItem, text: string) {
    const updated = { ...item, effectConfirmation: text };
    updateImprovement(updated);
    reload();
    setSelectedItem(updated);
  }

  const filtered = filterStatus === "すべて" ? items : items.filter((i) => i.status === filterStatus);
  const stats = { total: items.length, inProgress: items.filter((i) => i.status === "進行中").length, done: items.filter((i) => i.status === "完了").length };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-yellow-600 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">💡 改善管理台帳</h1>
            <p className="text-sm text-yellow-100 mt-0.5">2026年度 ★週次改善 年間50件目標★</p>
          </div>
          <button onClick={openAdd} className="bg-white text-yellow-700 font-bold px-4 py-2 rounded-xl text-sm active:bg-yellow-50">＋ 追加</button>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-yellow-100">年間目標 50件達成率</span>
            <span className="text-xs text-white font-bold">{stats.total} / 50件</span>
          </div>
          <div className="bg-yellow-800/40 rounded-full h-2">
            <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${Math.min((stats.total / 50) * 100, 100)}%` }} />
          </div>
          <div className="flex gap-4 mt-1.5 text-xs text-yellow-100">
            <span>進行中 {stats.inProgress}</span><span>完了 {stats.done}</span><span>全{stats.total}件</span>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2 px-4 py-2 min-w-max">
          {(["すべて", "未着手", "進行中", "完了"] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterStatus === s ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-600"}`}>
              {s}{s !== "すべて" && ` (${items.filter((i) => i.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 py-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12"><p className="text-4xl mb-2">📋</p><p className="text-gray-400">改善案を追加してください</p></div>
        )}
        {filtered.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:bg-gray-50" onClick={() => setSelectedItem(item)}>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5">No.{item.no}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{item.proposalDate}</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{item.improvementContent}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{item.problem}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                <span className="text-xs text-gray-400">{item.deadline}</span>
              </div>
            </div>
            {item.person && <p className="text-xs text-gray-400 mt-2">担当: {item.person}</p>}
          </div>
        ))}
      </main>

      {/* 詳細モーダル */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => { setSelectedItem(null); setShowDeleteConfirm(false); }}>
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">No.{selectedItem.no} 改善詳細</h3>
              <div className="flex gap-2">
                <button onClick={() => openEdit(selectedItem)} className="text-blue-500 text-sm px-3 py-1 bg-blue-50 rounded-lg">編集</button>
                <button onClick={() => { setSelectedItem(null); setShowDeleteConfirm(false); }} className="text-gray-400 text-xl p-1">✕</button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">{selectedItem.proposalDate}</span>
                <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedItem.status]}`}>{selectedItem.status}</span>
              </div>
              <InfoRow label="問題・課題" value={selectedItem.problem} bold />
              <InfoRow label="改善内容" value={selectedItem.improvementContent} />
              {selectedItem.action && <InfoRow label="アクション" value={selectedItem.action} pre />}
              {selectedItem.expectedEffect && <InfoRow label="期待効果" value={selectedItem.expectedEffect} blue />}
              <div className="flex gap-4 text-sm">
                {selectedItem.person && <div><p className="text-xs text-gray-400">担当</p><p className="font-medium">{selectedItem.person}</p></div>}
                {selectedItem.deadline && <div><p className="text-xs text-gray-400">期限</p><p className="font-medium">{selectedItem.deadline}</p></div>}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">ステータス変更</p>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s} onClick={() => handleStatusChange(selectedItem, s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium ${selectedItem.status === s ? STATUS_COLORS[s] + " ring-2 ring-yellow-400 ring-offset-1" : "bg-gray-100 text-gray-500"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">効果確認・コメント</p>
                <textarea value={selectedItem.effectConfirmation}
                  onChange={(e) => handleUpdateConfirmation(selectedItem, e.target.value)}
                  placeholder="実施後の効果や確認結果を入力..." rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
              </div>
              <div className="pb-2">
                {showDeleteConfirm ? (
                  <div className="bg-red-50 rounded-xl p-3 space-y-2">
                    <p className="text-sm text-red-700 font-medium">この改善案を削除しますか？</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(selectedItem.id)} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium">削除する</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium">キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-red-400 text-sm py-2 rounded-xl border border-red-200">この改善案を削除</button>
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
              <h3 className="font-bold text-gray-900">💡 {editingItem ? "改善案を編集" : "改善案を追加"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <F label="提案日（月/週）"><input value={form.proposalDate} onChange={(e) => setForm({ ...form, proposalDate: e.target.value })} className={ic} placeholder="例: 4月 W1" /></F>
              <F label="問題・課題" required><input value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} className={ic} placeholder="例: フィルムの価格高騰" /></F>
              <F label="改善内容" required><input value={form.improvementContent} onChange={(e) => setForm({ ...form, improvementContent: e.target.value })} className={ic} placeholder="例: 切り替え枚数削減" /></F>
              <F label="アクション"><textarea value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className={ic} rows={3} placeholder="具体的な取り組み内容" /></F>
              <F label="期待効果"><input value={form.expectedEffect} onChange={(e) => setForm({ ...form, expectedEffect: e.target.value })} className={ic} placeholder="例: フィルムコスト削減" /></F>
              <div className="grid grid-cols-2 gap-3">
                <F label="担当者"><input value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })} className={ic} placeholder="例: 西本" /></F>
                <F label="期限"><input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={ic} placeholder="例: 4月末" /></F>
              </div>
              <F label="状態">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ImprovementStatus })} className={ic}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
              {editingItem && (
                <F label="効果確認・コメント">
                  <textarea value={form.effectConfirmation} onChange={(e) => setForm({ ...form, effectConfirmation: e.target.value })} className={ic} rows={2} placeholder="効果の確認結果" />
                </F>
              )}
              <button onClick={handleSave} disabled={!form.problem || !form.improvementContent}
                className="w-full bg-yellow-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-base">
                {editingItem ? "更新する" : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ic = "w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400";
function F({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
    </div>
  );
}
function InfoRow({ label, value, bold, blue, pre }: { label: string; value: string; bold?: boolean; blue?: boolean; pre?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className={`text-sm mt-1 ${bold ? "font-bold text-gray-900" : blue ? "text-blue-700" : "text-gray-700"} ${pre ? "whitespace-pre-wrap" : ""}`}>{value}</p>
    </div>
  );
}
