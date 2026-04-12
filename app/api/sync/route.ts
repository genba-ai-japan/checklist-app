import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".sync-data.json");

type AccountData = { version: number; data: Record<string, unknown> };
type Store = Record<string, AccountData>;

// In-memory cache — shared across requests within the same server process
let cache: Store | null = null;

function readStore(): Store {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Store;
  } catch {
    cache = {};
  }
  return cache;
}

function writeStore(store: Store): void {
  cache = store;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store), "utf-8");
  } catch {
    /* ignore */
  }
}

/** GET /api/sync?accountId=X&since=N  →  {changed, version, data?} */
export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId") ?? "default";
  const since = Number(req.nextUrl.searchParams.get("since") ?? "0");

  const store = readStore();
  const account = store[accountId];

  if (!account || account.version <= since) {
    return NextResponse.json({ changed: false, version: account?.version ?? 0 });
  }

  return NextResponse.json({ changed: true, version: account.version, data: account.data });
}

/** POST /api/sync  body: {accountId, key, data}  →  {ok, version} */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { accountId: string; key: string; data: unknown };
  const { accountId, key, data } = body;

  if (!accountId || !key) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const store = readStore();
  const version = Date.now();

  if (!store[accountId]) {
    store[accountId] = { version, data: {} };
  }
  store[accountId].data[key] = data;
  store[accountId].version = version;

  writeStore(store);

  return NextResponse.json({ ok: true, version });
}
