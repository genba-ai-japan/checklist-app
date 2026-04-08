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

export default function WorkoutPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const load = () => setSessions(getWorkoutSessions());
  useEffect(() => { load(); }, []);

  const handleNew = () => {
    const s = createWorkoutSession();
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
            <h1 className="font-bold text-gray-900">💪 筋トレ記録</h1>
            <p className="text-xs text-gray-400">{sessions.length}回のトレーニング</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-28 space-y-3">
        {sessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">💪</p>
            <p>記録を始めましょう</p>
          </div>
        ) : (
          sessions.map((s) => {
            const totalSets = s.exercises.reduce((sum, e) => sum + e.sets, 0);
            return (
              <div key={s.id} className="relative">
                <Link href={`/workout/${s.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{fmtDate(s.date)}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {s.exercises.length}種目 · {totalSets}セット
                        </p>
                        {s.memo && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.memo}</p>
                        )}
                        {s.exercises.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {s.exercises.slice(0, 3).map((e) => (
                              <span
                                key={e.id}
                                className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full"
                              >
                                {e.equipment}
                              </span>
                            ))}
                            {s.exercises.length > 3 && (
                              <span className="text-xs text-gray-400">+{s.exercises.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-gray-300 text-lg">›</span>
                    </div>
                  </div>
                </Link>
                {/* 削除ボタン */}
                <button
                  onClick={() => setShowDelete(s.id)}
                  className="absolute top-3 right-10 p-2 text-gray-300 active:text-red-400"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </main>

      {/* 新規記録ボタン */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
        <button
          onClick={handleNew}
          className="w-full bg-orange-500 active:bg-orange-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg"
        >
          ＋ 今日のトレーニングを記録
        </button>
      </div>

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
