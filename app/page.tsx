"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadGoals, loadRoutine, loadImprovements, loadMemos, saveMemos } from "@/lib/dashboard-storage";
import { Goal, RoutineItem, ImprovementItem, MemoItem } from "@/types";
import { useAuth } from "@/lib/auth-context";

function getTodayStr() { return new Date().toISOString().slice(0, 10); }
function getMonthStr() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; }
function getISOWeek() {
  const n = new Date();
  const d = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d.getTime() - y.getTime()) / 86400000) + 1) / 7)).padStart(2,"0")}`;
}
function getMonthWeekKey(freq: string): string {
  const m = getMonthStr();
  if (freq === "毎日 午前" || freq === "毎日 午後") return getTodayStr();
  if (freq === "毎週") return getISOWeek();
  if (freq === "毎月") return m;
  const w = freq.replace("週目", "");
  return `${m}-W${w}`;
}

export default function DashboardPage() {
  const { openSettings, username } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [improvements, setImprovements] = useState<ImprovementItem[]>([]);
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [newMemo, setNewMemo] = useState("");
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoText, setEditingMemoText] = useState("");
  const memoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setGoals(loadGoals());
    setRoutine(loadRoutine());
    setImprovements(loadImprovements());
    setMemos(loadMemos());
  }, []);

  function addMemo() {
    const text = newMemo.trim();
    if (!text) return;
    const updated = [...memos, { id: crypto.randomUUID(), text }];
    setMemos(updated);
    saveMemos(updated);
    setNewMemo("");
    setTimeout(() => memoInputRef.current?.focus(), 50);
  }

  function deleteMemo(id: string) {
    const updated = memos.filter((m) => m.id !== id);
    setMemos(updated);
    saveMemos(updated);
  }

  function startEditMemo(m: MemoItem) {
    setEditingMemoId(m.id);
    setEditingMemoText(m.text);
  }

  function commitEditMemo() {
    if (!editingMemoId) return;
    const text = editingMemoText.trim();
    if (!text) { deleteMemo(editingMemoId); }
    else {
      const updated = memos.map((m) => m.id === editingMemoId ? { ...m, text } : m);
      setMemos(updated);
      saveMemos(updated);
    }
    setEditingMemoId(null);
    setEditingMemoText("");
  }

  const goalDone = goals.filter((g) => g.status === "completed").length;
  const goalInProgress = goals.filter((g) => g.status === "in_progress").length;
  const monthRoutineChecked = routine.filter((r) => r.checkedDates.includes(getMonthWeekKey(r.frequency))).length;
  const improvInProgress = improvements.filter((i) => i.status === "進行中").length;
  const improvDone = improvements.filter((i) => i.status === "完了").length;
  const weekLabel = `${Math.ceil(new Date().getDate() / 7)}週目`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-lime-600 text-white px-4 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-lime-200 font-medium">2026年度 {username && `· ${username}`}</p>
            <h1 className="text-2xl font-bold mt-0.5">業務ダッシュボード</h1>
            <p className="text-sm text-lime-200 mt-1">
              {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}　{weekLabel}
            </p>
          </div>
          <button onClick={openSettings}
            className="bg-white/20 active:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center text-xl mt-1">
            ⚙️
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* メモ欄 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">📝</span>
            <h2 className="font-bold text-gray-800 flex-1">メモ</h2>
          </div>
          <div className="px-4 py-2">
            {memos.map((m) => (
              <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-lime-500 text-sm shrink-0">•</span>
                {editingMemoId === m.id ? (
                  <input
                    autoFocus
                    value={editingMemoText}
                    onChange={(e) => setEditingMemoText(e.target.value)}
                    onBlur={commitEditMemo}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEditMemo(); if (e.key === "Escape") { setEditingMemoId(null); } }}
                    className="flex-1 text-sm text-gray-800 bg-lime-50 rounded-lg px-2 py-0.5 focus:outline-none"
                  />
                ) : (
                  <span
                    className="flex-1 text-sm text-gray-800 cursor-pointer"
                    onClick={() => startEditMemo(m)}
                  >{m.text}</span>
                )}
                <button onClick={() => deleteMemo(m.id)} className="text-gray-300 active:text-red-400 text-xs px-1 shrink-0">✕</button>
              </div>
            ))}
            {memos.length === 0 && (
              <p className="text-xs text-gray-300 py-2">タップして入力 → 追加できます</p>
            )}
            {/* 新規追加行 */}
            <div className="flex items-center gap-2 pt-2 pb-1">
              <span className="text-gray-300 text-sm shrink-0">•</span>
              <input
                ref={memoInputRef}
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addMemo(); }}
                placeholder="メモを追加..."
                className="flex-1 text-sm text-gray-700 placeholder-gray-300 bg-transparent focus:outline-none"
              />
              {newMemo.trim() && (
                <button onClick={addMemo} className="text-lime-600 font-bold text-xs px-2 py-1 rounded-lg bg-lime-50 active:bg-lime-100 shrink-0">追加</button>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard href="/goals" icon="🎯" label="目標管理" value={`${goalInProgress}件 進行中`} sub={`完了 ${goalDone} / 全${goals.length}件`} color="blue" />
          <SummaryCard href="/routine" icon="✅" label="今月のルーティン" value={`${monthRoutineChecked} / ${routine.length} 完了`} sub={`全${routine.length}件のルーティン`} color="lime" />
          <SummaryCard href="/improvements" icon="💡" label="改善台帳" value={`${improvInProgress}件 進行中`} sub={`完了 ${improvDone} / 全${improvements.length}件`} color="yellow" />
          <SummaryCard href="/gantt" icon="📅" label="年間ガントチャート" value="2026年度計画" sub="4月〜3月" color="purple" />
        </div>

        {/* 今月のルーティン */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">今月のルーティン</h2>
            <Link href="/routine" className="text-xs text-blue-500">すべて見る</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {routine.map((item) => {
              const key = getMonthWeekKey(item.frequency);
              const checked = item.checkedDates.includes(key);
              return (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                  <span className={`text-xl ${checked ? "opacity-100" : "opacity-30"}`}>{checked ? "✅" : "⬜"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${checked ? "line-through text-gray-400" : "text-gray-800"}`}>{item.task}</p>
                    <p className="text-xs text-gray-400">{item.frequency} · {item.requiredTime}</p>
                  </div>
                  {checked && <span className="text-xs text-lime-600 font-medium shrink-0">完了</span>}
                </div>
              );
            })}
            {routine.length === 0 && (
              <p className="px-4 py-4 text-sm text-gray-400 text-center">ルーティンが登録されていません</p>
            )}
          </div>
        </section>

        {/* 優先目標 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">◎ 優先目標（進行中）</h2>
            <Link href="/goals" className="text-xs text-blue-500">すべて見る</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {goals.filter((g) => g.priority === "◎" && g.status === "in_progress").slice(0, 5).map((goal) => (
              <div key={goal.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                    {goal.category.replace("充填・調理課","充填").replace("製造管理・荷受け業務","製造/荷受")}
                  </span>
                  <p className="text-sm font-medium text-gray-800 flex-1">{goal.objective}</p>
                </div>
                {goal.deadline && <p className="text-xs text-gray-400 mt-1">期限: {goal.deadline}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* 改善台帳 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">💡 改善台帳（進行中）</h2>
            <Link href="/improvements" className="text-xs text-blue-500">すべて見る</Link>
          </div>
          {improvements.filter((i) => i.status === "進行中").length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-400 text-center">進行中の改善はありません</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {improvements.filter((i) => i.status === "進行中").slice(0, 3).map((item) => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-1.5 py-0.5 rounded shrink-0">No.{item.no}</span>
                    <p className="text-sm font-medium text-gray-800 flex-1 truncate">{item.improvementContent}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.problem} · {item.person} · 期限: {item.deadline}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ href, icon, label, value, sub, color }: {
  href: string; icon: string; label: string; value: string; sub: string;
  color: "blue" | "lime" | "yellow" | "purple";
}) {
  const cls = {
    blue: { bg: "bg-blue-50 border-blue-100", text: "text-blue-700" },
    lime: { bg: "bg-lime-50 border-lime-100", text: "text-lime-700" },
    yellow: { bg: "bg-yellow-50 border-yellow-100", text: "text-yellow-700" },
    purple: { bg: "bg-purple-50 border-purple-100", text: "text-purple-700" },
  }[color];
  return (
    <Link href={href}>
      <div className={`${cls.bg} border rounded-2xl p-3 active:opacity-70`}>
        <p className="text-2xl">{icon}</p>
        <p className={`text-xs font-medium ${cls.text} mt-1`}>{label}</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5 leading-tight">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </Link>
  );
}
