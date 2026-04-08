import type {
  TodayTask,
  FutureTask,
  AnnualTask,
  WorkoutSession,
  WorkoutExercise,
  TravelPlan,
  TravelItem,
  DiaryEntry,
  DiaryAnswer,
} from "@/types";

// ── helpers ────────────────────────────────────────────────
function load<T>(key: string, defaultValue: T[]): T[] {
  if (typeof window === "undefined") return defaultValue;
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try { return JSON.parse(raw) as T[]; } catch { return defaultValue; }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function newId(): string { return crypto.randomUUID(); }

function toDateStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

// ── Today Tasks ────────────────────────────────────────────
const TODAY_KEY = "personal_today_tasks_v1";

export function getTodayTasks(date: string): TodayTask[] {
  return load<TodayTask>(TODAY_KEY, []).filter((t) => t.date === date);
}

export function addTodayTask(text: string, date: string): TodayTask {
  const tasks = load<TodayTask>(TODAY_KEY, []);
  const task: TodayTask = { id: newId(), text, completed: false, date };
  tasks.push(task);
  save(TODAY_KEY, tasks);
  return task;
}

export function toggleTodayTask(id: string): void {
  const tasks = load<TodayTask>(TODAY_KEY, []);
  const t = tasks.find((x) => x.id === id);
  if (t) { t.completed = !t.completed; save(TODAY_KEY, tasks); }
}

export function deleteTodayTask(id: string): void {
  save(TODAY_KEY, load<TodayTask>(TODAY_KEY, []).filter((t) => t.id !== id));
}

export function updateTodayTask(id: string, text: string): void {
  const tasks = load<TodayTask>(TODAY_KEY, []);
  const t = tasks.find((x) => x.id === id);
  if (t) { t.text = text; save(TODAY_KEY, tasks); }
}

// ── Future Tasks ───────────────────────────────────────────
const FUTURE_KEY = "personal_future_tasks_v1";

export function getFutureTasks(): FutureTask[] {
  return load<FutureTask>(FUTURE_KEY, []);
}

export function addFutureTask(text: string): FutureTask {
  const tasks = load<FutureTask>(FUTURE_KEY, []);
  const task: FutureTask = { id: newId(), text, completed: false, createdAt: new Date().toISOString() };
  tasks.push(task);
  save(FUTURE_KEY, tasks);
  return task;
}

export function toggleFutureTask(id: string): void {
  const tasks = load<FutureTask>(FUTURE_KEY, []);
  const t = tasks.find((x) => x.id === id);
  if (t) { t.completed = !t.completed; save(FUTURE_KEY, tasks); }
}

export function deleteFutureTask(id: string): void {
  save(FUTURE_KEY, load<FutureTask>(FUTURE_KEY, []).filter((t) => t.id !== id));
}

export function updateFutureTask(id: string, text: string): void {
  const tasks = load<FutureTask>(FUTURE_KEY, []);
  const t = tasks.find((x) => x.id === id);
  if (t) { t.text = text; save(FUTURE_KEY, tasks); }
}

// ── Annual Tasks ───────────────────────────────────────────
const ANNUAL_KEY = "personal_annual_tasks_v1";

export function getAnnualTasks(): AnnualTask[] {
  const tasks = load<AnnualTask>(ANNUAL_KEY, []);
  return tasks.sort((a, b) => {
    const am = a.month ?? 13;
    const bm = b.month ?? 13;
    return am !== bm ? am - bm : a.createdAt.localeCompare(b.createdAt);
  });
}

export function addAnnualTask(text: string, month?: number): AnnualTask {
  const tasks = load<AnnualTask>(ANNUAL_KEY, []);
  const task: AnnualTask = { id: newId(), text, month, createdAt: new Date().toISOString() };
  tasks.push(task);
  save(ANNUAL_KEY, tasks);
  return task;
}

export function deleteAnnualTask(id: string): void {
  save(ANNUAL_KEY, load<AnnualTask>(ANNUAL_KEY, []).filter((t) => t.id !== id));
}

export function updateAnnualTask(id: string, text: string, month?: number): void {
  const tasks = load<AnnualTask>(ANNUAL_KEY, []);
  const t = tasks.find((x) => x.id === id);
  if (t) { t.text = text; t.month = month; save(ANNUAL_KEY, tasks); }
}

// ── Workout Sessions ───────────────────────────────────────
const WORKOUT_KEY = "personal_workout_sessions_v1";

export function getWorkoutSessions(): WorkoutSession[] {
  return load<WorkoutSession>(WORKOUT_KEY, []).sort(
    (a, b) => b.date.localeCompare(a.date)
  );
}

export function getWorkoutSession(id: string): WorkoutSession | null {
  return load<WorkoutSession>(WORKOUT_KEY, []).find((s) => s.id === id) ?? null;
}

export function createWorkoutSession(date?: string): WorkoutSession {
  const sessions = load<WorkoutSession>(WORKOUT_KEY, []);
  const session: WorkoutSession = {
    id: newId(),
    date: date ?? toDateStr(),
    exercises: [],
  };
  sessions.push(session);
  save(WORKOUT_KEY, sessions);
  return session;
}

export function addExercise(
  sessionId: string,
  data: Omit<WorkoutExercise, "id">
): void {
  const sessions = load<WorkoutSession>(WORKOUT_KEY, []);
  const s = sessions.find((x) => x.id === sessionId);
  if (s) {
    s.exercises.push({ id: newId(), ...data });
    save(WORKOUT_KEY, sessions);
  }
}

export function updateExercise(
  sessionId: string,
  exerciseId: string,
  data: Omit<WorkoutExercise, "id">
): void {
  const sessions = load<WorkoutSession>(WORKOUT_KEY, []);
  const s = sessions.find((x) => x.id === sessionId);
  if (s) {
    const e = s.exercises.find((x) => x.id === exerciseId);
    if (e) { Object.assign(e, data); save(WORKOUT_KEY, sessions); }
  }
}

export function deleteExercise(sessionId: string, exerciseId: string): void {
  const sessions = load<WorkoutSession>(WORKOUT_KEY, []);
  const s = sessions.find((x) => x.id === sessionId);
  if (s) {
    s.exercises = s.exercises.filter((e) => e.id !== exerciseId);
    save(WORKOUT_KEY, sessions);
  }
}

export function updateWorkoutSession(id: string, patch: Partial<Pick<WorkoutSession, "date" | "memo">>): void {
  const sessions = load<WorkoutSession>(WORKOUT_KEY, []);
  const s = sessions.find((x) => x.id === id);
  if (s) { Object.assign(s, patch); save(WORKOUT_KEY, sessions); }
}

export function deleteWorkoutSession(id: string): void {
  save(WORKOUT_KEY, load<WorkoutSession>(WORKOUT_KEY, []).filter((s) => s.id !== id));
}

// commonly used equipment names (for suggestions)
export function getEquipmentHistory(): string[] {
  const sessions = load<WorkoutSession>(WORKOUT_KEY, []);
  const seen = new Set<string>();
  sessions.forEach((s) => s.exercises.forEach((e) => seen.add(e.equipment)));
  return Array.from(seen);
}

// ── Travel Plans ───────────────────────────────────────────
const TRAVEL_KEY = "personal_travel_plans_v1";

export function getTravelPlans(): TravelPlan[] {
  return load<TravelPlan>(TRAVEL_KEY, []).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );
}

