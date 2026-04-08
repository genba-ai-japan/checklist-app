"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getWorkoutSession,
  addExercise,
  deleteExercise,
  updateWorkoutSession,
  getEquipmentHistory,
} from "@/lib/storage";
import type { WorkoutSession, WorkoutExercise } from "@/types";

const PRESET_EQUIPMENT = [
  "ベンチプレス", "スクワット", "デッドリフト", "ショルダープレス",
  "ラットプルダウン", "ロープレス", "ダンベルカール", "トライセプス",
  "レッグプレス", "チェストフライ", "懸垂", "腹筋ローラー",
];

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);

  // フォーム状態
  const [equipment, setEquipment] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("3");
  const [memo, setMemo] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const load = () => {
    const s = getWorkoutSession(id);
    setSession(s);
    if (s) setMemo(s.memo ?? "");
  };

  useEffect(() => {
    load();
    // 入力履歴 + プリセット
    const history = getEquipmentHistory();
    const merged = Array.from(new Set([...history, ...PRESET_EQUIPMENT]));
    setSuggestions(merged);
  }, [id]);

  const handleAddExercise = () => {
    const eq = equipment.trim();
    if (!eq || !weight || !reps) return;
    addExercise(id, {
      equipment: eq,
      weightKg: parseFloat(weight),
      reps: parseInt(reps),
      sets: parseInt(sets) || 1,
    });
    setEquipment("");
    setWeight("");
    setReps("");
    setSets("3");
    load();
  };

  const handleSaveMemo = () => {
    updateWorkoutSession(id, { memo });
    load();
  };

  const handleDeleteExercise = (exerciseId: string) => {
    deleteExercise(id, exerciseId);
    load();
  };

  const filteredSuggestions = equipment
    ? suggestions.filter((s) => s.includes(equipment))
    : suggestions;

  if (!session) return <div className="p-8 text-center text-gray-400">読み込み中...</div>;

  const dateStr = new Date(session.date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/workout" className="text-orange-500 text-lg p-1">‹</Link>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">💪 {dateStr}</h1>
            <p className="text-xs text-gray-400">{session.exercises.length}種目</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-20 space-y-4">

        {/* 種目追加フォーム */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="font-bold text-gray-700 text-sm">種目を追加</p>

          {/* 種目名 */}
          <div className="relative">
            <input
              type="text"
              value={equipment}
              onChange={(e) => { setEquipment(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="種目名 (例: ベンチプレス)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
                {filteredSuggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => { setEquipment(s); setShowSuggestions(false); }}
                    className="w-full text-left px-4 py-2.5 text-base text-gray-800 active:bg-orange-50 border-b border-gray-100 last:border-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 重量 / 回数 / セット数 */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">重量 (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="60"
                className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">回数</label>
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">セット数</label>
              <input
                type="number"
                inputMode="numeric"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                placeholder="3"
                className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <button
            onClick={() => { setShowSuggestions(false); handleAddExercise(); }}
            disabled={!equipment.trim() || !weight || !reps}
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl disabled:opacity-40 active:bg-orange-700"
          >
            ＋ 追加
          </button>
        </div>

        {/* 記録済み種目 */}
        {session.exercises.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 px-1">記録済み</p>
            {session.exercises.map((e: WorkoutExercise) => (
              <ExerciseCard
                key={e.id}
                exercise={e}
                onDelete={() => handleDeleteExercise(e.id)}
              />
            ))}
          </div>
        )}

        {session.exercises.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-1">🏋️</p>
            <p className="text-sm">種目を追加してください</p>
          </div>
        )}

        {/* メモ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <p className="font-bold text-gray-700 text-sm">メモ</p>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={handleSaveMemo}
            placeholder="体調・感想など..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>
      </main>
    </div>
  );
}

function ExerciseCard({
  exercise,
  onDelete,
}: {
  exercise: WorkoutExercise;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="flex-1">
        <p className="font-bold text-gray-900">{exercise.equipment}</p>
        <div className="flex gap-3 mt-1">
          <span className="text-sm text-orange-600 font-bold">{exercise.weightKg}kg</span>
          <span className="text-sm text-gray-500">{exercise.reps}回 × {exercise.sets}セット</span>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-2 text-gray-300 active:text-red-400"
      >
        🗑️
      </button>
    </div>
  );
}
