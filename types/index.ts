// ── Today's Tasks ──────────────────────────────────────────
export interface TodayTask {
  id: string;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
}

// ── Future Tasks ────────────────────────────────────────────
export interface FutureTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO timestamp
}

// ── Annual Tasks ─────────────────────────────────────────────
export interface AnnualTask {
  id: string;
  text: string;
  month?: number; // 1-12, optional
  createdAt: string;
}

// ── Workout ──────────────────────────────────────────────────
export interface WorkoutExercise {
  id: string;
  equipment: string; // e.g. "ベンチプレス"
  weightKg: number;
  reps: number;
  sets: number;
}

export interface RunningData {
  distanceKm: number;
  durationSec: number; // 合計秒数
  route?: string;      // コース・ルートメモ
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  type: "strength" | "running"; // 筋トレ or ランニング
  memo?: string;
  // 筋トレ用
  exercises: WorkoutExercise[];
  // ランニング用
  running?: RunningData;
}

// ── Diary ─────────────────────────────────────────────────────
export interface DiaryAnswer {
  question: string;
  answer: string;
}

export interface DiaryEntry {
  id: string;
  date: string;      // YYYY-MM-DD
  answers: DiaryAnswer[];
  createdAt: string;
  updatedAt: string;
}

// ── Travel ───────────────────────────────────────────────────
export interface TravelItem {
  id: string;
  date: string;   // YYYY-MM-DD
  time?: string;  // HH:MM
  activity: string;
  notes?: string;
}

export interface TravelPlan {
  id: string;
  title: string;
  destination?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  items: TravelItem[];
  createdAt: string;
}
