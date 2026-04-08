"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getTodayTasks,
  addTodayTask,
  toggleTodayTask,
  deleteTodayTask,
  updateTodayTask,
} from "@/lib/storage";
import type { TodayTask } from "@/types";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [input, setInput] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const date = todayDate();

  const load = () => setTasks(getTodayTasks(date));

  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    addTodayTask(text, date);
    setInput("");
    load();
    inputRef.current?.focus();
  };

  const handleToggle = (id: string) => {
    toggleTodayTask(id);
    load();
  };

  const handleDelete = (id: string) => {
    deleteTodayTask(id);
    load();
  };

  const startEdit = (t: TodayTask) => {
    setEditId(t.id);
    setEditText(t.text);
  };

  const handleEdit = (id: string) => {
    const text = editText.trim();
    if (text) updateTodayTask(id, text);
    setEditId(null);
    load();
  };

  const done = tasks.filter((t) => t.completed).length;
  const today = new Date().toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-blue-500 text-lg p-1">‹</Link>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">📋 今日やること</h1>
            <p className="text-xs text-gray-400">{today}</p>
          </div>
          <span className="text-sm text-gray-400">{done}/{tasks.length}</span>
        </div>
      </header>

      {/* 進捗バー */}
      {tasks.length > 0 && (
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* 入力欄 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="タスクを追加..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="px-5 py-3 bg-blue-500 text-white font-bold rounded-xl disabled:opacity-40 active:bg-blue-700"
          >
            追加
          </button>
        </div>
      </div>

      {/* タスク一覧 */}
      <main className="px-4 py-3 space-y-2 pb-16">
        {tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>タスクを追加しましょう</p>
          </div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border shadow-sm px-4 py-3 flex items-center gap-3 ${
                t.completed ? "border-gray-100 opacity-60" : "border-gray-100"
              }`}
            >
              {/* チェックボックス */}
              <button
                onClick={() => handleToggle(t.id)}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  t.completed
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {t.completed && <span className="text-xs">✓</span>}
              </button>

              {/* テキスト or 編集 */}
              {editId === t.id ? (
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEdit(t.id)}
                  onBlur={() => handleEdit(t.id)}
                  className="flex-1 border-b border-blue-400 focus:outline-none bg-transparent text-gray-900"
                />
              ) : (
                <span
                  onDoubleClick={() => startEdit(t)}
                  className={`flex-1 text-base leading-snug cursor-default ${
                    t.completed ? "line-through text-gray-400" : "text-gray-900"
                  }`}
                >
                  {t.text}
                </span>
              )}

              {/* 編集 / 削除 */}
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(t)}
                  className="p-1.5 text-gray-300 active:text-blue-500"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-gray-300 active:text-red-500"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
