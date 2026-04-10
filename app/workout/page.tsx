"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getWorkoutSessions, createWorkoutSession, deleteWorkoutSession } from "@/lib/storage";
import type { WorkoutSession } from "@/types";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}時間${m}分${s > 0 ? s + "秒" : ""}`;
  if (m > 0) return `${m}分${s > 0 ? s + "秒" : ""}`;
  return `${s}秒`;
}

function fmtPace(distanceKm: number, durationSec: number): string {
  if (distanceKm <= 0) return "-";
  const secPerKm = durationSec / distanceKm;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}'${String(s).padStart(2, "0")}" /km`;
}

export default function WorkoutPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);

  const load = () => setSessions(getWorkoutSessions());
  useEffect(() => { load(); }, []);

  const handleNew = (type: "strength" | "running") => {
    const s = createWorkoutSession(type);
    setShowTypeModal(false);
    router.push(`/workout/${s.id}`);
  };

  const handleDelete = (id: string) => {
    deleteWorkoutSession(id);
    setShowDelete(null);
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-orange-500 text-lg p-1">‹</Link>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">🏋️ トレーニング記録</h1>
            <p className="text-xs text-gray-400">{sessions.length}回のトレーニング</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-28 space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🏋️</p>
            <p>記録を始めましょう</p>
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="relative">
              <Link href={`/workout/${s.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{s.type === "running" ? "🏃" : "💪"}</span>
                        <p className="font-bold text-gray-900">{fmtDate(s.date)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.type === "running"
                            ? "bg-sky-50 text-sky-600"
                            : "bg-orange-50 text-orange-600"
                        }`}>
                          {s.type === "running" ? "ランニング" : "筋トレ"}
                        </span>
                      </div>

                      {/* 筋トレサマリ */}
                      {s.type === "strength" && (
                        <>
                          <p className="text-sm text-gray-500 mt-1 ml-6">
                            {s.exercises.length}種目 · {s.exercises.reduce((sum, e) => sum + e.sets, 0)}セット
                          </p>
                          {s.exercises.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5 ml-6">
                              {s.exercises.slice(0, 3).map((e) => (
                                <span key={e.id} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                                  {e.equipment}
                                </span>
                              ))}
                              {s.exercises.length > 3 && (
                                <span className="text-xs text-gray-400">+{s.exercises.length - 3}</span>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* ランニングサマリ */}
                      {s.type === "running" && s.running && (
                        <div className="mt-1.5 ml-6 flex gap-3 flex-wrap">
                          <span className="text-sm font-bold text-sky-600">{s.running.distanceKm} km</span>
                          <span className="text-sm text-gray-500">{fmtDuration(s.running.durationSec)}</span>
                          <span className="text-sm text-gray-400">{fmtPace(s.running.distanceKm, s.running.durationSec)}</span>
                          {s.running.route && (
                            <span className="text-xs text-gray-400 w-full mt-0.5 truncate">{s.running.route}</span>
                          )}
                        </div>
                      )}
                      {s.type === "running" && !s.running && (
                        <p className="text-sm text-gray-400 mt-1 ml-6">未記録</p>
                      )}

                      {s.memo && (
                        <p className="text-xs text-gray-400 mt-1.5 ml-6 line-clamp-1">{s.memo}</p>
                      )}
                    </div>
                    <span className="text-gray-300 text-lg ml-2 flex-shrink-0">›</span>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => setShowDelete(s.id)}
                className="absolute top-3 right-10 p-2 text-gray-300 active:text-red-400"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </main>

      {/* 新規記録ボタン */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
        <button
          onClick={() => setShowTypeModal(true)}
          className="w-full bg-orange-500 active:bg-orange-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg"
        >
          ＋ トレーニングを記録
        </button>
      </div>

      {/* 種類選択モーダル */}
      {showTypeModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end"
          onClick={() => setShowTypeModal(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center font-bold text-gray-900 text-lg">どちらを記録しますか？</p>
            <button
              onClick={() => handleNew("strength")}
              className="w-full py-5 bg-orange-50 border border-orange-200 text-orange-700 font-bold rounded-2xl text-base flex items-center justify-center gap-3 active:bg-orange-100"
            >
              <span className="text-2xl">💪</span>
              <div className="text-left">
                <p className="font-bold">筋トレ</p>
                <p className="text-xs text-orange-400 font-normal">種目・重量・回数・セット数を記録</p>
              </div>
            </button>
            <button
              onClick={() => handleNew("running")}
              className="w-full py-5 bg-sky-50 border border-sky-200 text-sky-700 font-bold rounded-2xl text-base flex items-center justify-center gap-3 active:bg-sky-100"
            >
              <span className="text-2xl">🏃</span>
              <div className="text-left">
                <p className="font-bold">ランニング</p>
                <p className="text-xs text-sky-400 font-normal">距離・タイム・ペースを記録</p>
              </div>
            </button>
            <button
              onClick={() => setShowTypeModal(false)}
              className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-3">
            <p className="text-center font-bold text-gray-900">この記録を削除しますか？</p>
            <button
              onClick={() => handleDelete(showDelete)}
              className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl"
            >
              削除する
            </button>
            <button
              onClick={() => setShowDelete(null)}
              className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
