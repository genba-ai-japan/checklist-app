"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTravelPlans, createTravelPlan, deleteTravelPlan } from "@/lib/storage";
import type { TravelPlan } from "@/types";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
  });
}

function toDateStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function TravelPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);

  // 新規フォーム
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(toDateStr());
  const [endDate, setEndDate] = useState(addDays(toDateStr(), 2));

  const load = () => setPlans(getTravelPlans());
  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    const t = title.trim();
    if (!t) return;
    const plan = createTravelPlan({
      title: t,
      destination: destination.trim() || undefined,
      startDate,
      endDate,
    });
    setShowForm(false);
    setTitle("");
    setDestination("");
    router.push(`/travel/${plan.id}`);
  };

  const handleDelete = (id: string) => {
    deleteTravelPlan(id);
    setShowDelete(null);
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-sky-500 text-lg p-1">‹</Link>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">✈️ 旅行プラン</h1>
            <p className="text-xs text-gray-400">{plans.length}件のプラン</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-28 space-y-3">
        {plans.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">✈️</p>
            <p>旅行プランを作成しましょう</p>
          </div>
        ) : (
          plans.map((p) => {
            const nights = Math.max(
              0,
              Math.round(
                (new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / 86400000
              )
            );
            return (
              <div key={p.id} className="relative">
                <Link href={`/travel/${p.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-base">{p.title}</p>
                        {p.destination && (
                          <p className="text-sm text-sky-600 mt-0.5">📍 {p.destination}</p>
                        )}
                        <p className="text-sm text-gray-400 mt-1">
                          {fmtDate(p.startDate)} 〜 {fmtDate(p.endDate)}
                          {nights > 0 && <span className="ml-2">{nights}泊{nights + 1}日</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{p.items.length}件のスケジュール</p>
                      </div>
                      <span className="text-gray-300 text-lg ml-2">›</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => setShowDelete(p.id)}
                  className="absolute top-3 right-10 p-2 text-gray-300 active:text-red-400"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </main>

      {/* 新規ボタン */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-sky-500 active:bg-sky-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg"
        >
          ＋ 新しい旅行プランを作成
        </button>
      </div>

      {/* 新規作成モーダル */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowForm(false)}>
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 text-center">新しい旅行プラン</h2>

            <div>
              <label className="text-sm text-gray-500 block mb-1">タイトル *</label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 沖縄旅行、北海道スキー"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-1">目的地</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="例: 沖縄、東京"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-500 block mb-1">出発日</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">帰宅日</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!title.trim()}
              className="w-full py-4 bg-sky-500 text-white font-bold rounded-2xl disabled:opacity-40"
            >
              作成する
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 削除確認 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-3">
            <p className="text-center font-bold text-gray-900">このプランを削除しますか？</p>
            <button onClick={() => handleDelete(showDelete)} className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl">削除する</button>
            <button onClick={() => setShowDelete(null)} className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl">キャンセル</button>
          </div>
        </div>
      )}
    </div>
  );
}
