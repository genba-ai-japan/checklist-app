"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDiaryEntries, deleteDiaryEntry } from "@/lib/storage";
import type { DiaryEntry } from "@/types";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function DiaryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const load = () => setEntries(getDiaryEntries());
  useEffect(() => { load(); }, []);

  const today = todayDate();
  const hasToday = entries.some((e) => e.date === today);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-rose-500 text-lg p-1">‹</Link>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">📔 日記</h1>
            <p className="text-xs text-gray-400">{entries.length}件の記録</p>
          </div>
        </div>
      </header>

      {/* 今日の日記ボタン */}
      <div className="px-4 pt-4">
        <button
          onClick={() => router.push(`/diary/${today}`)}
          className={`w-full py-4 rounded-2xl font-bold text-base shadow-sm flex items-center justify-center gap-2 ${
            hasToday
              ? "bg-white border border-rose-200 text-rose-600"
              : "bg-rose-500 text-white"
          }`}
        >
          <span>📔</span>
          <span>{hasToday ? "今日の日記を見る・続ける" : "今日の日記をつける"}</span>
        </button>
      </div>

      {/* 過去の日記一覧 */}
      <main className="px-4 py-4 pb-16 space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <p className="text-4xl mb-2">📔</p>
            <p>まだ日記がありません</p>
            <p className="text-sm mt-1">今日の日記を始めましょう</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="relative">
              <Link href={`/diary/${entry.date}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-xl flex-shrink-0">
                      📔
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{fmtDate(entry.date)}</p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {entry.answers.length}問 回答済み
                      </p>
                      {entry.answers[0] && (
                        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                          {entry.answers[0].answer}
                        </p>
                      )}
                    </div>
                    <span className="text-gray-300 text-lg">›</span>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => setShowDelete(entry.date)}
                className="absolute top-3 right-10 p-2 text-gray-300 active:text-red-400"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </main>

      {/* 削除確認 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-3">
            <p className="text-center font-bold text-gray-900">この日記を削除しますか？</p>
            <button
              onClick={() => { deleteDiaryEntry(showDelete); setShowDelete(null); load(); }}
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
