"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getFutureTasks,
  addFutureTask,
  toggleFutureTask,
  deleteFutureTask,
  updateFutureTask,
} from "@/lib/storage";
import type { FutureTask } from "@/types";

export default function FuturePage() {
  const [tasks, setTasks] = useState<FutureTask[]>([]);
  const [input, setInput] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showDone, setShowDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => setTasks(getFutureTasks());
  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    addFutureTask(text);
    setInput("");
    load();
    inputRef.current?.focus();
  };

  const handleToggle = (id: string) => { toggleFutureTask(id); load(); };
  const handleDelete = (id: string) => { deleteFutureTask(id); load(); };

  const startEdit = (t: FutureTask) => { setEditId(t.id); setEditText(t.text); };
  const handleEdit = (id: string) => {
    const text = editText.trim();
    if (text) updateFutureTask(id, text);
    setEditId(null);
    load();
  };

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);
  const visible = showDone ? tasks : pending;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-purple-500 text-lg p-1">‹</Link>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">🌟 今後やりたいこと</h1>
            <p className="text-xs text-gray-400">{pending.length}件未完了 / {done.length}件完了</p>
          </div>
          <button
            onClick={() => setShowDone(!showDone)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              showDone
                ? "bg-purple-500 text-white border-purple-500"
                : "bg-white text-gray-500 border-gray-200"
            }`}
          >
            完了も表示
          </button>
        </div>
      </header>

      {/* 入力欄 */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="やりたいことを追加..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="px-5 py-3 bg-purple-500 text-white font-bold rounded-xl disabled:opacity-40 active:bg-purple-700"
          >
            追加
          </button>
        </div>
      </div>

      <main className="px-4 py-3 space-y-2 pb-16">
        {visible.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🌟</p>
            <p>やりたいことを追加しましょう</p>
          </div>
        ) : (
          visible.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl border shadow-sm px-4 py-3 flex items-center gap-3 ${
                t.completed ? "border-gray-100 opacity-50" : "border-gray-100"
              }`}
            >
              <button
                onClick={() => handleToggle(t.id)}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  t.completed
                    ? "bg-purple-500 border-purple-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {t.completed && <span className="text-xs">✓</span>}
              </button>

              {editId === t.id ? (
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEdit(t.id)}
                  onBlur={() => handleEdit(t.id)}
                  className="flex-1 border-b border-purple-400 focus:outline-none bg-transparent text-gray-900"
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

              <div className="flex gap-1">
                <button onClick={() => startEdit(t)} className="p-1.5 text-gray-300 active:text-purple-500">✏️</button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-gray-300 active:text-red-500">🗑️</button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
