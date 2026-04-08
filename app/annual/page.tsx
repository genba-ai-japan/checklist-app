"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAnnualTasks,
  addAnnualTask,
  deleteAnnualTask,
  updateAnnualTask,
} from "@/lib/storage";
import type { AnnualTask } from "@/types";

const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export default function AnnualPage() {
  const [tasks, setTasks] = useState<AnnualTask[]>([]);
  const [text, setText] = useState("");
  const [month, setMonth] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editMonth, setEditMonth] = useState<string>("");

  const load = () => setTasks(getAnnualTasks());
  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    const t = text.trim();
    if (!t) return;
    addAnnualTask(t, month ? Number(month) : undefined);
    setText("");
    setMonth("");
    load();
  };

  const startEdit = (task: AnnualTask) => {
    setEditId(task.id);
    setEditText(task.text);
    setEditMonth(task.month ? String(task.month) : "");
  };

  const handleEdit = (id: string) => {
    const t = editText.trim();
    if (t) updateAnnualTask(id, t, editMonth ? Number(editMonth) : undefined);
    setEditId(null);
    load();
  };

  // グループ化 (月別)
  const grouped: { label: string; items: AnnualTask[] }[] = [];
  const monthMap = new Map<string, AnnualTask[]>();

  tasks.forEach((t) => {
    const key = t.month ? String(t.month) : "未定";
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(t);
  });

  // 月順
  for (let m = 1; m <= 12; m++) {
    const items = monthMap.get(String(m));
    if (items) grouped.push({ label: `${m}月`, items });
  }
  const undated = monthMap.get("未定");
  if (undated) grouped.push({ label: "月未定", items: undated });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-green-500 text-lg p-1">‹</Link>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">📅 毎年やること</h1>
            <p className="text-xs text-gray-400">年間の定番タスク管理</p>
          </div>
          <span className="text-sm text-gray-400">{tasks.length}件</span>
        </div>
      </header>

      {/* 入力欄 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 space-y-2">
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-24 px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">月未定</option>
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="毎年やることを追加..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="w-full py-3 bg-green-500 text-white font-bold rounded-xl disabled:opacity-40 active:bg-green-700"
        >
          追加
        </button>
      </div>

      {/* タスク一覧（月別グループ） */}
      <main className="px-4 py-3 pb-16 space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">📅</p>
            <p>毎年やることを追加しましょう</p>
          </div>
        ) : (
          grouped.map((g) => (
            <section key={g.label}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-green-600">{g.label}</span>
                <div className="flex-1 h-px bg-green-100" />
              </div>
              <div className="space-y-2">
                {g.items.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3"
                  >
                    <span className="text-green-400 text-lg">🔁</span>

                    {editId === t.id ? (
                      <div className="flex-1 space-y-1">
                        <select
                          value={editMonth}
                          onChange={(e) => setEditMonth(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm bg-gray-50"
                        >
                          <option value="">月未定</option>
                          {MONTHS.map((m, i) => (
                            <option key={i + 1} value={i + 1}>{m}</option>
                          ))}
                        </select>
                        <input
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleEdit(t.id)}
                          onBlur={() => handleEdit(t.id)}
                          className="w-full border-b border-green-400 focus:outline-none bg-transparent text-gray-900"
                        />
                      </div>
                    ) : (
                      <span className="flex-1 text-base text-gray-900 leading-snug">{t.text}</span>
                    )}

                    <div className="flex gap-1">
                      <button onClick={() => startEdit(t)} className="p-1.5 text-gray-300 active:text-green-500">✏️</button>
                      <button onClick={() => { deleteAnnualTask(t.id); load(); }} className="p-1.5 text-gray-300 active:text-red-500">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
