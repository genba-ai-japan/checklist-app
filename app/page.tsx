"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getTodayTasks,
  addTodayTask,
  toggleTodayTask,
  deleteTodayTask,
} from "@/lib/storage";
import type { TodayTask } from "@/types";

const OTHER_SECTIONS = [
  { href: "/future", icon: "🌟", label: "今後やりたいこと", desc: "いつかやりたいことリスト", color: "from-purple-500 to-purple-600" },
  { href: "/annual", icon: "📅", label: "毎年やること", desc: "年間の定番タスク", color: "from-green-500 to-green-600" },
  { href: "/workout", icon: "💪", label: "筋トレ記録", desc: "種目・重量・回数を記録", color: "from-orange-500 to-orange-600" },
  { href: "/travel", icon: "✈️", label: "旅行プラン", desc: "スケジュールを作成・管理", color: "from-sky-500 to-sky-600" },
  { href: "/diary", icon: "📔", label: "日記", desc: "質問に答えながら今日を振り返る", color: "from-rose-500 to-rose-600" },
];

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [input, setInput] = useState("");
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

  const handleToggle = (id: string) => { toggleTodayTask(id); load(); };
  const handleDelete = (id: string) => { deleteTodayTask(id); load(); };

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 px-4 pt-10 pb-4">
        <p className="text-sm text-gray-400 mb-0.5">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900">マイノート</h1>
      </header>

      <main className="pb-10">

        {/* ── 今日やること ───────────────────────────── */}
        <section className="bg-white border-b border-gray-100">
          {/* セクションヘッダー */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <span className="font-bold text-gray-900">今日やること</span>
              {pending.length > 0 && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                  {pending.length}
                </span>
              )}
            </div>
            <Link href="/today" className="text-sm text-blue-500 font-medium">
              すべて見る ›
            </Link>
          </div>

          {/* 進捗バー */}
          {tasks.length > 0 && (
            <div className="h-1 mx-4 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${tasks.length ? (done.length / tasks.length) * 100 : 0}%` }}
              />
            </div>
          )}

          {/* タスク一覧 */}
          <div className="px-4 space-y-1.5 pb-2">
            {tasks.length === 0 && (
              <p className="text-sm text-gray-400 py-2">タスクがありません。追加してみましょう。</p>
            )}
            {/* 未完了 */}
            {pending.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
            {/* 完了済み（最大3件） */}
            {done.slice(0, 3).map((t) => (
              <TaskRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
            {done.length > 3 && (
              <p className="text-xs text-gray-400 pl-8">完了済み {done.length} 件</p>
            )}
          </div>

          {/* 入力欄 */}
          <div className="flex gap-2 px-4 pb-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="タスクを追加..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleAdd}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-blue-500 text-white font-bold rounded-xl text-sm disabled:opacity-40 active:bg-blue-700"
            >
              追加
            </button>
          </div>
        </section>

        {/* ── その他のセクション ──────────────────────── */}
        <section className="px-4 pt-5 pb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">メニュー</p>
          <div className="space-y-2.5">
            {OTHER_SECTIONS.map((s) => (
              <Link key={s.href} href={s.href}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:bg-gray-50">
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
                      {s.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{s.label}</p>
                      <p className="text-xs text-gray-400">{s.desc}</p>
                    </div>
                    <span className="text-gray-300">›</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: TodayTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-center gap-2.5 py-1 group ${task.completed ? "opacity-50" : ""}`}>
      <button
        onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          task.completed ? "bg-blue-500 border-blue-500 text-white" : "border-gray-300"
        }`}
      >
        {task.completed && <span className="text-[10px]">✓</span>}
      </button>
      <span className={`flex-1 text-sm leading-snug ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
        {task.text}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 active:text-red-400 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}
