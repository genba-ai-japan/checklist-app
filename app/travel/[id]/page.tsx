"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getTravelPlan,
  addTravelItem,
  deleteTravelItem,
  updateTravelItem,
} from "@/lib/storage";
import type { TravelPlan, TravelItem } from "@/types";

function toDateStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function fmtDayLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function TravelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [showForm, setShowForm] = useState(false);

  // 追加フォーム
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formActivity, setFormActivity] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // 編集
  const [editId, setEditId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editActivity, setEditActivity] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const load = () => { setPlan(getTravelPlan(id)); };
  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (plan && !formDate) setFormDate(plan.startDate);
  }, [plan]);

  const handleAdd = () => {
    const act = formActivity.trim();
    if (!act || !formDate) return;
    addTravelItem(id, {
      date: formDate,
      time: formTime || undefined,
      activity: act,
      notes: formNotes.trim() || undefined,
    });
    setFormActivity("");
    setFormNotes("");
    setFormTime("");
    setShowForm(false);
    load();
  };

  const startEdit = (item: TravelItem) => {
    setEditId(item.id);
    setEditTime(item.time ?? "");
    setEditActivity(item.activity);
    setEditNotes(item.notes ?? "");
  };

  const handleEdit = (item: TravelItem) => {
    const act = editActivity.trim();
    if (!act) { setEditId(null); return; }
    updateTravelItem(id, item.id, {
      date: item.date,
      time: editTime || undefined,
      activity: act,
      notes: editNotes.trim() || undefined,
    });
    setEditId(null);
    load();
  };

  if (!plan) return <div className="p-8 text-center text-gray-400">読み込み中...</div>;

  const dates = getDatesInRange(plan.startDate, plan.endDate);
  const itemsByDate = new Map<string, TravelItem[]>();
  dates.forEach((d) => itemsByDate.set(d, []));
  plan.items.forEach((item) => {
    if (!itemsByDate.has(item.date)) itemsByDate.set(item.date, []);
    itemsByDate.get(item.date)!.push(item);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/travel" className="text-sky-500 text-lg p-1">‹</Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{plan.title}</h1>
            {plan.destination && (
              <p className="text-xs text-sky-500">📍 {plan.destination}</p>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-28 space-y-5">
        {dates.map((date) => {
          const items = itemsByDate.get(date) ?? [];
          return (
            <section key={date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-sky-600">{fmtDayLabel(date)}</span>
                <div className="flex-1 h-px bg-sky-100" />
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3"
                  >
                    {editId === item.id ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="w-28 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                          <input
                            autoFocus
                            type="text"
                            value={editActivity}
                            onChange={(e) => setEditActivity(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleEdit(item)}
                            className="flex-1 px-3 py-2 border border-sky-300 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="メモ..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex-1 py-2 bg-sky-500 text-white text-sm font-bold rounded-xl"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="flex-1 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded-xl"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        {item.time ? (
                          <span className="text-sm text-sky-500 font-mono w-12 flex-shrink-0 mt-0.5">{item.time}</span>
                        ) : (
                          <span className="w-12 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium">{item.activity}</p>
                          {item.notes && (
                            <p className="text-sm text-gray-400 mt-0.5">{item.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(item)} className="p-1.5 text-gray-300 active:text-sky-500">✏️</button>
                          <button
                            onClick={() => { deleteTravelItem(id, item.id); load(); }}
                            className="p-1.5 text-gray-300 active:text-red-400"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-sm text-gray-300 px-2">予定なし</p>
                )}
              </div>
            </section>
          );
        })}
      </main>

      {/* 追加ボタン */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-sky-500 active:bg-sky-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg"
        >
          ＋ 予定を追加
        </button>
      </div>

      {/* 追加モーダル */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 text-center">予定を追加</h2>

            {/* 日付 */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">日付</label>
              <select
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {dates.map((d) => (
                  <option key={d} value={d}>{fmtDayLabel(d)}</option>
                ))}
              </select>
            </div>

            {/* 時間 */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">時間（任意）</label>
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* 内容 */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">内容 *</label>
              <input
                autoFocus
                type="text"
                value={formActivity}
                onChange={(e) => setFormActivity(e.target.value)}
                placeholder="例: 首里城見学、ホテルチェックイン"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* メモ */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">メモ（任意）</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="住所・予約番号など"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!formActivity.trim()}
              className="w-full py-4 bg-sky-500 text-white font-bold rounded-2xl disabled:opacity-40"
            >
              追加する
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
    </div>
  );
}