export function getTravelPlan(id: string): TravelPlan | null {
  return load<TravelPlan>(TRAVEL_KEY, []).find((p) => p.id === id) ?? null;
}

export function createTravelPlan(
  data: Omit<TravelPlan, "id" | "items" | "createdAt">
): TravelPlan {
  const plans = load<TravelPlan>(TRAVEL_KEY, []);
  const plan: TravelPlan = {
    ...data,
    id: newId(),
    items: [],
    createdAt: new Date().toISOString(),
  };
  plans.push(plan);
  save(TRAVEL_KEY, plans);
  return plan;
}

export function updateTravelPlan(
  id: string,
  patch: Partial<Omit<TravelPlan, "id" | "items" | "createdAt">>
): void {
  const plans = load<TravelPlan>(TRAVEL_KEY, []);
  const p = plans.find((x) => x.id === id);
  if (p) { Object.assign(p, patch); save(TRAVEL_KEY, plans); }
}

export function deleteTravelPlan(id: string): void {
  save(TRAVEL_KEY, load<TravelPlan>(TRAVEL_KEY, []).filter((p) => p.id !== id));
}

export function addTravelItem(
  planId: string,
  data: Omit<TravelItem, "id">
): void {
  const plans = load<TravelPlan>(TRAVEL_KEY, []);
  const p = plans.find((x) => x.id === planId);
  if (p) {
    p.items.push({ id: newId(), ...data });
    p.items.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.time ?? "").localeCompare(b.time ?? "");
    });
    save(TRAVEL_KEY, plans);
  }
}

export function deleteTravelItem(planId: string, itemId: string): void {
  const plans = load<TravelPlan>(TRAVEL_KEY, []);
  const p = plans.find((x) => x.id === planId);
  if (p) {
    p.items = p.items.filter((i) => i.id !== itemId);
    save(TRAVEL_KEY, plans);
  }
}

export function updateTravelItem(
  planId: string,
  itemId: string,
  data: Omit<TravelItem, "id">
): void {
  const plans = load<TravelPlan>(TRAVEL_KEY, []);
  const p = plans.find((x) => x.id === planId);
  if (p) {
    const item = p.items.find((i) => i.id === itemId);
    if (item) {
      Object.assign(item, data);
      p.items.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.time ?? "").localeCompare(b.time ?? "");
      });
      save(TRAVEL_KEY, plans);
    }
  }
}

// ── Diary ─────────────────────────────────────────────────────
const DIARY_KEY = "personal_diary_entries_v1";

export function getDiaryEntries(): DiaryEntry[] {
  return load<DiaryEntry>(DIARY_KEY, []).sort(
    (a, b) => b.date.localeCompare(a.date)
  );
}

export function getDiaryEntry(date: string): DiaryEntry | null {
  return load<DiaryEntry>(DIARY_KEY, []).find((e) => e.date === date) ?? null;
}

export function saveDiaryEntry(date: string, answers: DiaryAnswer[]): DiaryEntry {
  const entries = load<DiaryEntry>(DIARY_KEY, []);
  const now = new Date().toISOString();
  const existing = entries.find((e) => e.date === date);
  if (existing) {
    existing.answers = answers;
    existing.updatedAt = now;
    save(DIARY_KEY, entries);
    return existing;
  }
  const entry: DiaryEntry = {
    id: newId(),
    date,
    answers,
    createdAt: now,
    updatedAt: now,
  };
  entries.push(entry);
  save(DIARY_KEY, entries);
  return entry;
}

export function deleteDiaryEntry(date: string): void {
  save(DIARY_KEY, load<DiaryEntry>(DIARY_KEY, []).filter((e) => e.date !== date));
}
