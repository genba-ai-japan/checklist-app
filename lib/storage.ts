import { MachineRecord } from "@/types";

const STORAGE_KEY = "factory_machine_records_v2";

function loadAll(): MachineRecord[] {
  if (typeof window === "undefined") return getSampleData();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
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

export async function getAllRecords(): Promise<MachineRecord[]> {
  return loadAll().sort(
    (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
  );
}

export async function getRecord(id: string): Promise<MachineRecord | null> {
  return loadAll().find((r) => r.id === id) ?? null;
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

export async function deleteRecord(id: string): Promise<void> {
  saveAll(loadAll().filter((r) => r.id !== id));
}

export async function searchRecords(query: string): Promise<MachineRecord[]> {
  const all = await getAllRecords();
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((r) => r.productName.toLowerCase().includes(q));
}

function getSampleData(): MachineRecord[] {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  return [
    {
      id: "sample-001",
      productName: "豆腐ハンバーグ",
      contentVolume: "150g",
      packType: "トレーパック",
      machineNumber: "A-1",
      settingsMemo: "シール温度180℃、充填速度30個/分、窒素ガス充填70%",
      photoUrl: "",
      registeredAt: daysAgo(1),
    },
    {
      id: "sample-002",
      productName: "豆腐ハンバーグ",
      contentVolume: "200g",
      packType: "トレーパック",
      machineNumber: "A-1",
      settingsMemo: "シール温度182℃、充填速度25個/分（200g品はスピード落とす）",
      photoUrl: "",
      registeredAt: daysAgo(5),
    },
    {
      id: "sample-003",
      productName: "野菜炒めセット",
      contentVolume: "300g",
      packType: "袋詰め",
      machineNumber: "B-2",
      settingsMemo: "シール温度175℃、20袋/分、脱酸素剤封入",
      photoUrl: "",
      registeredAt: daysAgo(3),
    },
    {
      id: "sample-004",
      productName: "唐揚げ弁当",
      contentVolume: "450g",
      packType: "弁当容器",
      machineNumber: "C-3",
      settingsMemo: "シール温度170℃、充填温度80℃、充填後は速やかに冷却",
      photoUrl: "",
      registeredAt: daysAgo(7),
    },
  ];
}
