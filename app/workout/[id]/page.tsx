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
import type { WorkoutSession, WorkoutExercise, RunningData } from "@/types";

// ── 筋トレ プリセット ─────────────────────────────────────────
const PRESET_EQUIPMENT = [
  "ベンチプレス", "スクワット", "デッドリフト", "ショルダープレス",
  "ラットプルダウン", "ロウプレス", "ダンベルカール", "トライセプス",
  "レッグプレス", "チェストフライ", "懸垂", "腹筋ローラー",
];

// ── ペース計算 ────────────────────────────────────────────────
function calcPace(distanceKm: number, durationSec: number): string {
  if (distanceKm <= 0 || durationSec <= 0) return "-";
  const secPerKm = durationSec / distanceKm;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}'${String(s).padStart(2, "0")}"/km`;
}

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}時間${m}分${s > 0 ? s + "秒" : ""}`;
  return `${m}分${s > 0 ? s + "秒" : ""}`;
}

// ── メインページ ──────────────────────────────────────────────
export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [memo, setMemo] = useState("");

  const load = () => {
    const s = getWorkoutSession(id);
    setSession(s);
    if (s) setMemo(s.memo ?? "");
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveMemo = () => { updateWorkoutSession(id, { memo }); load(); };

  if (!session) return <div className="p-8 text-center text-gray-400">読み込み中...</div>;

  const dateStr = new Date(session.date).toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  const isRunning = session.type === "running";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/workout" className="text-orange-500 text-lg p-1">‹</Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span>{isRunning ? "🏃" : "💪"}</span>
              <h1 className="font-bold text-gray-900">{dateStr}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isRunning ? "bg-sky-50 text-sky-600" : "bg-orange-50 text-orange-600"
              }`}>
                {isRunning ? "ランニング" : "筋トレ"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-20 space-y-4">
        {isRunning ? (
          <RunningForm
            sessionId={id}
            existing={session.running}
            onSave={() => load()}
          />
        ) : (
          <StrengthForm
            sessionId={id}
            session={session}
            onSave={() => load()}
          />
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

// ── 🏃 ランニングフォーム ────────────────────────────────────────
function RunningForm({
  sessionId,
  existing,
  onSave,
}: {
  sessionId: string;
  existing?: RunningData;
  onSave: () => void;
}) {
  const [distStr, setDistStr] = useState(existing ? String(existing.distanceKm) : "");
  const [hours, setHours] = useState(existing ? String(Math.floor(existing.durationSec / 3600)) : "0");
  const [mins, setMins] = useState(existing ? String(Math.floor((existing.durationSec % 3600) / 60)) : "");
  const [secs, setSecs] = useState(existing ? String(existing.durationSec % 60) : "0");
  const [route, setRoute] = useState(existing?.route ?? "");
  const [saved, setSaved] = useState(!!existing);

  const totalSec =
    (parseInt(hours) || 0) * 3600 +
    (parseInt(mins) || 0) * 60 +
    (parseInt(secs) || 0);
  const distKm = parseFloat(distStr) || 0;
  const pace = calcPace(distKm, totalSec);
  const canSave = distKm > 0 && totalSec > 0;

  const handleSave = () => {
    if (!canSave) return;
    updateWorkoutSession(sessionId, {
      running: {
        distanceKm: distKm,
        durationSec: totalSec,
        route: route.trim() || undefined,
      },
    });
    setSaved(true);
    onSave();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <p className="font-bold text-gray-700 text-sm">ランニング記録</p>

      {/* 距離 */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">距離 (km)</label>
        <input
          type="number"
          inputMode="decimal"
          value={distStr}
          onChange={(e) => { setDistStr(e.target.value); setSaved(false); }}
          placeholder="5.0"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-2xl font-bold text-center text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>

      {/* タイム */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">タイム</label>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <input
              type="number"
              inputMode="numeric"
              value={hours}
              onChange={(e) => { setHours(e.target.value); setSaved(false); }}
              placeholder="0"
              min="0"
              className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <p className="text-xs text-gray-400 mt-0.5">時間</p>
          </div>
          <div className="text-center">
            <input
              type="number"
              inputMode="numeric"
              value={mins}
              onChange={(e) => { setMins(e.target.value); setSaved(false); }}
              placeholder="30"
              min="0"
              max="59"
              className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <p className="text-xs text-gray-400 mt-0.5">分</p>
          </div>
          <div className="text-center">
            <input
              type="number"
              inputMode="numeric"
              value={secs}
              onChange={(e) => { setSecs(e.target.value); setSaved(false); }}
              placeholder="0"
              min="0"
              max="59"
              className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <p className="text-xs text-gray-400 mt-0.5">秒</p>
          </div>
        </div>
      </div>

      {/* ペース表示 */}
      {canSave && (
        <div className="bg-sky-50 rounded-xl px-4 py-3 flex justify-between items-center">
          <div className="text-center flex-1">
            <p className="text-xs text-sky-400">距離</p>
            <p className="text-lg font-bold text-sky-700">{distKm} km</p>
          </div>
          <div className="w-px h-8 bg-sky-200" />
          <div className="text-center flex-1">
            <p className="text-xs text-sky-400">タイム</p>
            <p className="text-lg font-bold text-sky-700">{fmtDuration(totalSec)}</p>
          </div>
          <div className="w-px h-8 bg-sky-200" />
          <div className="text-center flex-1">
            <p className="text-xs text-sky-400">ペース</p>
            <p className="text-base font-bold text-sky-700">{pace}</p>
          </div>
        </div>
      )}

      {/* コース */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">コース・ルート（任意）</label>
        <input
          type="text"
          value={route}
          onChange={(e) => { setRoute(e.target.value); setSaved(false); }}
          placeholder="例: 公園一周、駅まで往復"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave}
        className={`w-full py-3 font-bold rounded-xl text-white disabled:opacity-40 transition-colors ${
          saved ? "bg-green-500" : "bg-sky-500 active:bg-sky-700"
        }`}
      >
        {saved ? "✓ 保存済み" : "保存する"}
      </button>
    </div>
  );
}

// ── 💪 筋トレフォーム ────────────────────────────────────────
function StrengthForm({
  sessionId,
  session,
  onSave,
}: {
  sessionId: string;
  session: WorkoutSession;
  onSave: () => void;
}) {
  const [equipment, setEquipment] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("3");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const history = getEquipmentHistory();
    setSuggestions(Array.from(new Set([...history, ...PRESET_EQUIPMENT])));
  }, []);

  const handleAdd = () => {
    const eq = equipment.trim();
    if (!eq || !weight || !reps) return;
    addExercise(sessionId, {
      equipment: eq,
      weightKg: parseFloat(weight),
      reps: parseInt(reps),
      sets: parseInt(sets) || 1,
    });
    setEquipment(""); setWeight(""); setReps(""); setSets("3");
    onSave();
  };

  const filtered = equipment
    ? suggestions.filter((s) => s.includes(equipment))
    : suggestions;

  return (
    <>
      {/* 種目追加フォーム */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="font-bold text-gray-700 text-sm">種目を追加</p>

        <div className="relative">
          <input
            type="text"
            value={equipment}
            onChange={(e) => { setEquipment(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="種目名 (例: ベンチプレス)"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
              {filtered.map((s) => (
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

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "重量 (kg)", value: weight, set: setWeight, placeholder: "60", mode: "decimal" as const },
            { label: "回数", value: reps, set: setReps, placeholder: "10", mode: "numeric" as const },
            { label: "セット数", value: sets, set: setSets, placeholder: "3", mode: "numeric" as const },
          ].map(({ label, value, set, placeholder, mode }) => (
            <div key={label}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input
                type="number"
                inputMode={mode}
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => { setShowSuggestions(false); handleAdd(); }}
          disabled={!equipment.trim() || !weight || !reps}
          className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl disabled:opacity-40 active:bg-orange-700"
        >
          ＋ 追加
        </button>
      </div>

      {/* 記録済み種目 */}
      {session.exercises.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 px-1">記録済み</p>
          {session.exercises.map((e: WorkoutExercise) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-bold text-gray-900">{e.equipment}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-sm text-orange-600 font-bold">{e.weightKg}kg</span>
                  <span className="text-sm text-gray-500">{e.reps}回 × {e.sets}セット</span>
                </div>
              </div>
              <button
                onClick={() => { deleteExercise(sessionId, e.id); onSave(); }}
                className="p-2 text-gray-300 active:text-red-400"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-1">🏋️</p>
          <p className="text-sm">種目を追加してください</p>
        </div>
      )}
    </>
  );
}
