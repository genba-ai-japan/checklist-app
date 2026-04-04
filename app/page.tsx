"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadGoals, loadRoutine, loadImprovements } from "@/lib/dashboard-storage";
import { Goal, RoutineItem, ImprovementItem } from "@/types";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { openSettings } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [improvements, setImprovements] = useState<ImprovementItem[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setGoals(loadGoals());
    setRoutine(loadRoutine());
    setImprovements(loadImprovements());
  }, []);

  const goalDone = goals.filter((g) => g.status === "completed").length;
  const goalInProgress = goals.filter((g) => g.status === "in_progress").length;

  const todayRoutine = routine.filter(
    (r) => r.frequency === "毎日 午前" || r.frequency === "毎日 午後"
  );
  const todayDone = todayRoutine.filter((r) => r.checkedDates.includes(today)).length;

  const improvInProgress = improvements.filter((i) => i.status === "進行中").length;
  const improvDone = improvements.filter((i) => i.status === "完了").length;

  const weekLabel = getWeekLabel();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-green-700 text-white px-4 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-green-200 font-medium">2026年度</p>
            <h1 className="text-2xl font-bold mt-0.5">業務ダッシュボード</h1>
            <p className="text-sm text-green-200 mt-1">
              {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}　{weekLabel}
            </p>
          </div>
          <button
            onClick={openSettings}
            className="bg-white/20 active:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center text-xl mt-1"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* サマリーカード */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            href="/goals"
            icon="🎯"
            label="目標管理"
            value={`${goalInProgress}件 進行中`}
            sub={`完了 ${goalDone} / 全${goals.length}件`}
            color="blue"
          />
          <SummaryCard
            href="/routine"
            icon="✅"
            label="今日のルーティン"
            value={`${todayDone} / ${todayRoutine.length} 完了`}
            sub={`全${routine.length}件のルーティン`}
            color="green"
          />
          <SummaryCard
            href="/improvements"
            icon="💡"
            label="改善台帳"
            value={`${improvInProgress}件 進行中`}
            sub={`完了 ${improvDone} / 全${improvements.length}件`}
            color="yellow"
          />
          <SummaryCard
            href="/gantt"
            icon="📅"
            label="年間ガントチャート"
            value="2026年度計画"
            sub="4月〜3月"
            color="purple"
          />
        </div>

        {/* 今日のルーティン */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">今日のルーティン</h2>
            <Link href="/routine" className="text-xs text-blue-500">すべて見る</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {todayRoutine.map((item) => {
              const checked = item.checkedDates.includes(today);
              return (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                  <span className={`text-xl ${checked ? "opacity-100" : "opacity-30"}`}>
                    {checked ? "✅" : "⬜"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${checked ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {item.task}
                    </p>
                    <p className="text-xs text-gray-400">{item.frequency} · {item.requiredTime}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 優先目標 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">◎ 優先目標（進行中）</h2>
            <Link href="/goals" className="text-xs text-blue-500">すべて見る</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {goals
              .filter((g) => g.priority === "◎" && g.status === "in_progress")
              .slice(0, 5)
              .map((goal) => (
                <div key={goal.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                      {goal.category.replace("充填・調理課", "充填").replace("製造管理・荷受け業務", "製造/荷受")}
                    </span>
                    <p className="text-sm font-medium text-gray-800 flex-1">{goal.objective}</p>
                  </div>
                  {goal.deadline && (
                    <p className="text-xs text-gray-400 mt-1">期限: {goal.deadline}</p>
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* 改善台帳（進行中） */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">💡 改善台帳（進行中）</h2>
            <Link href="/improvements" className="text-xs text-blue-500">すべて見る</Link>
          </div>
          {improvements.filter((i) => i.status === "進行中").length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-400 text-center">進行中の改善はありません</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {improvements
                .filter((i) => i.status === "進行中")
                .slice(0, 3)
                .map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                        No.{item.no}
                      </span>
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

function SummaryCard({
  href, icon, label, value, sub, color,
}: {
  href: string;
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: "blue" | "green" | "yellow" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
    yellow: "bg-yellow-50 border-yellow-100",
    purple: "bg-purple-50 border-purple-100",
  };
  const textColors = {
    blue: "text-blue-700",
    green: "text-green-700",
    yellow: "text-yellow-700",
    purple: "text-purple-700",
  };
  return (
    <Link href={href}>
      <div className={`${colors[color]} border rounded-2xl p-3 active:opacity-70`}>
        <p className="text-2xl">{icon}</p>
        <p className={`text-xs font-medium ${textColors[color]} mt-1`}>{label}</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5 leading-tight">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </Link>
  );
}

function getWeekLabel(): string {
  const now = new Date();
  const day = now.getDate();
  const week = Math.ceil(day / 7);
  return `${week}週目`;
}
