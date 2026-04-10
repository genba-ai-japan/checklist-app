import { Improvement, ProcessStep } from "@/types";

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

export async function getAllImprovements(): Promise<{ items: Improvement[]; lastModified: string }> {
  const res = await fetch("/api/improvements", { cache: "no-store" });
  return res.json();
}

export async function getImprovement(id: string): Promise<Improvement | null> {
  const res = await fetch(`/api/improvements/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function createImprovement(
  data: Omit<Improvement, "id" | "createdAt">
): Promise<Improvement> {
  const res = await fetch("/api/improvements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateImprovement(improvement: Improvement): Promise<void> {
  await fetch(`/api/improvements/${improvement.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(improvement),
  });
}

export async function deleteImprovement(id: string): Promise<void> {
  await fetch(`/api/improvements/${id}`, { method: "DELETE" });
}

export async function getLastModified(): Promise<string> {
  const res = await fetch("/api/improvements/meta", { cache: "no-store" });
  const data = await res.json();
  return data.lastModified;
}
