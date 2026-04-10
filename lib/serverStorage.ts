import fs from "fs";
import path from "path";
import { Improvement } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "improvements.json");

interface DataStore {
  lastModified: string;
  items: Improvement[];
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): DataStore {
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { lastModified: new Date().toISOString(), items: [] };
  }
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as DataStore;
}

function writeStore(store: DataStore): void {
  ensureDir();
  store.lastModified = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function getAllImprovements(): Improvement[] {
  return readStore().items;
}

export function getLastModified(): string {
  return readStore().lastModified;
}

export function getImprovement(id: string): Improvement | null {
  return readStore().items.find((i) => i.id === id) ?? null;
}

export function createImprovement(
  data: Omit<Improvement, "id" | "createdAt">
): Improvement {
  const store = readStore();
  const item: Improvement = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  store.items.push(item);
  writeStore(store);
  return item;
}

export function updateImprovement(improvement: Improvement): void {
  const store = readStore();
  const idx = store.items.findIndex((i) => i.id === improvement.id);
  if (idx >= 0) {
    store.items[idx] = improvement;
    writeStore(store);
  }
}

export function deleteImprovement(id: string): void {
  const store = readStore();
  store.items = store.items.filter((i) => i.id !== id);
  writeStore(store);
}
