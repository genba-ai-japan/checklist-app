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
