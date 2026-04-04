"use client";

import { useEffect, useState } from "react";
import {
  loadImprovements,
  addImprovement,
  updateImprovement,
  deleteImprovement,
} from "@/lib/dashboard-storage";
import { ImprovementItem, ImprovementStatus } from "@/types";

const STATUS_OPTIONS: ImprovementStatus[] = ["未着手", "進行中", "完了"];
const STATUS_COLORS: Record<ImprovementStatus, string> = {
  "未着手": "bg-gray-100 text-gray-600",
  "進行中": "bg-blue-100 text-blue-700",
  "完了": "bg-green-100 text-green-700",
};

const EMPTY_FORM = {
  proposalDate: "",
  problem: "",
  improvementContent: "",
  action: "",
  expectedEffect: "",
  person: "",
  deadline: "",
  status: "未着手" as ImprovementStatus,
  effectConfirmation: "",
};

function getWeekLabel(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const week = Math.ceil(now.getDate() / 7);
  return `${month}月 W${week}`;
}

export default function ImprovementsPage() {
  const [items, setItems] = useState<ImprovementItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ImprovementItem | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, proposalDate: getWeekLabel() });
  const [filterStatus, setFilterStatus] = useState<ImprovementStatus | "すべて">("すべて");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setItems(loadImprovements());
  }, []);

  function reload() {
    setItems(loadImprovements());
  }

  function handleAdd() {
    addImprovement(form);
    reload();
    setForm({ ...EMPTY_FORM, proposalDate: getWeekLabel() });
    setShowForm(false);
  }

  function handleStatusChange(item: ImprovementItem, status: ImprovementStatus) {
    updateImprovement({ ...item, status });
    reload();
    if (selectedItem?.id === item.id) setSelectedItem({ ...item, status });
  }

  function handleDelete(id: string) {
    deleteImprovement(id);
    reload();
    setSelectedItem(null);
    setShowDeleteConfirm(false);
  }

  function handleUpdateConfirmation(item: ImprovementItem, text: string) {
    const updated = { ...item, effectConfirmation: text };
    updateImprovement(updated);
    reload();
    setSelectedItem(updated);
  }

  const filtered = filterStatus === "すべて"
    ? items
    : items.filter((i) => i.status === filterStatus);

  const stats = {
    total: items.length,
    inProgress: items.filter((i) => i.status === "進行中").length,
    done: items.filter((i) => i.status === "完了").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-yellow-600 text-white px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">💡 改善管理台帳</h1>
            <p className="text-sm text-yellow-100 mt-0.5">
              2026期年度 ★週次改善 年間50件目標★
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-yellow-700 font-bold px-4 py-2 rounded-xl text-sm active:bg-yellow-50"
          >
            ＋ 追加
          </button>
        </div>
      </header>

      {/* 進捗バー */}
      <div className="bg-yellow-600 pb-4 px-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-yellow-100">年間目標 50件達成率</span>
          <span className="text-xs text-white font-bold">{stats.total} / 50件</span>
        </div>
        <div className="bg-yellow-800/40 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{ width: `${Math.min((stats.total / 50) * 100, 100)}%` }}
          />
        </div>
        <div className="flex gap-4 mt-2 text-xs text-yellow-100">
          <span>進行中 {stats.inProgress}</span>
          <span>完了 {stats.done}</span>
          <span>全{stats.total}件</span>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-2 px-4 py-2 min-w-max">
          {(["すべて", "未着手", "進行中", "完了"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                filterStatus === s ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {s}
              {s !== "すべて" && ` (${items.filter((i) => i.status === s).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* リスト */}
      <main className="px-4 py-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-gray-400">改善案を追加してください</p>
          </div>
        )}
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:bg-gray-50"
            onClick={() => setSelectedItem(item)}
          >
            <div className="flex items-start gap-2">
              <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                No.{item.no}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">{item.proposalDate}</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{item.improvementContent}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{item.problem}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[item.status]}`}>
                  {item.status}
                </span>
                <span className="text-xs text-gray-400">{item.deadline}</span>
              </div>
            </div>
            {item.person && (
              <p className="text-xs text-gray-400 mt-2">担当: {item.person}</p>
            )}
          </div>
        ))}
      </main>

      {/* 追加フォーム */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">💡 改善案を追加</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="p-4 space-y-3">
              <FormField label="提案日（月/週）">
                <input
                  value={form.proposalDate}
                  onChange={(e) => setForm({ ...form, proposalDate: e.target.value })}
                  className={inputCls}
                  placeholder="例: 4月 W1"
                />
              </FormField>
              <FormField label="問題・課題" required>
                <input
                  value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  className={inputCls}
                  placeholder="例: フィルムの価格高騰"
                />
              </FormField>
              <FormField label="改善内容" required>
                <input
                  value={form.improvementContent}
                  onChange={(e) => setForm({ ...form, improvementContent: e.target.value })}
                  className={inputCls}
                  placeholder="例: 切り替え枚数削減"
                />
              </FormField>
              <FormField label="アクション">
                <textarea
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                  className={inputCls}
                  rows={3}
                  placeholder="具体的な取り組み内容"
                />
              </FormField>
              <FormField label="期待効果">
                <input
                  value={form.expectedEffect}
                  onChange={(e) => setForm({ ...form, expectedEffect: e.target.value })}
                  className={inputCls}
                  placeholder="例: フィルムコスト削減"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="担当者">
                  <input
                    value={form.person}
                    onChange={(e) => setForm({ ...form, person: e.target.value })}
                    className={inputCls}
                    placeholder="例: 西本"
                  />
                </FormField>
                <FormField label="期限">
                  <input
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className={inputCls}
                    placeholder="例: 4月末"
                  />
                </FormField>
              </div>
              <FormField label="状態">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ImprovementStatus })}
                  className={inputCls}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
              <button
                onClick={handleAdd}
                disabled={!form.problem || !form.improvementContent}
                className="w-full bg-yellow-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-base"
              >
                追加する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => { setSelectedItem(null); setShowDeleteConfirm(false); }}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">No.{selectedItem.no} 改善詳細</h3>
              <button onClick={() => { setSelectedItem(null); setShowDeleteConfirm(false); }} className="text-gray-400 text-xl p-1">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">{selectedItem.proposalDate}</span>
                <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedItem.status]}`}>
                  {selectedItem.status}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">問題・課題</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{selectedItem.problem}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">改善内容</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{selectedItem.improvementContent}</p>
              </div>

              {selectedItem.action && (
                <div>
                  <p className="text-xs text-gray-400 font-medium">アクション</p>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{selectedItem.action}</p>
                </div>
              )}

              {selectedItem.expectedEffect && (
                <div>
                  <p className="text-xs text-gray-400 font-medium">期待効果</p>
                  <p className="text-sm text-blue-700 mt-1">{selectedItem.expectedEffect}</p>
                </div>
              )}

              <div className="flex gap-4 text-sm">
                {selectedItem.person && (
                  <div>
                    <p className="text-xs text-gray-400">担当</p>
                    <p className="font-medium">{selectedItem.person}</p>
                  </div>
                )}
                {selectedItem.deadline && (
                  <div>
                    <p className="text-xs text-gray-400">期限</p>
                    <p className="font-medium">{selectedItem.deadline}</p>
                  </div>
                )}
              </div>

              {/* ステータス変更 */}
              <div>
                <p className="text-xs text-gray-400 mb-2">ステータス変更</p>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedItem, s)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium ${
                        selectedItem.status === s
                          ? STATUS_COLORS[s] + " ring-2 ring-offset-1 ring-yellow-400"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* 効果確認 */}
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">効果確認・コメント</p>
                <textarea
                  value={selectedItem.effectConfirmation}
                  onChange={(e) => handleUpdateConfirmation(selectedItem, e.target.value)}
                  placeholder="実施後の効果や確認結果を入力..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* 削除 */}
              <div className="pb-2">
                {showDeleteConfirm ? (
                  <div className="bg-red-50 rounded-xl p-3 space-y-2">
                    <p className="text-sm text-red-700 font-medium">この改善案を削除しますか？</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(selectedItem.id)}
                        className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-medium"
                      >
                        削除する
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full text-red-400 text-sm py-2 rounded-xl border border-red-200"
                  >
                    この改善案を削除
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400";

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
