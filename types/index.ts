export interface MachineRecord {
  id: string;
  productName: string;    // 製品名
  contentVolume: string;  // 内容量
  packType: string;       // パック形態
  machineNumber: string;  // 機械番号
  settingsMemo: string;   // 設定値メモ
  photoUrl: string;       // 写真（Base64）
  registeredAt: string;   // 登録日時（ISO string）
}

export type Priority = '◎' | '○' | '△';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed';

export interface Goal {
  id: string;
  no: number;
  priority: Priority;
  category: string;
  objective: string;
  specificActions: string;
  kpi: string;
  deadline: string;
  resultComment: string;
  status: GoalStatus;
}

export interface RoutineItem {
  id: string;
  frequency: string;      // 毎日 午前, 1週目, 毎週, 毎月, etc.
  task: string;
  requiredTime: string;
  comment: string;
  checkedDates: string[]; // ISO date strings when checked
}

export type ImprovementStatus = '未着手' | '進行中' | '完了';

export interface ImprovementItem {
  id: string;
  no: number;
  proposalDate: string;   // 4月 W1, etc.
  problem: string;
  improvementContent: string;
  action: string;
  expectedEffect: string;
  person: string;
  deadline: string;
  status: ImprovementStatus;
  effectConfirmation: string;
}

export interface GanttTask {
  id: string;
  no: string;
  priority: Priority;
  category: string;
  taskName: string;
  specificApproach: string;
  deadline: string;
  startWeek: number;   // 1 = April W1
  endWeek: number;
  color: string;
}
