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
  getPrevSessionOfType,
  bulkCopyExercises,
} from "@/lib/storage";
import type { WorkoutSession, WorkoutExercise, RunningData } from "@/types";

// ── 筋トレ プリセット ─────────────────────────────────────────
const PRESET_EQUIPMENT = [
  "ベンチプレス", "スクワット", "デッドリフト", "ショルダープレス",
  "ラットプルダウン", "ロウプレス", "ダンベルカール", "トライセプス",
  "レッグプレス", "チェストフライ", "懸垂", "腹筋ローラー",
];

// 重量：5刻み 5〜150kg
const WEIGHT_OPTIONS = Array.from({ length: 30 }, (_, i) => (i + 1) * 5);
// 回数：5刻み 5〜50
const REPS_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 5);
// セット数：1〜10
const SETS_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

// ── ユーティリティ ────────────────────────────────────────────
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

function fmtShortDate(d: string): string {
  return new Date(d).toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" });
}

// ── メインページ ──────────────────────────────────────────────
export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [prev, setPrev] = useState<WorkoutSession | null>(null);
  const [memo, setMemo] = useState("");

  const load = () => {
    const s = getWorkoutSession(id);
    setSession(s);
    if (s) {
      setMemo(s.memo ?? "");
      setPrev(getPrevSessionOfType(id, s.type));
    }
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
            <div className="flex items-center gap-2 flex-wrap">
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
            prev={prev}
            onSave={() => load()}
          />
        ) : (
          <StrengthForm
            sessionId={id}
            session={session}
            prev={prev}
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

// ── 💪 筋トレフォーム ────────────────────────────────────────
function StrengthForm({
  sessionId,
  session,
  prev,
  onSave,
}: {
  sessionId: string;
  session: WorkoutSession;
  prev: WorkoutSession | null;
  onSave: () => void;
}) {
  const [equipment, setEquipment] = useState("");
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [sets, setSets] = useState<string>("3");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [traced, setTraced] = useState(false);

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
    setShowSuggestions(false);
    onSave();
  };

  const handleTrace = () => {
    if (!prev || prev.exercises.length === 0) return;
    bulkCopyExercises(sessionId, prev.exercises);
    setTraced(true);
    onSave();
  };

  const filtered = equipment
    ? suggestions.filter((s) => s.includes(equipment))
    : suggestions;

  // 前回の種目ごとの重量・回数（ヒント表示用）
  const prevMap = new Map<string, WorkoutExercise>(
    (prev?.exercises ?? []).map((e) => [e.equipment, e])
  );

  return (
    <>
      {/* ── なぞるバナー ── */}
      {prev && !traced && session.exercises.length === 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 text-lg">🔁</span>
            <div>
              <p className="font-bold text-orange-800 text-sm">前回のトレーニングをなぞりますか？</p>
              <p className="text-xs text-orange-400">{fmtShortDate(prev.date)} · {prev.exercises.length}種目</p>
            </div>
          </div>
          {/* 前回の種目一覧（プレビュー） */}
          <div className="space-y-1">
            {prev.exercises.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-sm text-orange-700">
                <span className="text-orange-300">•</span>
                <span className="font-medium">{e.equipment}</span>
                <span className="text-orange-400">{e.weightKg}kg × {e.reps}回 × {e.sets}セット</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleTrace}
            className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl active:bg-orange-700 text-sm"
          >
            🔁 前回と同じ内容でなぞる
          </button>
        </div>
      )}

      {/* なぞり済み通知 */}
      {traced && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <p className="text-sm text-green-700 font-medium">前回の内容をコピーしました。必要に応じて編集できます。</p>
        </div>
      )}

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
          {/* 前回のヒント */}
          {equipment && prevMap.has(equipment) && (
            <p className="text-xs text-orange-400 mt-1 px-1">
              前回: {prevMap.get(equipment)!.weightKg}kg × {prevMap.get(equipment)!.reps}回 × {prevMap.get(equipment)!.sets}セット
            </p>
          )}
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-44 overflow-y-auto">
              {filtered.map((s) => (
                <button
                  key={s}
                  onMouseDown={() => {
                    setEquipment(s);
                    setShowSuggestions(false);
                    // 前回の値を自動セット
                    const p = prevMap.get(s);
                    if (p) {
                      setWeight(String(p.weightKg));
                      setReps(String(p.reps));
                      setSets(String(p.sets));
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-base text-gray-800 active:bg-orange-50 border-b border-gray-100 last:border-0"
                >
                  <span>{s}</span>
                  {prevMap.has(s) && (
                    <span className="ml-2 text-xs text-orange-400">
                      前回 {prevMap.get(s)!.weightKg}kg
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 重量・回数・セット プルダウン */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">重量 (kg)</label>
            <select
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-2 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">-</option>
              {WEIGHT_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">回数</label>
            <select
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full px-2 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">-</option>
              {REPS_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">セット数</label>
            <select
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              className="w-full px-2 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {SETS_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAdd}
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
          {session.exercises.map((e: WorkoutExercise) => {
            const p = prevMap.get(e.equipment);
            return (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{e.equipment}</p>
                  <div className="flex gap-3 mt-0.5 items-baseline">
                    <span className="text-sm text-orange-600 font-bold">{e.weightKg}kg</span>
                    <span className="text-sm text-gray-500">{e.reps}回 × {e.sets}セット</span>
                  </div>
                  {/* 前回比較 */}
                  {p && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      前回: {p.weightKg}kg × {p.reps}回 × {p.sets}セット
                      {e.weightKg > p.weightKg && <span className="text-green-500 ml-1">↑</span>}
                      {e.weightKg < p.weightKg && <span className="text-red-400 ml-1">↓</span>}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { deleteExercise(sessionId, e.id); onSave(); }}
                  className="p-2 text-gray-300 active:text-red-400 flex-shrink-0"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        !prev && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-1">🏋️</p>
            <p className="text-sm">種目を追加してください</p>
          </div>
        )
      )}
    </>
  );
}

// ── 🏃 ランニングフォーム ────────────────────────────────────────
function RunningForm({
  sessionId,
  existing,
  prev,
  onSave,
}: {
  sessionId: string;
  existing?: RunningData;
  prev: WorkoutSession | null;
  onSave: () => void;
}) {
  const prevRun = prev?.running;

  const [distStr, setDistStr] = useState(existing ? String(existing.distanceKm) : "");
  const [hours, setHours] = useState(existing ? String(Math.floor(existing.durationSec / 3600)) : "0");
  const [mins, setMins] = useState(existing ? String(Math.floor((existing.durationSec % 3600) / 60)) : "");
  const [secs, setSecs] = useState(existing ? String(existing.durationSec % 60) : "0");
  const [route, setRoute] = useState(existing?.route ?? "");
  const [saved, setSaved] = useState(!!existing);

  const handleFillPrev = () => {
    if (!prevRun) return;
    setDistStr(String(prevRun.distanceKm));
    setRoute(prevRun.route ?? "");
    setSaved(false);
  };

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
    <div className="space-y-4">
      {/* 前回のランニング参照 */}
      {prevRun && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sky-500 text-lg">🔁</span>
              <div>
                <p className="font-bold text-sky-800 text-sm">前回のランニング</p>
                <p className="text-xs text-sky-400">{fmtShortDate(prev!.date)}</p>
              </div>
            </div>
            <button
              onClick={handleFillPrev}
              className="text-xs bg-sky-500 text-white px-3 py-1.5 rounded-full font-bold active:bg-sky-700"
            >
              距離・コースをコピー
            </button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="font-bold text-sky-700">{prevRun.distanceKm} km</span>
            <span className="text-sky-500">{fmtDuration(prevRun.durationSec)}</span>
            <span className="text-sky-400">{calcPace(prevRun.distanceKm, prevRun.durationSec)}</span>
          </div>
          {prevRun.route && <p className="text-xs text-sky-400">{prevRun.route}</p>}
        </div>
      )}

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
            {[
              { label: "時間", value: hours, set: setHours, placeholder: "0" },
              { label: "分", value: mins, set: setMins, placeholder: "30" },
              { label: "秒", value: secs, set: setSecs, placeholder: "0" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label} className="text-center">
                <input
                  type="number"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => { set(e.target.value); setSaved(false); }}
                  placeholder={placeholder}
                  min="0"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-base text-center focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ペース表示 */}
        {canSave && (
          <div className="bg-sky-50 rounded-xl px-4 py-3 grid grid-cols-3 divide-x divide-sky-200">
            {[
              { label: "距離", value: `${distKm} km` },
              { label: "タイム", value: fmtDuration(totalSec) },
              { label: "ペース", value: pace },
            ].map(({ label, value }) => (
              <div key={label} className="text-center px-2">
                <p className="text-xs text-sky-400">{label}</p>
                <p className="text-sm font-bold text-sky-700 mt-0.5">{value}</p>
              </div>
            ))}
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
    </div>
  );
}
