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

export interface ProcessStep {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface ImprovementProduct {
  id: string;
  name: string;
  url: string;
  imageUrl: string;  // Base64
}

export interface ImprovementMetric {
  id: string;
  label: string;    // 指標名 e.g. "作業時間", "生産効率"
  unit: string;     // 単位 e.g. "時間/日", "個/時間", "%"
  currentValue: number;
  targetValue: number;
}

export interface Improvement {
  id: string;
  stepId: string;
  title: string;
  description: string;
  products: ImprovementProduct[];
  metrics: ImprovementMetric[];
  createdAt: string;
}
