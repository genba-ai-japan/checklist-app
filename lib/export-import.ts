import { Goal, RoutineItem, ImprovementItem, GanttTask } from "@/types";
import { loadGoals, saveGoals, loadRoutine, saveRoutine, loadImprovements, saveImprovements, loadGanttTasks, saveGanttTasks } from "@/lib/dashboard-storage";

// ─── CSV ユーティリティ ────────────────────────────────────────────────────────
function escapeCell(v: unknown): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(headers: string[], rows: string[][]): string {
  const bom = "\uFEFF"; // Excel用BOM（UTF-8）
  const lines = [headers.map(escapeCell).join(","), ...rows.map((r) => r.map(escapeCell).join(","))];
  return bom + lines.join("\r\n");
}

function parseCSV(text: string): string[][] {
  // BOM除去
  const raw = text.replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuote = !inQuote; }
      } else if (ch === "," && !inQuote) {
        result.push(current); current = "";
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  });
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── 目標管理 ─────────────────────────────────────────────────────────────────
const GOAL_HEADERS = ["No", "優先", "カテゴリ", "目標・施策", "具体的アクション", "KPI・指標", "期限", "ステータス", "結果コメント"];
const STATUS_MAP: Record<string, string> = { not_started: "未着手", in_progress: "進行中", completed: "完了" };
const STATUS_MAP_R: Record<string, string> = { "未着手": "not_started", "進行中": "in_progress", "完了": "completed" };

export function exportGoals(): void {
  const goals = loadGoals();
  const rows = goals.map((g) => [String(g.no), g.priority, g.category, g.objective, g.specificActions, g.kpi, g.deadline, STATUS_MAP[g.status] ?? g.status, g.resultComment]);
  downloadCSV(toCSV(GOAL_HEADERS, rows), "goals_2026.csv");
}

export function importGoals(text: string): { count: number; errors: string[] } {
  const parsed = parseCSV(text);
  if (parsed.length < 2) return { count: 0, errors: ["データが空です"] };
  const header = parsed[0];
  const noIdx = header.indexOf("No"), catIdx = header.indexOf("カテゴリ"), objIdx = header.indexOf("目標・施策");
  if (objIdx === -1) return { count: 0, errors: ["「目標・施策」列が見つかりません"] };
  const existing = loadGoals();
  const errors: string[] = [];
  let count = 0;
  parsed.slice(1).forEach((row, i) => {
    const obj = row[objIdx]?.trim();
    if (!obj) return;
    const no = parseInt(row[noIdx] ?? "0") || existing.length + count + 1;
    const status = STATUS_MAP_R[row[header.indexOf("ステータス")] ?? ""] ?? "not_started";
    const goal: Goal = {
      id: crypto.randomUUID(), no,
      priority: (row[header.indexOf("優先")] as Goal["priority"]) || "○",
      category: row[catIdx] ?? "その他",
      objective: obj,
      specificActions: row[header.indexOf("具体的アクション")] ?? "",
      kpi: row[header.indexOf("KPI・指標")] ?? "",
      deadline: row[header.indexOf("期限")] ?? "",
      status: status as Goal["status"],
      resultComment: row[header.indexOf("結果コメント")] ?? "",
    };
    // 同じ目標名があれば更新、なければ追加
    const existIdx = existing.findIndex((g) => g.objective === obj);
    if (existIdx >= 0) { existing[existIdx] = { ...existing[existIdx], ...goal, id: existing[existIdx].id }; }
    else { existing.push(goal); }
    count++;
    void i;
  });
  saveGoals(existing);
  return { count, errors };
}

// ─── 改善台帳 ─────────────────────────────────────────────────────────────────
const IMP_HEADERS = ["No", "提案日", "問題・課題", "改善内容", "アクション", "期待効果", "担当者", "期限", "状態", "効果確認"];

export function exportImprovements(): void {
  const items = loadImprovements();
  const rows = items.map((i) => [String(i.no), i.proposalDate, i.problem, i.improvementContent, i.action, i.expectedEffect, i.person, i.deadline, i.status, i.effectConfirmation]);
  downloadCSV(toCSV(IMP_HEADERS, rows), "improvements_2026.csv");
}

