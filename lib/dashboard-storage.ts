import { Goal, RoutineItem, ImprovementItem, GanttTask } from "@/types";
import { getCurrentAccountId } from "@/lib/session";

function k(base: string) {
  return `${base}_${getCurrentAccountId()}`;
}

// ─── Goals ────────────────────────────────────────────────────────────────────
const G = "dashboard_goals_v1";

export function loadGoals(): Goal[] {
  if (typeof window === "undefined") return getDefaultGoals();
  const raw = localStorage.getItem(k(G));
  if (!raw) { const d = getDefaultGoals(); localStorage.setItem(k(G), JSON.stringify(d)); return d; }
  return JSON.parse(raw) as Goal[];
}
export function saveGoals(goals: Goal[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(k(G), JSON.stringify(goals));
}
export function addGoal(data: Omit<Goal, "id">): Goal {
  const goals = loadGoals();
  const maxNo = goals.reduce((m, g) => Math.max(m, g.no), 0);
  const newGoal: Goal = { ...data, id: crypto.randomUUID(), no: maxNo + 1 };
  saveGoals([...goals, newGoal]);
  return newGoal;
}
export function updateGoal(updated: Goal): void {
  saveGoals(loadGoals().map((g) => (g.id === updated.id ? updated : g)));
}
export function deleteGoal(id: string): void {
  saveGoals(loadGoals().filter((g) => g.id !== id));
}

// ─── Routine ──────────────────────────────────────────────────────────────────
const R = "dashboard_routine_v1";

export function loadRoutine(): RoutineItem[] {
  if (typeof window === "undefined") return getDefaultRoutine();
  const raw = localStorage.getItem(k(R));
  if (!raw) { const d = getDefaultRoutine(); localStorage.setItem(k(R), JSON.stringify(d)); return d; }
  return JSON.parse(raw) as RoutineItem[];
}
export function saveRoutine(items: RoutineItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(k(R), JSON.stringify(items));
}
export function toggleRoutineCheck(id: string, dateKey: string): void {
  const items = loadRoutine().map((item) => {
    if (item.id !== id) return item;
    const checked = item.checkedDates.includes(dateKey);
    return { ...item, checkedDates: checked ? item.checkedDates.filter((d) => d !== dateKey) : [...item.checkedDates, dateKey] };
  });
  saveRoutine(items);
}
export function addRoutineItem(data: Omit<RoutineItem, "id" | "checkedDates">): RoutineItem {
  const items = loadRoutine();
  const newItem: RoutineItem = { ...data, id: crypto.randomUUID(), checkedDates: [] };
  saveRoutine([...items, newItem]);
  return newItem;
}
export function updateRoutineItem(updated: RoutineItem): void {
  saveRoutine(loadRoutine().map((i) => (i.id === updated.id ? updated : i)));
}
export function deleteRoutineItem(id: string): void {
  saveRoutine(loadRoutine().filter((i) => i.id !== id));
}

// ─── Improvements ─────────────────────────────────────────────────────────────
const I = "dashboard_improvements_v1";

export function loadImprovements(): ImprovementItem[] {
  if (typeof window === "undefined") return getDefaultImprovements();
  const raw = localStorage.getItem(k(I));
  if (!raw) { const d = getDefaultImprovements(); localStorage.setItem(k(I), JSON.stringify(d)); return d; }
  return JSON.parse(raw) as ImprovementItem[];
}
export function saveImprovements(items: ImprovementItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(k(I), JSON.stringify(items));
}
export function addImprovement(data: Omit<ImprovementItem, "id" | "no">): ImprovementItem {
  const items = loadImprovements();
  const maxNo = items.reduce((m, i) => Math.max(m, i.no), 0);
  const newItem: ImprovementItem = { ...data, id: crypto.randomUUID(), no: maxNo + 1 };
  saveImprovements([...items, newItem]);
  return newItem;
}
export function updateImprovement(updated: ImprovementItem): void {
  saveImprovements(loadImprovements().map((i) => (i.id === updated.id ? updated : i)));
}
export function deleteImprovement(id: string): void {
  saveImprovements(loadImprovements().filter((i) => i.id !== id));
}

// ─── Gantt ────────────────────────────────────────────────────────────────────
const GA = "dashboard_gantt_v1";

export function loadGanttTasks(): GanttTask[] {
  if (typeof window === "undefined") return getDefaultGanttTasks();
  const raw = localStorage.getItem(k(GA));
  if (!raw) { const d = getDefaultGanttTasks(); localStorage.setItem(k(GA), JSON.stringify(d)); return d; }
  return JSON.parse(raw) as GanttTask[];
}
export function saveGanttTasks(tasks: GanttTask[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(k(GA), JSON.stringify(tasks));
}
export function addGanttTask(data: Omit<GanttTask, "id">): GanttTask {
  const tasks = loadGanttTasks();
  const newTask: GanttTask = { ...data, id: crypto.randomUUID() };
  saveGanttTasks([...tasks, newTask]);
  return newTask;
}
export function updateGanttTask(updated: GanttTask): void {
  saveGanttTasks(loadGanttTasks().map((t) => (t.id === updated.id ? updated : t)));
}
export function deleteGanttTask(id: string): void {
  saveGanttTasks(loadGanttTasks().filter((t) => t.id !== id));
}

// ─── Export All (for CSV) ─────────────────────────────────────────────────────
export function exportAllData() {
  return {
    goals: loadGoals(),
    routine: loadRoutine(),
    improvements: loadImprovements(),
    gantt: loadGanttTasks(),
  };
}

// ─── Default Data ─────────────────────────────────────────────────────────────
function getDefaultGoals(): Goal[] {
  return [
    { id: "g1", no: 1, priority: "◎", category: "充填・調理課", objective: "お申し出・再調理0件維持", specificActions: "朝礼AIの活用。現場での声掛け。1ON1でのヒアリング。負荷が急にかかりすぎるとミスが増える。とくに5・6月は要注意。", kpi: "0件維持", deadline: "通年", resultComment: "", status: "in_progress" },
    { id: "g2", no: 2, priority: "◎", category: "充填・調理課", objective: "再調理ゼロの仕組み確立", specificActions: "ルール洗い出し（Apr W1～2）→対策合意→徹底運用。", kpi: "調理課再調理件数", deadline: "通年（できれば早めに結果だす）", resultComment: "", status: "in_progress" },
    { id: "g3", no: 3, priority: "○", category: "充填・調理課", objective: "充填内で毎月テーマ決めて改善を行う", specificActions: "お申し出MTGでテーマ決め。担当者決める。", kpi: "月1テーマ 年12件", deadline: "通年", resultComment: "", status: "in_progress" },
    { id: "g4", no: 4, priority: "◎", category: "荷受け業務", objective: "荷受け業務流れ完全習得（1日→週→月）", specificActions: "日次→週次→月次の順で段階的に習得。不明点はその日に解消。", kpi: "", deadline: "6月末", resultComment: "", status: "in_progress" },
    { id: "g5", no: 5, priority: "○", category: "荷受け業務", objective: "無駄作業廃止", specificActions: "現場観察・ヒアリング→改善案へ反映", kpi: "", deadline: "", resultComment: "", status: "not_started" },
    { id: "g7", no: 7, priority: "○", category: "製造管理・荷受け業務", objective: "週次改善案 年間50件", specificActions: "毎週1件以上の改善アイデアを改善台帳へ", kpi: "年間50件 / 週1件", deadline: "通年", resultComment: "", status: "in_progress" },
    { id: "g8", no: 8, priority: "◎", category: "製造管理", objective: "業務フロー完全習得", specificActions: "OJTで日次→週次→月次と段階的に習得。不明点即解消。", kpi: "独立対応率100%", deadline: "7月末", resultComment: "", status: "in_progress" },
    { id: "g9", no: 9, priority: "○", category: "製造管理", objective: "ASP習得", specificActions: "基本のASPを上期で覚える。不明点即解消。", kpi: "独立対応率100%", deadline: "8月末", resultComment: "", status: "not_started" },
    { id: "g10", no: 10, priority: "◎", category: "製造管理", objective: "発注業務", specificActions: "基本の発注を上期で覚える。不明点即解消。", kpi: "独立対応率100%", deadline: "10月末", resultComment: "", status: "not_started" },
    { id: "g11", no: 11, priority: "○", category: "製造管理", objective: "寿作業", specificActions: "基本の寿作業を上期で覚える。不明点即解消。", kpi: "独立対応率100%", deadline: "10月末", resultComment: "", status: "not_started" },
    { id: "g12", no: 12, priority: "◎", category: "製造管理", objective: "追加調理・ロス削減", specificActions: "工程別原因分析→工程表再調整→月次トラック", kpi: "トラック", deadline: "年内に目途", resultComment: "", status: "not_started" },
    { id: "g14", no: 14, priority: "◎", category: "人材育成", objective: "井上さんのリーダー候補育成", specificActions: "目標設定→１ON１時進捗確認→フィードバック。半期で2件実施。", kpi: "半期で2件実施", deadline: "9月末", resultComment: "", status: "in_progress" },
    { id: "g15", no: 15, priority: "◎", category: "人材育成", objective: "本平さんのリーダー候補育成", specificActions: "目標設定→１ON１時進捗確認→フィードバック。半期で2件実施。", kpi: "半期で2件実施", deadline: "", resultComment: "", status: "in_progress" },
    { id: "g16", no: 16, priority: "◎", category: "外部・社内活動", objective: "FOOMA", specificActions: "5月中に過去のFOOMA内容・業者調べて目途つけて", kpi: "", deadline: "通年", resultComment: "", status: "not_started" },
    { id: "g17", no: 17, priority: "○", category: "外部・社内活動", objective: "面接", specificActions: "面接の流れを自分なりにまとめる。", kpi: "溝下さんと2人体勢", deadline: "通年", resultComment: "", status: "not_started" },
    { id: "g18", no: 18, priority: "◎", category: "外部・社内活動", objective: "工場会議", specificActions: "工場会議に参加。議事録担当。", kpi: "", deadline: "通年", resultComment: "", status: "not_started" },
  ];
}

function getDefaultRoutine(): RoutineItem[] {
  return [
    { id: "r1", frequency: "毎日 午前", task: "製造管理業務（1日の流れ確認・指示・記録）", requiredTime: "4h", comment: "", checkedDates: [] },
    { id: "r2", frequency: "毎日 午後", task: "充填・調理課業務（現場確認・品質チェック）", requiredTime: "3h", comment: "", checkedDates: [] },
    { id: "r3", frequency: "1週目", task: "充填お申し出MTG", requiredTime: "1時間", comment: "", checkedDates: [] },
    { id: "r4", frequency: "2週目", task: "品前・安全衛生資料確認", requiredTime: "30分", comment: "", checkedDates: [] },
    { id: "r5", frequency: "2週目", task: "調理課再調理ＭＴＧ", requiredTime: "1時間", comment: "", checkedDates: [] },
    { id: "r6", frequency: "3週目", task: "ネジ・異物チェック確認", requiredTime: "5分", comment: "", checkedDates: [] },
    { id: "r7", frequency: "3週目", task: "シフト確認・勤次郎打ち込み", requiredTime: "30分", comment: "", checkedDates: [] },
    { id: "r8", frequency: "4週目", task: "勤怠漏れ確認", requiredTime: "15分", comment: "", checkedDates: [] },
    { id: "r9", frequency: "毎週", task: "改善案立案・台帳記録（週1件以上）", requiredTime: "30分", comment: "", checkedDates: [] },
    { id: "r10", frequency: "毎月", task: "1on1（メンバー面談）", requiredTime: "30分/人", comment: "", checkedDates: [] },
  ];
}

function getDefaultImprovements(): ImprovementItem[] {
  return [
    { id: "i1", no: 1, proposalDate: "4月 W1", problem: "フィルムの価格高騰", improvementContent: "切り替え枚数削減", action: "切り替え枚数を差し引いて詰める。システム変更で差し引き枚数を表示してもらう。", expectedEffect: "切り替え分のフィルム削減", person: "西本", deadline: "4月末", status: "進行中", effectConfirmation: "" },
    { id: "i2", no: 2, proposalDate: "4月 W1", problem: "フィルムの価格高騰", improvementContent: "充填スタート時の調整分削減", action: "製造毎の設定値を写真で撮り、AIに投げて製造アイテムと紐づけて設定値が一覧で表示されるようにする。", expectedEffect: "調整分のフィルム、リバック無駄作業削減", person: "西本", deadline: "4月末", status: "進行中", effectConfirmation: "" },
  ];
}

function getDefaultGanttTasks(): GanttTask[] {
  return [
    { id: "a1", no: "A1", priority: "○", category: "A. 製造管理業務", taskName: "業務フロー完全習得", specificApproach: "OJT研修：日次→週次→月次", deadline: "7月末", startWeek: 1, endWeek: 16, color: "#6b7280" },
    { id: "a2", no: "A2", priority: "○", category: "A. 製造管理業務", taskName: "ASP（綴め作業）", specificApproach: "製造管理必須基本スキル", deadline: "1ヶ月", startWeek: 1, endWeek: 5, color: "#6b7280" },
    { id: "a3", no: "A3", priority: "○", category: "A. 製造管理業務", taskName: "発注（H在庫表）", specificApproach: "製造管理必須基本スキル", deadline: "1.5ヶ月", startWeek: 1, endWeek: 7, color: "#6b7280" },
    { id: "a4", no: "A4", priority: "○", category: "A. 製造管理業務", taskName: "寿作業", specificApproach: "製造管理必須基本スキル", deadline: "1ヶ月", startWeek: 1, endWeek: 5, color: "#6b7280" },
    { id: "a5", no: "A5", priority: "○", category: "A. 製造管理業務", taskName: "週1改善案の立案・実施", specificApproach: "毎週1件以上の改善アイデア", deadline: "通年 週1件以上", startWeek: 1, endWeek: 20, color: "#6b7280" },
    { id: "a6", no: "A6", priority: "○", category: "A. 製造管理業務", taskName: "追加調理・工程ロス削減", specificApproach: "工程別原因分析→工程表再調整", deadline: "11～12月", startWeek: 12, endWeek: 20, color: "#6b7280" },
    { id: "a7", no: "A7", priority: "△", category: "A. 製造管理業務", taskName: "在庫管理デジタル化", specificApproach: "在庫管理の問題点洗い出し", deadline: "1～3月", startWeek: 1, endWeek: 3, color: "#9ca3af" },
    { id: "b1", no: "B1", priority: "○", category: "B. 荷受け業務", taskName: "荷受け業務流れ完全習得（1日→週→月）", specificApproach: "OJT研修：日次→週次→月次", deadline: "6月末", startWeek: 5, endWeek: 13, color: "#6b7280" },
    { id: "b2", no: "B2", priority: "○", category: "B. 荷受け業務", taskName: "棚部作業習得", specificApproach: "製造管理必須基本スキル", deadline: "3ヶ月", startWeek: 9, endWeek: 17, color: "#6b7280" },
    { id: "b3", no: "B3", priority: "○", category: "B. 荷受け業務", taskName: "検品作業習得", specificApproach: "基本の検品スキル習得", deadline: "1ヶ月", startWeek: 9, endWeek: 13, color: "#6b7280" },
    { id: "b4", no: "B4", priority: "○", category: "B. 荷受け業務", taskName: "次工程も含めた動線改善", specificApproach: "次工程がやりやすいレイアウト", deadline: "6月", startWeek: 9, endWeek: 13, color: "#6b7280" },
    { id: "b5", no: "B5", priority: "○", category: "B. 荷受け業務", taskName: "無駄作業の洗い出し", specificApproach: "現場観察＋ヒアリング→改善へ", deadline: "7月", startWeek: 9, endWeek: 17, color: "#6b7280" },
    { id: "b6", no: "B6", priority: "△", category: "B. 荷受け業務", taskName: "ペーパーレス化・デジタル化", specificApproach: "荷受け記録のデジタル化", deadline: "8月", startWeek: 13, endWeek: 20, color: "#9ca3af" },
    { id: "c1", no: "C1", priority: "○", category: "C. 充填・調理課", taskName: "毎月テーマ設定・品質改善", specificApproach: "お申し出MTG時テーマ決め", deadline: "通年 月1テーマ", startWeek: 1, endWeek: 20, color: "#6b7280" },
    { id: "c2", no: "C2", priority: "○", category: "C. 充填・調理課", taskName: "お申し出・再調理0件維持", specificApproach: "朝礼AIの活用、充填内お申し出管理", deadline: "通年", startWeek: 1, endWeek: 20, color: "#6b7280" },
    { id: "c3", no: "C3", priority: "○", category: "C. 充填・調理課", taskName: "調理課再調理ゼロ", specificApproach: "ルール洗い出し→毎月MTG", deadline: "通年", startWeek: 1, endWeek: 20, color: "#6b7280" },
    { id: "c5", no: "C5", priority: "○", category: "C. 充填・調理課", taskName: "品前・安全衛生資料確認", specificApproach: "毎月W1に確認", deadline: "月1回", startWeek: 1, endWeek: 20, color: "#6b7280" },
    { id: "c6", no: "C6", priority: "○", category: "C. 充填・調理課", taskName: "フィルム使用量削減", specificApproach: "切り替え枚数削減", deadline: "通年", startWeek: 1, endWeek: 20, color: "#6b7280" },
    { id: "c7", no: "C7", priority: "○", category: "C. 充填・調理課", taskName: "1on1 月次実施（全員）", specificApproach: "毎月W1に各メンバーと面談", deadline: "通年 実施率100%", startWeek: 1, endWeek: 20, color: "#6b7280" },
    { id: "c8", no: "C8", priority: "○", category: "C. 充填・調理課", taskName: "井上さんのリーダー候補育成", specificApproach: "目標設定→進捗確認→フィードバック", deadline: "半期で2件実施", startWeek: 1, endWeek: 20, color: "#6b7280" },
    { id: "c9", no: "C9", priority: "△", category: "C. 充填・調理課", taskName: "本平さんのリーダー候補育成", specificApproach: "目標設定→進捗確認→フィードバック", deadline: "半期で2件実施", startWeek: 1, endWeek: 20, color: "#9ca3af" },
    { id: "c10", no: "C10", priority: "△", category: "C. 充填・調理課", taskName: "AI設定（製造注意点）", specificApproach: "毎月AIシステムの更新", deadline: "毎月更新", startWeek: 1, endWeek: 20, color: "#9ca3af" },
    { id: "d1", no: "D1", priority: "△", category: "D. 外部・社内活動", taskName: "面接", specificApproach: "面接の流れ自分なりにまとめる", deadline: "通年", startWeek: 1, endWeek: 20, color: "#9ca3af" },
    { id: "d2", no: "D2", priority: "○", category: "D. 外部・社内活動", taskName: "FOOMA視察・最新品調査", specificApproach: "食品機械展示会", deadline: "6月 資料作成", startWeek: 5, endWeek: 13, color: "#6b7280" },
    { id: "d3", no: "D3", priority: "△", category: "D. 外部・社内活動", taskName: "工場会議参加・議事録", specificApproach: "工場会議に参加。", deadline: "通年", startWeek: 1, endWeek: 20, color: "#9ca3af" },
  ];
}
