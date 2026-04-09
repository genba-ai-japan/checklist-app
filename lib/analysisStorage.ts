import { Improvement, ProcessStep } from "@/types";

const IMPROVEMENTS_KEY = "factory_improvements_v1";

export const PROCESS_STEPS: ProcessStep[] = [
  { id: "step-1", name: "原料受入",    icon: "🚛", order: 1 },
  { id: "step-2", name: "計量・配合",  icon: "⚖️", order: 2 },
  { id: "step-3", name: "製造・加工",  icon: "🔧", order: 3 },
  { id: "step-4", name: "充填",        icon: "🫙", order: 4 },
  { id: "step-5", name: "密封・シール", icon: "🔒", order: 5 },
  { id: "step-6", name: "検査",        icon: "🔍", order: 6 },
  { id: "step-7", name: "包装・箱詰め", icon: "📦", order: 7 },
  { id: "step-8", name: "保管・出荷",  icon: "🏭", order: 8 },
];

function loadAll(): Improvement[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(IMPROVEMENTS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Improvement[];
}

function saveAll(improvements: Improvement[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(IMPROVEMENTS_KEY, JSON.stringify(improvements));
}

export function getAllImprovements(): Improvement[] {
  return loadAll();
}

export function getImprovementsByStep(stepId: string): Improvement[] {
  return loadAll().filter((i) => i.stepId === stepId);
}

export function getImprovement(id: string): Improvement | null {
  return loadAll().find((i) => i.id === id) ?? null;
}

export function createImprovement(
  data: Omit<Improvement, "id" | "createdAt">
): Improvement {
  const all = loadAll();
  const improvement: Improvement = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  all.push(improvement);
  saveAll(all);
  return improvement;
}

export function updateImprovement(improvement: Improvement): void {
  const all = loadAll();
  const idx = all.findIndex((i) => i.id === improvement.id);
  if (idx >= 0) {
    all[idx] = improvement;
    saveAll(all);
  }
}

export function deleteImprovement(id: string): void {
  saveAll(loadAll().filter((i) => i.id !== id));
}