export function importImprovements(text: string): { count: number; errors: string[] } {
  const parsed = parseCSV(text);
  if (parsed.length < 2) return { count: 0, errors: ["データが空です"] };
  const header = parsed[0];
  const contIdx = header.indexOf("改善内容");
  if (contIdx === -1) return { count: 0, errors: ["「改善内容」列が見つかりません"] };
  const existing = loadImprovements();
  let count = 0;
  parsed.slice(1).forEach((row) => {
    const content = row[contIdx]?.trim();
    if (!content) return;
    const maxNo = existing.reduce((m, i) => Math.max(m, i.no), 0);
    const item: ImprovementItem = {
      id: crypto.randomUUID(),
      no: parseInt(row[header.indexOf("No")] ?? "0") || maxNo + 1,
      proposalDate: row[header.indexOf("提案日")] ?? "",
      problem: row[header.indexOf("問題・課題")] ?? "",
      improvementContent: content,
      action: row[header.indexOf("アクション")] ?? "",
      expectedEffect: row[header.indexOf("期待効果")] ?? "",
      person: row[header.indexOf("担当者")] ?? "",
      deadline: row[header.indexOf("期限")] ?? "",
      status: (row[header.indexOf("状態")] as ImprovementItem["status"]) || "未着手",
      effectConfirmation: row[header.indexOf("効果確認")] ?? "",
    };
    const existIdx = existing.findIndex((i) => i.improvementContent === content);
    if (existIdx >= 0) { existing[existIdx] = { ...existing[existIdx], ...item, id: existing[existIdx].id }; }
    else { existing.push(item); }
    count++;
  });
  saveImprovements(existing);
  return { count, errors: [] };
}

// ─── ルーティン ───────────────────────────────────────────────────────────────
const RTN_HEADERS = ["頻度・タイミング", "業務項目", "所要時間", "コメント"];

export function exportRoutine(): void {
  const items = loadRoutine();
  const rows = items.map((i) => [i.frequency, i.task, i.requiredTime, i.comment]);
  downloadCSV(toCSV(RTN_HEADERS, rows), "routine_2026.csv");
}

export function importRoutine(text: string): { count: number; errors: string[] } {
  const parsed = parseCSV(text);
  if (parsed.length < 2) return { count: 0, errors: ["データが空です"] };
  const header = parsed[0];
  const taskIdx = header.indexOf("業務項目");
  if (taskIdx === -1) return { count: 0, errors: ["「業務項目」列が見つかりません"] };
  const existing = loadRoutine();
  let count = 0;
  parsed.slice(1).forEach((row) => {
    const task = row[taskIdx]?.trim();
    if (!task) return;
    const item: RoutineItem = {
      id: crypto.randomUUID(),
      frequency: row[header.indexOf("頻度・タイミング")] ?? "毎週",
      task,
      requiredTime: row[header.indexOf("所要時間")] ?? "",
      comment: row[header.indexOf("コメント")] ?? "",
      checkedDates: [],
    };
    const existIdx = existing.findIndex((i) => i.task === task);
    if (existIdx >= 0) { existing[existIdx] = { ...existing[existIdx], frequency: item.frequency, task: item.task, requiredTime: item.requiredTime, comment: item.comment }; }
    else { existing.push(item); }
    count++;
  });
  saveRoutine(existing);
  return { count, errors: [] };
}

// ─── ガントタスク ─────────────────────────────────────────────────────────────
const GANTT_HEADERS = ["番号", "優先", "カテゴリ", "タスク名", "具体的取り組み", "期限", "開始週", "終了週"];

export function exportGantt(): void {
  const tasks = loadGanttTasks();
  const rows = tasks.map((t) => [t.no, t.priority, t.category, t.taskName, t.specificApproach, t.deadline, String(t.startWeek), String(t.endWeek)]);
  downloadCSV(toCSV(GANTT_HEADERS, rows), "gantt_2026.csv");
}

export function importGantt(text: string): { count: number; errors: string[] } {
  const parsed = parseCSV(text);
  if (parsed.length < 2) return { count: 0, errors: ["データが空です"] };
  const header = parsed[0];
  const nameIdx = header.indexOf("タスク名");
  if (nameIdx === -1) return { count: 0, errors: ["「タスク名」列が見つかりません"] };
  const existing = loadGanttTasks();
  let count = 0;
  parsed.slice(1).forEach((row) => {
    const name = row[nameIdx]?.trim();
    if (!name) return;
    const task: GanttTask = {
      id: crypto.randomUUID(),
      no: row[header.indexOf("番号")] ?? "",
      priority: (row[header.indexOf("優先")] as GanttTask["priority"]) || "○",
      category: row[header.indexOf("カテゴリ")] ?? "A. 製造管理業務",
      taskName: name,
      specificApproach: row[header.indexOf("具体的取り組み")] ?? "",
      deadline: row[header.indexOf("期限")] ?? "",
      startWeek: parseInt(row[header.indexOf("開始週")] ?? "1") || 1,
      endWeek: parseInt(row[header.indexOf("終了週")] ?? "4") || 4,
      color: "#6b7280",
    };
    const existIdx = existing.findIndex((t) => t.taskName === name);
    if (existIdx >= 0) { existing[existIdx] = { ...existing[existIdx], ...task, id: existing[existIdx].id }; }
    else { existing.push(task); }
    count++;
  });
  saveGanttTasks(existing);
  return { count, errors: [] };
}
