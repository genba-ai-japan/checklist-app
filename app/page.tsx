"use client";

import Link from "next/link";

const sections = [
  {
    href: "/today",
    icon: "📋",
    label: "今日やること",
    desc: "今日のタスクをチェック",
    color: "from-blue-500 to-blue-600",
  },
  {
    href: "/future",
    icon: "🌟",
    label: "今後やりたいこと",
    desc: "いつかやりたいことリスト",
    color: "from-purple-500 to-purple-600",
  },
  {
    href: "/annual",
    icon: "📅",
    label: "毎年やること",
    desc: "年間の定番タスク",
    color: "from-green-500 to-green-600",
  },
  {
    href: "/workout",
    icon: "💪",
    label: "筋トレ記録",
    desc: "種目・重量・回数を記録",
    color: "from-orange-500 to-orange-600",
  },
  {
    href: "/travel",
    icon: "✈️",
    label: "旅行プラン",
    desc: "スケジュールを作成・管理",
    color: "from-sky-500 to-sky-600",
  },
];

export default function HomePage() {
  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 pt-10 pb-5">
        <p className="text-sm text-gray-400 mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900">マイノート</h1>
      </header>

      <main className="px-4 py-5 space-y-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-4 p-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{s.label}</p>
                  <p className="text-sm text-gray-400">{s.desc}</p>
                </div>
                <span className="text-gray-300 text-lg">›</span>
              </div>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
