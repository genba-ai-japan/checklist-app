/**
 * データアクセス層
 * ローカルストレージを使用。将来的にSupabaseへの移行が容易な構成。
 * Suapabaseへ移行する場合は、このファイルの実装を切り替えるだけでOK。
 */

import { MachineRecord, ProductSummary } from "@/types";

const STORAGE_KEY = "factory_machine_records";

// ── ローカルストレージ実装 ────────────────────────────────────────────────

function loadAll(): MachineRecord[] {
  if (typeof window === "undefined") return getSampleData();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // 初回はサンプルデータを投入
    const sample = getSampleData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    return sample;
  }
  return JSON.parse(raw) as MachineRecord[];
}

function saveAll(records: MachineRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function getAllRecords(): Promise<MachineRecord[]> {
  const records = loadAll();
  return records.sort(
    (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
  );
}

export async function getRecord(id: string): Promise<MachineRecord | null> {
  const records = loadAll();
  return records.find((r) => r.id === id) ?? null;
}

export async function createRecord(
  data: Omit<MachineRecord, "id" | "registeredAt">
): Promise<MachineRecord> {
  const records = loadAll();
  const newRecord: MachineRecord = {
    ...data,
    id: crypto.randomUUID(),
    registeredAt: new Date().toISOString(),
  };
  records.push(newRecord);
  saveAll(records);
  return newRecord;
}

export async function updateRecord(
  id: string,
  data: Partial<MachineRecord>
): Promise<MachineRecord | null> {
  const records = loadAll();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...data };
  saveAll(records);
  return records[idx];
}

export async function deleteRecord(id: string): Promise<void> {
  const records = loadAll();
  saveAll(records.filter((r) => r.id !== id));
}

// ── 検索・集計 ────────────────────────────────────────────────────────────

export async function searchRecords(query: string): Promise<MachineRecord[]> {
  const all = await getAllRecords();
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter(
    (r) =>
      r.productName.toLowerCase().includes(q) ||
      r.machineName.toLowerCase().includes(q) ||
      r.packType.toLowerCase().includes(q) ||
      r.lineName.toLowerCase().includes(q)
  );
}

export async function filterRecords(filters: {
  productName?: string;
  machineName?: string;
  packType?: string;
}): Promise<MachineRecord[]> {
  const all = await getAllRecords();
  return all.filter((r) => {
    if (filters.productName && r.productName !== filters.productName) return false;
    if (filters.machineName && r.machineName !== filters.machineName) return false;
    if (filters.packType && r.packType !== filters.packType) return false;
    return true;
  });
}

export async function getProductSummaries(query?: string): Promise<ProductSummary[]> {
  const all = await getAllRecords();
  const filtered = query
    ? all.filter((r) => r.productName.toLowerCase().includes(query.toLowerCase()))
    : all;

  const map = new Map<string, MachineRecord[]>();
  for (const r of filtered) {
    const key = r.productName;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const summaries: ProductSummary[] = [];
  for (const [productName, records] of map.entries()) {
    const sorted = [...records].sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
    summaries.push({
      productName,
      contentVolumes: [...new Set(records.map((r) => r.contentVolume).filter(Boolean))],
      machineNames: [...new Set(records.map((r) => r.machineName).filter(Boolean))],
      latestDate: sorted[0].registeredAt,
      latestPhotoUrl: sorted.find((r) => r.photoUrl)?.photoUrl ?? "",
      count: records.length,
    });
  }

  return summaries.sort(
    (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
  );
}

export async function getProductHistory(productName: string): Promise<MachineRecord[]> {
  const all = await getAllRecords();
  return all.filter((r) => r.productName === productName);
}

export async function getUniqueValues(
  field: keyof Pick<MachineRecord, "productName" | "machineName" | "packType">
): Promise<string[]> {
  const all = await getAllRecords();
  return [...new Set(all.map((r) => r[field]).filter(Boolean))].sort();
}

// ── サンプルデータ ─────────────────────────────────────────────────────────

function getSampleData(): MachineRecord[] {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  return [
    {
      id: "sample-001",
      productName: "豆腐ハンバーグ",
      contentVolume: "150g",
      packType: "トレーパック",
      machineName: "充填機A-1",
      lineName: "1号ライン",
      photoUrl: "",
      sealTemp: "180℃",
      fillTemp: "65℃",
      speed: "30個/分",
      printSettings: "賞味期限3日後・ロットNo.自動",
      otherSettings: "窒素ガス充填 70%",
      notes: "シール温度は季節により±5℃調整",
      remarks: "夏場は充填温度を下げること",
      registeredAt: daysAgo(1),
      registeredBy: "田中 一郎",
    },
    {
      id: "sample-002",
      productName: "豆腐ハンバーグ",
      contentVolume: "200g",
      packType: "トレーパック",
      machineName: "充填機A-1",
      lineName: "1号ライン",
      photoUrl: "",
      sealTemp: "182℃",
      fillTemp: "65℃",
      speed: "25個/分",
      printSettings: "賞味期限3日後・ロットNo.自動",
      otherSettings: "窒素ガス充填 70%",
      notes: "200g品はスピードを落とすこと",
      remarks: "",
      registeredAt: daysAgo(5),
      registeredBy: "田中 一郎",
    },
    {
      id: "sample-003",
      productName: "野菜炒めセット",
      contentVolume: "300g",
      packType: "袋詰め",
      machineName: "包装機B-2",
      lineName: "2号ライン",
      photoUrl: "",
      sealTemp: "175℃",
      fillTemp: "-",
      speed: "20袋/分",
      printSettings: "賞味期限5日後",
      otherSettings: "脱酸素剤封入",
      notes: "シール部に野菜が挟まらないよう注意",
      remarks: "定期的にシール部を清掃",
      registeredAt: daysAgo(3),
      registeredBy: "鈴木 花子",
    },
    {
      id: "sample-004",
      productName: "唐揚げ弁当",
      contentVolume: "450g",
      packType: "弁当容器",
      machineName: "充填機C-3",
      lineName: "3号ライン",
      photoUrl: "",
      sealTemp: "170℃",
      fillTemp: "80℃",
      speed: "15個/分",
      printSettings: "製造日当日・ロットNo.手動",
      otherSettings: "",
      notes: "充填後は速やかに冷却工程へ",
      remarks: "揚げ物の油分でシールが剥がれやすい",
      registeredAt: daysAgo(7),
      registeredBy: "山本 次郎",
    },
    {
      id: "sample-005",
      productName: "野菜炒めセット",
      contentVolume: "150g",
      packType: "袋詰め",
      machineName: "包装機B-3",
      lineName: "2号ライン",
      photoUrl: "",
      sealTemp: "172℃",
      fillTemp: "-",
      speed: "25袋/分",
      printSettings: "賞味期限5日後",
      otherSettings: "脱酸素剤封入",
      notes: "",
      remarks: "小袋タイプは別ラインで実施",
      registeredAt: daysAgo(10),
      registeredBy: "鈴木 花子",
    },
    {
      id: "sample-006",
      productName: "豆腐ハンバーグ",
      contentVolume: "150g",
      packType: "トレーパック",
      machineName: "充填機A-2",
      lineName: "1号ライン",
      photoUrl: "",
      sealTemp: "179℃",
      fillTemp: "65℃",
      speed: "30個/分",
      printSettings: "賞味期限3日後・ロットNo.自動",
      otherSettings: "窒素ガス充填 70%",
      notes: "A-2機は温度設定がA-1と若干異なる",
      remarks: "",
      registeredAt: daysAgo(15),
      registeredBy: "田中 一郎",
    },
  ];
}
