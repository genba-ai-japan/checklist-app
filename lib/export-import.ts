import { Goal, RoutineItem, ImprovementItem, GanttTask } from "@/types";
import { loadGoals, saveGoals, loadRoutine, saveRoutine, loadImprovements, saveImprovements, loadGanttTasks, saveGanttTasks } from "@/lib/dashboard-storage";

// ─── ドキュメント書き出し共通 ─────────────────────────────────────────────────
function downloadDoc(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function docWrap(title: string, body: string): string {
  const d = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
body{font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;max-width:900px;margin:0 auto;padding:24px 16px;color:#111827;background:#fff}
h1{font-size:20px;font-weight:700;color:#1d4ed8;border-bottom:2px solid #dbeafe;padding-bottom:10px;margin-bottom:4px}
.meta{font-size:12px;color:#6b7280;margin-bottom:24px}
h2{font-size:14px;font-weight:700;color:#374151;margin:28px 0 8px;padding-left:10px;border-left:4px solid #3b82f6}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
th{background:#eff6ff;color:#1d4ed8;text-align:left;padding:8px 10px;border:1px solid #dbeafe;font-size:12px;font-weight:700}
td{padding:8px 10px;border:1px solid #e5e7eb;vertical-align:top;word-break:break-all}
tr:nth-child(even) td{background:#f9fafb}
.tag{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap}
.r{background:#fee2e2;color:#b91c1c}.b{background:#dbeafe;color:#1d4ed8}.g{background:#dcfce7;color:#15803d}.gr{background:#f3f4f6;color:#6b7280}
footer{margin-top:40px;font-size:11px;color:#d1d5db;text-align:center;border-top:1px solid #f3f4f6;padding-top:16px}
</style></head><body>
<h1>${title}</h1><p class="meta">書き出し日: ${d}　2026年度 業務ダッシュボード</p>
${body}
<footer>2026年度 業務ダッシュボード</footer></body></html>`;
}

// ─── CSV 取り込みユーティリティ ───────────────────────────────────────────────
function parseCSV(text: string): string[][] {
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

// ─── 共通定数 ─────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, string> = { not_started: "未着手", in_progress: "進行中", completed: "完了" };
const STATUS_MAP_R: Record<string, string> = { "未着手": "not_started", "進行中": "in_progress", "完了": "completed" };
const PRI_LABEL: Record<string, string> = { "◎": "最優先", "○": "通常", "△": "低" };
const PRI_CLS: Record<string, string> = { "◎": "r", "○": "b", "△": "gr" };
const ST_CLS: Record<string, string> = { not_started: "gr", in_progress: "b", completed: "g" };

// ─── 目標管理 書き出し（HTMLドキュメント） ─────────────────────────────────────
export function exportGoals(): void {
  const goals = loadGoals();
  const rows = goals.map((g) => `<tr>
    <td><span class="tag ${PRI_CLS[g.priority]}">${PRI_LABEL[g.priority] ?? g.priority}</span></td>
    <td>${g.category}</td>
    <td style="font-weight:600">${g.objective}</td>
    <td>${g.specificActions}</td>
    <td>${g.kpi}</td>
    <td>${g.deadline}</td>
    <td><span class="tag ${ST_CLS[g.status]}">${STATUS_MAP[g.status] ?? g.status}</span></td>
    <td>${g.resultComment}</td>
  </tr>`).join("");
  const body = `<table><tr><th>優先</th><th>カテゴリ</th><th>目標・施策</th><th>具体的アクション</th><th>KPI・指標</th><th>期限</th><th>状態</th><th>結果コメント</th></tr>${rows}</table>`;
  downloadDoc(docWrap("目標管理 2026年度", body), "goals_2026.html");
}

// ─── 目標管理 取り込み（CSV） ──────────────────────────────────────────────────
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
    const existIdx = existing.findIndex((g) => g.objective === obj);
    if (existIdx >= 0) { existing[existIdx] = { ...existing[existIdx], ...goal, id: existing[existIdx].id }; }
    else { existing.push(goal); }
    count++;
    void i;
  });
  saveGoals(existing);
  return { count, errors };
}

// ─── 改善台帳 書き出し（HTMLドキュメント） ─────────────────────────────────────
const IMP_ST_CLS: Record<string, string> = { "未着手": "gr", "進行中": "b", "完了": "g" };

export function exportImprovements(): void {
  const items = loadImprovements();
  const rows = items.map((i) => `<tr>
    <td style="text-align:center;font-weight:700;color:#6b7280">${i.no}</td>
    <td>${i.proposalDate}</td>
    <td>${i.problem}</td>
    <td style="font-weight:600">${i.improvementContent}</td>
    <td>${i.action}</td>
    <td>${i.expectedEffect}</td>
    <td>${i.person}</td>
    <td>${i.deadline}</td>
    <td><span class="tag ${IMP_ST_CLS[i.status] ?? "gr"}">${i.status}</span></td>
    <td>${i.effectConfirmation}</td>
  </tr>`).join("");
  const body = `<table><tr><th>No</th><th>提案日</th><th>問題・課題</th><th>改善内容</th><th>アクション</th><th>期待効果</th><th>担当者</th><th>期限</th><th>状態</th><th>効果確認</th></tr>${rows}</table>`;
  downloadDoc(docWrap("改善台帳 2026年度", body), "improvements_2026.html");
}

// ─── 改善台帳 取り込み（CSV） ──────────────────────────────────────────────────
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

// ─── ルーティン 書き出し（HTMLドキュメント） ───────────────────────────────────
export function exportRoutine(): void {
  const items = loadRoutine();
  const freqGroups: Record<string, RoutineItem[]> = {};
  items.forEach((i) => { (freqGroups[i.frequency] ??= []).push(i); });
  const sections = Object.entries(freqGroups).map(([freq, list]) => {
    const rows = list.map((i) => `<tr>
      <td style="font-weight:600">${i.task}</td>
      <td>${i.requiredTime}</td>
      <td>${i.comment}</td>
    </tr>`).join("");
    return `<h2>${freq}</h2><table><tr><th>業務項目</th><th>所要時間</th><th>コメント</th></tr>${rows}</table>`;
  }).join("");
  downloadDoc(docWrap("ルーティン 2026年度", sections), "routine_2026.html");
}

// ─── ルーティン 取り込み（CSV） ────────────────────────────────────────────────
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

// ─── ガントチャート 書き出し（HTMLドキュメント） ──────────────────────────────
function serializePeriods(periods: GanttTask["periods"]): string {
  if (!periods?.length) return "1-4";
  return periods.map((p) => `W${p.startWeek}〜W${p.endWeek}`).join(" / ");
}

function parsePeriods(raw: string): GanttTask["periods"] {
  const parts = raw.split(/[,/]+/).map((s) => s.trim()).filter(Boolean);
  const result: GanttTask["periods"] = [];
  for (const part of parts) {
    const m = part.match(/(\d+)\s*[-~〜]\s*(\d+)/);
    if (m) result.push({ startWeek: parseInt(m[1]), endWeek: parseInt(m[2]) });
    else {
      const n = parseInt(part);
      if (!isNaN(n)) result.push({ startWeek: n, endWeek: n });
    }
  }
  return result.length ? result : [{ startWeek: 1, endWeek: 4 }];
}

export function exportGantt(): void {
  const tasks = loadGanttTasks();
  const catGroups: Record<string, GanttTask[]> = {};
  tasks.forEach((t) => { (catGroups[t.category] ??= []).push(t); });
  const sections = Object.entries(catGroups).map(([cat, list]) => {
    const rows = list.map((t) => `<tr>
      <td><span class="tag ${PRI_CLS[t.priority]}">${PRI_LABEL[t.priority] ?? t.priority}</span></td>
      <td style="font-weight:600">${t.taskName}</td>
      <td>${t.specificApproach}</td>
      <td>${t.deadline}</td>
      <td>${serializePeriods(t.periods)}</td>
    </tr>`).join("");
    return `<h2>${cat}</h2><table><tr><th>優先</th><th>タスク名</th><th>具体的取り組み</th><th>期限</th><th>期間</th></tr>${rows}</table>`;
  }).join("");
  downloadDoc(docWrap("年間計画 ガントチャート 2026年度", sections), "gantt_2026.html");
}

// ─── ガントチャート 取り込み（CSV） ───────────────────────────────────────────
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
    const periodColIdx = header.indexOf("期間（開始週-終了週）");
    let periods: GanttTask["periods"];
    if (periodColIdx >= 0 && row[periodColIdx]) {
      periods = parsePeriods(row[periodColIdx]);
    } else {
      const startWeek = parseInt(row[header.indexOf("開始週")] ?? "1") || 1;
      const endWeek = parseInt(row[header.indexOf("終了週")] ?? "4") || 4;
      periods = [{ startWeek, endWeek }];
    }
    const task: GanttTask = {
      id: crypto.randomUUID(),
      no: row[header.indexOf("番号")] ?? "",
      priority: (row[header.indexOf("優先")] as GanttTask["priority"]) || "○",
      category: row[header.indexOf("カテゴリ")] ?? "製造管理",
      taskName: name,
      specificApproach: row[header.indexOf("具体的取り組み")] ?? "",
      deadline: row[header.indexOf("期限")] ?? "",
      periods,
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
